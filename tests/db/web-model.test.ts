import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, readdir, readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import EmbeddedPostgres from "embedded-postgres";
import type { Client } from "pg";

let server: EmbeddedPostgres;
let owner: Client;
let started = false;
const users = {
  alice: randomUUID(),
  bob: randomUUID(),
  admin: randomUUID(),
  inactive: randomUUID(),
  unverified: randomUUID(),
};
const initialSlot = randomUUID();

async function openPort(): Promise<number> {
  const listener = createServer();
  await new Promise<void>((resolve, reject) => {
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", resolve);
  });
  const selected = listener.address();
  await new Promise<void>((resolve, reject) => listener.close((error) => error ? reject(error) : resolve()));
  assert.ok(selected && typeof selected !== "string");
  return selected.port;
}

before(async () => {
  const databaseDir = await mkdtemp(join(tmpdir(), "micomercioweb-pg-"));
  server = new EmbeddedPostgres({
    databaseDir,
    user: "postgres",
    password: randomUUID(),
    port: await openPort(),
    persistent: false,
    initdbFlags: ["--locale=C", "--encoding=UTF8"],
    postgresFlags: ["-h", "127.0.0.1"],
    onLog: () => {},
  });
  await server.initialise();
  await server.start();
  started = true;
  owner = server.getPgClient();
  await owner.connect();
  await owner.query(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create table auth.users (
      id uuid primary key,
      email text,
      email_confirmed_at timestamptz,
      raw_user_meta_data jsonb default '{}'::jsonb
    );
    create table auth.identities (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id),
      identity_data jsonb
    );
    create table auth.sessions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id),
      not_after timestamptz
    );
    create function auth.uid() returns uuid language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;
  `);
  const migrationPath = "supabase/migrations";
  for (const file of (await readdir(migrationPath)).filter((name) => name.endsWith(".sql")).sort()) {
    await owner.query(await readFile(join(migrationPath, file), "utf8"));
  }
  let index = 0;
  for (const [key, user] of Object.entries(users)) {
    await owner.query("insert into auth.users (id) values ($1)", [user]);
    await owner.query(`
      insert into public.profiles (user_id, given_names, family_names, national_id, mobile, email, verified_at, disabled_at)
      values ($1, 'Usuario', 'De Prueba', $2, '0900000000', $3, $4, $5)
    `, [user, `000000000${++index}`, `${key}@example.test`,
      key === "unverified" ? null : new Date(), key === "inactive" ? new Date() : null]);
  }
  await owner.query("insert into public.administrators(user_id) values ($1)", [users.admin]);
  await owner.query("insert into public.pickup_slots(id, service_date, starts_at, capacity) values ($1, current_date, '12:00', 5)", [initialSlot]);
});

after(async () => {
  if (owner) await owner.end();
  if (started) await server.stop();
});

async function asRole<T>(role: "anon" | "authenticated", user: string | null, action: (db: Client) => Promise<T>) {
  const db = server.getPgClient();
  await db.connect();
  try {
    const session = user ? (await owner.query<{ id: string }>(
      "insert into auth.sessions(user_id) values ($1) returning id", [user],
    )).rows[0].id : null;
    await db.query(role === "authenticated" ? "set role authenticated" : "set role anon");
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [user ?? ""]);
    await db.query("select set_config('request.jwt.claims', $1, false)", [JSON.stringify({ session_id: session })]);
    return await action(db);
  } finally {
    await db.end();
  }
}

const code = (expected: string) => (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error && error.code === expected;

function submit(db: Client, user: string, slot: string, key = randomUUID()) {
  return db.query<{ id: string }>(`
    insert into public.orders(user_id, slot_id, request_key, estimated_total_minor, currency)
    values ($1, $2, $3, 250, 'USD') returning id
  `, [user, slot, key]);
}

test("RLS only returns own data and blocks attempts to write with a different owner", async () => {
  const mine = await submit(owner, users.alice, initialSlot);
  const theirs = await submit(owner, users.bob, initialSlot);
  await owner.query(`
    insert into public.order_items(order_id, variant_id, product_name, presentation, unit, quantity, unit_price_minor)
    values ($1, 'demo-variant', 'Producto de prueba', 'Paquete', 'paquete', 1, 250)
  `, [theirs.rows[0].id]);
  await asRole("authenticated", users.alice, async (db) => {
    assert.deepEqual((await db.query("select id from public.orders")).rows, mine.rows);
    assert.equal((await db.query("select * from public.order_items where order_id = $1", [theirs.rows[0].id])).rowCount, 0);
    assert.deepEqual((await db.query("select user_id from public.profiles")).rows, [{ user_id: users.alice }]);
    await db.query("insert into public.cart_items(user_id, variant_id, quantity) values ($1, 'demo-arroz-1-kg', 1)", [users.alice]);
    await assert.rejects(db.query("insert into public.cart_items(user_id, variant_id, quantity) values ($1, 'demo-arroz-1-kg', 1)", [users.bob]), code("42501"));
    await assert.rejects(db.query("insert into public.administrators(user_id) values ($1)", [users.alice]), code("42501"));
    await assert.rejects(submit(db, users.alice, initialSlot), code("42501"));
  });
  await asRole("authenticated", users.inactive, async (db) => {
    assert.equal((await db.query("select user_id from public.profiles")).rowCount, 0);
  });
  await asRole("authenticated", users.unverified, async (db) => {
    assert.equal((await db.query("select user_id from public.profiles")).rowCount, 0);
  });
  await asRole("anon", null, async (db) => {
    await assert.rejects(db.query("select * from public.profiles"), code("42501"));
  });
});

test("the audit is visible to authorized administration and only records identifiers", async () => {
  await owner.query("select set_config('request.jwt.claim.sub', $1, false)", [users.admin]);
  await owner.query("update public.pickup_slots set capacity = 6 where id = $1", [initialSlot]);
  await owner.query("select set_config('request.jwt.claim.sub', '', false)");

  await asRole("authenticated", users.admin, async (db) => {
    assert.equal((await db.query("select id from public.orders")).rowCount, 2);
    const result = await db.query(`
      select actor_id, action, entity_id, occurred_at from public.audit_log
      where entity = 'pickup_slots' and entity_id = $1 and actor_id = $2
    `, [initialSlot, users.admin]);
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].actor_id, users.admin);
    assert.equal(result.rows[0].action, "UPDATE");
    assert.ok(result.rows[0].occurred_at instanceof Date);
    await assert.rejects(db.query("delete from public.audit_log"), code("42501"));
  });
  await asRole("authenticated", users.alice, async (db) => {
    assert.equal((await db.query("select id from public.audit_log")).rowCount, 0);
  });
});

test("unique identifiers, active orders and immutable slot references are enforced in the database", async () => {
  await assert.rejects(owner.query("update public.profiles set national_id = '0000000001' where user_id = $1", [users.bob]), code("23505"));
  await assert.rejects(owner.query("update public.profiles set email = 'alice@example.test' where user_id = $1", [users.bob]), code("23505"));
  await assert.rejects(submit(owner, users.alice, initialSlot), code("23505"));
  await assert.rejects(owner.query("update public.pickup_slots set capacity = 1 where id = $1", [initialSlot]), code("23514"));
  assert.equal((await owner.query("select reserved from public.pickup_slots where id = $1", [initialSlot])).rows[0].reserved, 2);
});

test("independent PostgreSQL connections cannot reserve the same last pickup place", async () => {
  await owner.query("update public.orders set status = 'cancelled' where status = 'pending'");
  const slot = randomUUID();
  await owner.query("insert into public.pickup_slots(id, service_date, starts_at, capacity) values ($1, current_date, '12:15', 1)", [slot]);

  const left = server.getPgClient();
  const right = server.getPgClient();
  await Promise.all([left.connect(), right.connect()]);
  try {
    const results = await Promise.allSettled([submit(left, users.alice, slot), submit(right, users.bob, slot)]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    const rejected = results.find((result) => result.status === "rejected");
    assert.ok(rejected?.status === "rejected" && code("23514")(rejected.reason));
    assert.equal((await owner.query("select reserved from public.pickup_slots where id = $1", [slot])).rows[0].reserved, 1);

    await owner.query("update public.orders set status = 'cancelled' where slot_id = $1", [slot]);
    await owner.query("update public.orders set status = 'cancelled' where slot_id = $1", [slot]);
    assert.equal((await owner.query("select reserved from public.pickup_slots where id = $1", [slot])).rows[0].reserved, 0);
  } finally {
    await Promise.all([left.end(), right.end()]);
  }
});

test("registration inserts a pending profile atomically, rejects concurrent duplicates and removes Auth metadata", async () => {
  const matchingId = "0100000009";
  const create = (db: Client, user: string, email: string, nationalId: string) =>
    db.query(`
      insert into auth.users(id, email, raw_user_meta_data)
      values ($1, $2, jsonb_build_object('web_registration', $3::jsonb))
    `, [user, email, JSON.stringify({
      givenNames: "Persona",
      familyNames: "De Prueba",
      mobile: "+593900000000",
      nationalId,
    })]);
  const left = server.getPgClient();
  const right = server.getPgClient();
  await Promise.all([left.connect(), right.connect()]);
  try {
    const first = randomUUID();
    const second = randomUUID();
    const results = await Promise.allSettled([
      create(left, first, "alta-a@example.test", matchingId),
      create(right, second, "alta-b@example.test", matchingId),
    ]);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    const rejected = results.find((result) => result.status === "rejected");
    assert.ok(rejected?.status === "rejected" && code("23505")(rejected.reason));
    const saved = await owner.query<{ email: string; verified_at: Date | null; national_id: string; raw_user_meta_data: object }>(`
      select p.email, p.verified_at, p.national_id, u.raw_user_meta_data
      from public.profiles p join auth.users u on u.id = p.user_id where p.national_id = $1
    `, [matchingId]);
    assert.equal(saved.rowCount, 1);
    assert.equal(saved.rows[0].national_id, matchingId);
    assert.equal(saved.rows[0].verified_at, null);
    assert.deepEqual(saved.rows[0].raw_user_meta_data, {});
    await assert.rejects(create(owner, randomUUID(), saved.rows[0].email, "0200000008"), code("23505"));
    await assert.rejects(create(owner, randomUUID(), "cedula-invalida@example.test", "0100000000"), code("23514"));
    assert.equal((await owner.query("select id from auth.users where id in ($1, $2)", [first, second])).rowCount, 1);
  } finally {
    await Promise.all([left.end(), right.end()]);
  }
});

test("only the customer can update contact fields and a concurrent edit cannot overwrite the first change", async () => {
  const current = await owner.query<{ version: string }>("select updated_at::text as version from public.profiles where user_id = $1", [users.alice]);
  const version = current.rows[0].version;
  const change = (client: Client, given: string) => client.query<{ applied: boolean }>(
    "select public.update_my_contact($1, 'De Prueba', '+593900000001', $2) as applied", [given, version],
  );
  const results = await Promise.all([
    asRole("authenticated", users.alice, (client) => change(client, "Prueba Uno")),
    asRole("authenticated", users.alice, (client) => change(client, "Prueba Dos")),
  ]);
  assert.equal(results.filter(({ rows }) => rows[0].applied).length, 1);
  await asRole("authenticated", users.alice, (client) =>
    assert.rejects(client.query("update public.profiles set national_id = '0200000008'"), code("42501")));
  await asRole("authenticated", users.inactive, (client) =>
    assert.rejects(change(client, "Persona bloqueada"), code("42501")));
  const snapshot = await owner.query("select user_id, national_id, given_names from public.profiles where user_id in ($1, $2)", [users.alice, users.bob]);
  assert.equal(snapshot.rows.find(({ user_id }) => user_id === users.alice)?.national_id, "0000000001");
  assert.equal(snapshot.rows.find(({ user_id }) => user_id === users.bob)?.given_names, "Usuario");
});
