import { spawn, type ChildProcess } from "node:child_process";
import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { createServer as createHttpServer, request } from "node:http";
import { createServer as createTcpServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestContext } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

import EmbeddedPostgres from "embedded-postgres";
import { SMTPServer } from "smtp-server";

const host = "127.0.0.1";

async function listenOnAvailablePort() {
  const socket = createTcpServer();
  socket.listen(0, host);
  await once(socket, "listening");
  const address = socket.address();
  if (!address || typeof address === "string") throw new Error("Test listener is missing its local port");
  await new Promise<void>((resolve, reject) => socket.close((e) => e ? reject(e) : resolve()));
  return address.port;
}

function localUrl(port: number) {
  return `http://${host}:${port}`;
}

function fixtureToken(secret: string) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const claims = Buffer.from(JSON.stringify({ role: "anon", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
  const message = `${header}.${claims}`;
  return `${message}.${createHmac("sha256", secret).update(message).digest("base64url")}`;
}

async function ready(url: string, getFailure: () => string | undefined) {
  for (let attempt = 0; attempt < 100; attempt++) {
    const failure = getFailure();
    if (failure) throw new Error(failure);
    try {
      if ((await fetch(url, { signal: AbortSignal.timeout(1000) })).ok) return;
    } catch {
      // The loopback service may still be starting.
    }
    await delay(150);
  }
  throw new Error(`Local test service did not become ready: ${url}`);
}

export const nativeAuthBinary = process.env.MICOMERCIO_TEST_AUTH_BINARY;
export const nativeRestBinary = process.env.MICOMERCIO_TEST_REST_BINARY;

export async function startLocalStack(t: TestContext, options?: { otpSeconds?: number; resendSeconds?: number; verifyLimit?: number }) {
  if (!nativeAuthBinary || !nativeRestBinary) throw new Error("Set paths to the Supabase Auth and PostgREST test binaries");
  const cleanups: Array<() => Promise<unknown>> = [];
  t.after(async () => {
    const failures: unknown[] = [];
    for (const cleanup of cleanups.reverse()) {
      try { await cleanup(); } catch (error) { failures.push(error); }
    }
    if (failures.length) throw new AggregateError(failures, "Error closing the local Supabase test stack");
  });
  const [pgPort, authPort, restPort, nextPort] = await Promise.all([
    listenOnAvailablePort(), listenOnAvailablePort(), listenOnAvailablePort(), listenOnAvailablePort(),
  ]);
  if (new Set([pgPort, authPort, restPort, nextPort]).size !== 4) throw new Error("Test ports must be distinct");

  const pgPassword = randomUUID();
  const jwtSecret = randomBytes(48).toString("hex");
  const databaseDir = await mkdtemp(join(tmpdir(), "micomercioweb-auth-pg-"));
  const postgres = new EmbeddedPostgres({
    databaseDir, user: "postgres", password: pgPassword, port: pgPort, persistent: false,
    initdbFlags: ["--locale=C", "--encoding=UTF8"],
    postgresFlags: ["-h", host],
    onLog: () => {},
  });
  await postgres.initialise();
  await postgres.start();
  cleanups.push(() => postgres.stop());
  const db = postgres.getPgClient();
  await db.connect();
  cleanups.push(() => db.end());
  await db.query(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create role authenticator nologin noinherit;
    grant anon, authenticated, service_role to authenticator;
    create schema auth;
    create schema extensions;
    create extension if not exists pgcrypto with schema extensions;
    grant usage on schema auth to anon, authenticated;
  `);

  const messages: { addresses: string[]; source: string }[] = [];
  const mail = new SMTPServer({
    authOptional: true,
    disabledCommands: ["AUTH", "STARTTLS"],
    onData(stream, session, callback) {
      const chunks: Buffer[] = [];
      stream.on("data", (chunk: Buffer) => chunks.push(chunk));
      stream.on("end", () => {
        messages.push({ addresses: session.envelope.rcptTo.map(({ address }) => address), source: Buffer.concat(chunks).toString("utf8") });
        callback();
      });
      stream.on("error", callback);
    },
  });
  const smtpPort = await listenOnAvailablePort();
  await new Promise<void>((resolve) => { mail.listen(smtpPort, host, resolve); });
  cleanups.push(() => new Promise<void>((resolve) => mail.close(() => resolve())));

  const requests: Array<{ path: string; status: number }> = [];
  const gateway = createHttpServer((incoming, outgoing) => {
    const url = incoming.url ?? "/";
    if (url.startsWith("/templates/")) {
      const file = url === "/templates/confirmation" ? "confirmation.html" : url === "/templates/recovery" ? "recovery.html" : null;
      if (!file) { outgoing.writeHead(404).end(); return; }
      void readFile(join("supabase/templates", file)).then(
        (content) => outgoing.writeHead(200, { "Content-Type": "text/html" }).end(content),
        () => outgoing.writeHead(404).end(),
      );
      return;
    }
    const connection = url.startsWith("/auth/v1/") ? { port: authPort, path: url.slice(8) }
      : url.startsWith("/rest/v1/") ? { port: restPort, path: url.slice(8) } : null;
    if (!connection) { outgoing.writeHead(404).end(); return; }
    const upstream = request({
      hostname: host, ...connection, method: incoming.method,
      headers: { ...incoming.headers, "x-local-test-ip": incoming.socket.remoteAddress ?? host },
    }, (res) => {
      requests.push({ path: url.split("?")[0], status: res.statusCode ?? 502 });
      outgoing.writeHead(res.statusCode ?? 502, res.headers);
      res.pipe(outgoing);
    });
    upstream.on("error", () => outgoing.writeHead(502).end());
    incoming.pipe(upstream);
  });
  gateway.listen(0, host);
  await once(gateway, "listening");
  const gatewayAddress = gateway.address();
  if (!gatewayAddress || typeof gatewayAddress === "string") throw new Error("Test gateway has no local port");
  const supabaseUrl = localUrl(gatewayAddress.port);
  cleanups.push(() => new Promise<void>((resolve) => {
    gateway.close(() => resolve());
    gateway.closeAllConnections();
  }));

  const baseEnv: NodeJS.ProcessEnv = {
    NODE_ENV: "production", PATH: process.env.PATH, SystemRoot: process.env.SystemRoot,
    TEMP: process.env.TEMP, TMP: process.env.TMP,
  };
  const dbUrl = `postgres://postgres:${pgPassword}@${host}:${pgPort}/postgres?sslmode=disable`;
  const nextUrl = localUrl(nextPort);
  const redact = (value: string) => value.replaceAll(pgPassword, "[test password]").replaceAll(jwtSecret, "[test secret]");
  function launch(command: string, args: string[], env: NodeJS.ProcessEnv) {
    const child: ChildProcess = spawn(command, args, { env, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    let spawnError = "";
    child.on("error", (error) => { spawnError = redact(error.message); });
    const add = (data: Buffer) => { output = (output + redact(data.toString())).slice(-4000); };
    child.stdout?.on("data", add);
    child.stderr?.on("data", add);
    const done = new Promise<number | null>((resolve) => {
      child.once("close", resolve);
    });
    cleanups.push(async () => {
      if (child.exitCode === null && !spawnError) child.kill();
      await done;
    });
    return { done, logs: () => output, failure: () => spawnError || (child.exitCode !== null
      ? output || `Local test service exited with code ${child.exitCode}` : undefined) };
  }

  const authEnv = {
    ...baseEnv,
    API_EXTERNAL_URL: `${supabaseUrl}/auth/v1`,
    GOTRUE_API_HOST: host,
    PORT: String(authPort),
    GOTRUE_SITE_URL: nextUrl,
    GOTRUE_URI_ALLOW_LIST: `${nextUrl}/**`,
    GOTRUE_DB_DRIVER: "postgres",
    GOTRUE_DB_DATABASE_URL: `${dbUrl}&search_path=auth%2Cpublic%2Cextensions`,
    GOTRUE_DB_NAMESPACE: "auth",
    GOTRUE_JWT_SECRET: jwtSecret,
    GOTRUE_JWT_AUD: "authenticated",
    GOTRUE_JWT_DEFAULT_GROUP_NAME: "authenticated",
    GOTRUE_JWT_ADMIN_ROLES: "service_role",
    GOTRUE_EXTERNAL_EMAIL_ENABLED: "true",
    GOTRUE_DISABLE_SIGNUP: "false",
    GOTRUE_PASSWORD_MIN_LENGTH: "12",
    GOTRUE_MAILER_AUTOCONFIRM: "false",
    GOTRUE_MAILER_OTP_LENGTH: "6",
    GOTRUE_MAILER_OTP_EXP: String(options?.otpSeconds ?? 600),
    GOTRUE_MAILER_URLPATHS_RECOVERY: "/auth/v1/verify",
    GOTRUE_MAILER_URLPATHS_EMAIL_CHANGE: "/auth/v1/verify",
    GOTRUE_RATE_LIMIT_EMAIL_SENT: "100",
    GOTRUE_RATE_LIMIT_VERIFY: String(options?.verifyLimit ?? 30),
    GOTRUE_RATE_LIMIT_HEADER: "X-Local-Test-IP",
    GOTRUE_SMTP_HOST: host,
    GOTRUE_SMTP_PORT: String(smtpPort),
    GOTRUE_SMTP_ADMIN_EMAIL: "no-responder@example.test",
    GOTRUE_SMTP_MAX_FREQUENCY: `${options?.resendSeconds ?? 60}s`,
  };
  for (const [file, envName] of [["confirmation", "GOTRUE_MAILER_TEMPLATES_CONFIRMATION"], ["recovery", "GOTRUE_MAILER_TEMPLATES_RECOVERY"]]) {
    try {
      await readFile(join("supabase/templates", `${file}.html`));
      Object.assign(authEnv, { [envName]: `${supabaseUrl}/templates/${file}` });
    } catch {
      // An earlier spec may still use the vendor's default template.
    }
  }
  const migrated = launch(nativeAuthBinary, ["migrate"], authEnv);
  if ((await migrated.done) !== 0) throw new Error(migrated.failure() ?? "Supabase Auth migration failed");
  const migrationPath = "supabase/migrations";
  for (const name of (await readdir(migrationPath)).filter((name) => name.endsWith(".sql")).sort()) {
    await db.query(await readFile(join(migrationPath, name), "utf8"));
  }
  const auth = launch(nativeAuthBinary, ["serve"], authEnv);
  await ready(`${localUrl(authPort)}/health`, auth.failure);

  const rest = launch(nativeRestBinary, [], {
    ...baseEnv,
    PGRST_DB_URI: dbUrl,
    PGRST_DB_SCHEMAS: "public",
    PGRST_DB_ANON_ROLE: "anon",
    PGRST_JWT_SECRET: jwtSecret,
    PGRST_SERVER_HOST: host,
    PGRST_SERVER_PORT: String(restPort),
  });
  await ready(`${localUrl(restPort)}/`, rest.failure);
  const key = fixtureToken(jwtSecret);
  const next = launch(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", host, "--port", String(nextPort)], {
    ...baseEnv,
    NEXT_TELEMETRY_DISABLED: "1",
    SUPABASE_URL: supabaseUrl,
    SUPABASE_PUBLISHABLE_KEY: key,
    APP_ORIGIN: nextUrl,
  });
  await ready(nextUrl, next.failure);
  return { db, messages, requests, nextUrl, supabaseUrl, publishableKey: key, authLogs: auth.logs };
}
