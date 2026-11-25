import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cp, mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

import EmbeddedPostgres from "embedded-postgres";
import type { Client } from "pg";

let server: EmbeddedPostgres;
let owner: Client;
let started = false;
let ownerClosed = false;
let fixtureRoot: string;
let fixturePassword: string;
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
  fixtureRoot = await mkdtemp(join(tmpdir(), "micomercioweb-pg-"));
  fixturePassword = randomUUID();
  const databaseDir = join(fixtureRoot, "source");
  server = new EmbeddedPostgres({
    databaseDir,
    user: "postgres",
    password: fixturePassword,
    port: await openPort(),
    persistent: true,
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
    create role service_role nologin bypassrls;
    create schema auth;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(bucket_id text not null,name text not null);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select on storage.objects to anon, authenticated;
    grant insert,delete on storage.objects to authenticated;
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
  if (owner && !ownerClosed) await owner.end();
  if (started) await server.stop();
  if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true, maxRetries: 3 });
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

test("favorites cannot be inserted or read under a different owner", async () => {
  await asRole("authenticated", users.alice, async (client) => {
    await client.query("insert into public.favorites(user_id, product_id) values ($1, 'demo-arroz')", [users.alice]);
    await assert.rejects(client.query("insert into public.favorites(user_id, product_id) values ($1, 'demo-arroz')", [users.bob]), code("42501"));
  });
  await asRole("authenticated", users.bob, async (client) => {
    assert.equal((await client.query("select product_id from public.favorites")).rowCount, 0);
    assert.equal((await client.query("delete from public.favorites where product_id = 'demo-arroz'")).rowCount, 0);
  });
});

test("a cart operation is applied once, and merge and failures preserve existing lines", async () => {
  await asRole("authenticated", users.alice, async (client) => {
    const key = randomUUID();
    const change = async (operation: string, intent: string, quantity: number, ceiling: number) => client.query(
      "select public.change_my_cart($1,$2,$3)", [operation, intent, JSON.stringify([{
        sku: "demo-cart-test", quantity, ceiling, minor: 210, currency: "USD",
      }])],
    );
    await change(key, "add", 2, 6);
    await change(key, "add", 2, 6);
    await change(randomUUID(), "merge", 1, 6);
    await assert.rejects(change(randomUUID(), "add", 6, 6), code("23514"));
    assert.equal((await client.query("select quantity from public.cart_items where variant_id = 'demo-cart-test'")).rows[0].quantity, 2);
    await change(randomUUID(), "set", 0, 0);
    assert.equal((await client.query("select quantity from public.cart_items where variant_id = 'demo-cart-test'")).rowCount, 0);
  });
});

test("operating hours honor Guayaquil time, exclusive closing boundaries, exceptions and pause permissions", async () => {
  await asRole("anon", null, async (client) => {
    const at = async (utc: string) => (await client.query(
      "select accepting, local_time from public.operating_at($1)", [utc],
    )).rows[0];
    assert.equal((await at("2026-11-23T11:59:00Z")).accepting, false);
    assert.deepEqual(await at("2026-11-23T12:00:00Z"), { accepting: true, local_time: "07:00:00" });
    assert.equal((await at("2026-11-23T21:59:00Z")).accepting, true);
    assert.equal((await at("2026-11-23T22:00:00Z")).accepting, false);
    assert.equal((await at("2026-11-29T17:59:00Z")).accepting, true);
    assert.equal((await at("2026-11-29T18:00:00Z")).accepting, false);
    await assert.rejects(client.query("select * from public.operating_exceptions"), code("42501"));
  });
  await asRole("authenticated", users.alice, async (client) => {
    assert.equal((await client.query("update public.operating_switch set paused=true, notice='Pausa sin permiso'")).rowCount, 0);
  });
  await owner.query("update public.administrators set revoked_at = null where user_id = $1", [users.admin]);
  await asRole("authenticated", users.admin, async (client) => {
    await client.query("insert into public.operating_exceptions(day,closed,notice) values ('2026-11-23', true, 'Feriado de prueba')");
    const day = async () => (await client.query("select accepting,notice from public.operating_at('2026-11-23T15:00:00Z')")).rows[0];
    assert.deepEqual(await day(), { accepting: false, notice: "Feriado de prueba" });
    await client.query("delete from public.operating_exceptions where day='2026-11-23'");
    await client.query("update public.operating_switch set paused=true, notice='Pausa de prueba'");
    assert.deepEqual(await day(), { accepting: false, notice: "Pausa de prueba" });
    await client.query("update public.operating_switch set paused=false, notice=null");
    assert.deepEqual(await day(), { accepting: true, notice: null });
  });
});

test("pickup slots respect lead time, same-day opening and closing, capacity and manual configuration", async () => {
  const options = async (utc: string) => (await owner.query<{ starts_at: string }>(
    "select starts_at from public.eligible_pickup_times($1)", [utc],
  )).rows.map(({ starts_at }) => starts_at);
  const monday = "2026-11-23T15:07:00Z";
  assert.deepEqual(await options(monday), []);
  await asRole("authenticated", users.admin, async (client) => {
    await client.query("update public.operating_switch set default_capacity=1");
  });
  assert.equal((await options(monday))[0], "10:45:00");
  assert.equal((await options("2026-11-29T17:59:00Z")).at(-1), "13:45:00");
  assert.deepEqual(await options("2026-11-29T18:00:00Z"), []);
  await asRole("authenticated", users.alice, async (client) => {
    await assert.rejects(client.query("select public.configure_pickup_slot('2026-11-23','10:45',1,null)"), code("42501"));
  });
  await asRole("authenticated", users.admin, async (client) => {
    await client.query("select public.configure_pickup_slot('2026-11-23','10:45',1,null)");
    const { rows } = await owner.query<{ id: string }>("select id from public.pickup_slots where service_date='2026-11-23' and starts_at='10:45'");
    const order = await submit(owner, users.alice, rows[0].id);
    assert.equal((await options(monday))[0], "11:00:00");
    await assert.rejects(client.query("select public.configure_pickup_slot('2026-11-23','10:45',0,null)"), code("23514"));
    await owner.query("update public.orders set status='cancelled' where id=$1", [order.rows[0].id]);
    assert.equal((await options(monday))[0], "10:45:00");
    await client.query("select public.configure_pickup_slot('2026-11-23','10:45',1,'Cierre de prueba')");
    assert.equal((await options(monday))[0], "11:00:00");
    await client.query("update public.operating_switch set default_capacity=0");
  });
});

test("demo submission is atomic, retries keep the same receipt, and only accepted lines are removed", async () => {
  const quote = JSON.stringify({
    currency: "USD", totalMinor: 420,
    lines: [{ sku: "demo-submit", productName: "Producto de prueba", presentation: "Bolsa", unit: "bolsa",
      currency: "USD", quantity: 2, unitPriceMinor: 210 }],
  });
  const revision = "a".repeat(64);
  const day = "2026-11-30";
  const moment = "2026-11-30T15:07:00Z";
  const order = (client: Client, principal: string, key: string, now: string, data = quote) =>
    client.query<{ id: string }>("select public.submit_demo_order($1,$2,$3,$4,'10:45',$5,$6) as id",
      [principal, key, revision, day, data, now]);
  await owner.query("update public.operating_switch set default_capacity=1");
  for (const principal of [users.alice, users.bob]) {
    await owner.query("insert into public.cart_items(user_id,variant_id,quantity) values ($1,'demo-submit',2),($1,'demo-extra',1)", [principal]);
    await owner.query("insert into public.order_reviews(user_id,revision,snapshot) values($1,$2,$3)", [principal, revision, quote]);
  }
  await asRole("authenticated", users.alice, async (client) => {
    await assert.rejects(order(client, users.alice, randomUUID(), moment), code("42501"));
  });
  await assert.rejects(order(owner, users.alice, randomUUID(), "2026-11-30T23:00:00Z"), code("23514"));
  await assert.rejects(order(owner, users.alice, randomUUID(), moment, quote.replace("420", "400")), code("23514"));

  const clients = [server.getPgClient(), server.getPgClient()];
  await Promise.all(clients.map((client) => client.connect()));
  try {
    const keys = [randomUUID(), randomUUID()];
    const principals = [users.alice, users.bob];
    const outcomes = await Promise.allSettled(clients.map((client, index) => order(client, principals[index], keys[index], moment)));
    const winner = outcomes.findIndex(({ status }) => status === "fulfilled");
    assert.ok(winner >= 0 && outcomes.filter(({ status }) => status === "fulfilled").length === 1);
    const again = await order(owner, principals[winner], keys[winner], "2026-11-30T23:00:00Z");
    const persisted = await owner.query(`
      select o.id, o.status, o.demo, o.estimated_total_minor, s.reserved
      from public.orders o join public.pickup_slots s on s.id = o.slot_id where o.id = $1
    `, [again.rows[0].id]);
    assert.equal(persisted.rows[0].reserved, 1);
    assert.equal(persisted.rows[0].status, "pending");
    assert.equal(persisted.rows[0].demo, true);
    assert.equal(persisted.rows[0].estimated_total_minor, "420");
    assert.equal((await owner.query("select 1 from public.order_items where order_id=$1", [again.rows[0].id])).rowCount, 1);
    assert.equal((await owner.query("select 1 from public.order_events where order_id=$1 and actor_id=$2",
      [again.rows[0].id, principals[winner]])).rowCount, 1);
    assert.equal((await owner.query("select 1 from public.cart_items where user_id=$1 and variant_id='demo-submit'", [principals[winner]])).rowCount, 0);
    assert.equal((await owner.query("select 1 from public.cart_items where user_id=$1 and variant_id='demo-extra'", [principals[winner]])).rowCount, 1);
    assert.equal((await owner.query("select 1 from public.cart_items where user_id=$1 and variant_id='demo-submit'", [principals[1-winner]])).rowCount, 1);
    await assert.rejects(order(owner, principals[winner], randomUUID(), moment), code("23505"));
  } finally {
    await Promise.all(clients.map((client) => client.end()));
  }
});

test("SPEC-022 cancellation preserves authorization, reasons and capacity across concurrent updates", async () => {
  const slot = randomUUID();
  await owner.query("insert into public.pickup_slots(id, service_date, starts_at, capacity) values ($1, current_date, '14:45', 5)", [slot]);
  await owner.query("update public.orders set status='cancelled' where user_id=$1 and status in ('pending','confirmed','preparing','ready')", [users.alice]);
  const create = async () => (await submit(owner, users.alice, slot)).rows[0].id;
  const cancel = (db: Client, id: string, state: string, admin: boolean | null = false, reason: string | null = null) =>
    db.query("select public.cancel_order($1,$2,$3,$4)", [id, state, admin, reason]);
  const reserved = async () => (await owner.query("select reserved from public.pickup_slots where id=$1", [slot])).rows[0].reserved;
  for (const status of ["pending", "confirmed"]) {
    const id = await create();
    await owner.query("update public.orders set status=$2 where id=$1", [id, status]);
    await asRole("authenticated", users.bob, (db) => assert.rejects(cancel(db,id,status), code("42501")));
    await asRole("authenticated", users.alice, async (db) => {
      await assert.rejects(cancel(db,id,status,true,"Intento de prueba"), code("42501"));
      await assert.rejects(cancel(db,id,status,null), code("42501"));
    });
    const outcomes = await Promise.allSettled([1,2].map(() => asRole("authenticated", users.alice, (db) => cancel(db,id,status))));
    assert.equal(outcomes.filter((entry) => entry.status === "fulfilled").length, 1);
    assert.equal((await owner.query("select 1 from public.order_events where order_id=$1 and next_status='cancelled'", [id])).rowCount, 1);
    assert.equal(await reserved(), 0);
  }

  const id = await create();
  await owner.query("begin");
  try {
    await owner.query("update public.orders set status='preparing' where id=$1", [id]);
    const cancellation = asRole("authenticated", users.alice, (db) => assert.rejects(cancel(db,id,"pending"), code("40001")));
    await owner.query("commit");
    await cancellation;
  } catch (error) {
    await owner.query("rollback");
    throw error;
  }
  assert.equal(await reserved(), 1);
  await owner.query("update public.orders set status='ready' where id=$1", [id]);
  await asRole("authenticated", users.alice, (db) => assert.rejects(cancel(db,id,"ready"), code("23514")));
  await asRole("authenticated", users.admin, async (db) => {
    await assert.rejects(cancel(db,id,"ready",true,"  "), code("23514"));
    await cancel(db,id,"ready",true,"  Motivo de prueba  ");
    assert.equal((await db.query("select reason from public.admin_order_events($1)", [id])).rows[0].reason, "Motivo de prueba");
  });
  await asRole("authenticated", users.alice, async (db) => {
    await assert.rejects(db.query("select reason from public.order_events"), code("42501"));
    assert.equal((await db.query("select reason from public.admin_order_events($1)", [id])).rowCount, 0);
  });
  assert.equal(await reserved(), 0);
  const delivered = await create();
  await owner.query("update public.orders set status='delivered' where id=$1", [delivered]);
  await asRole("authenticated", users.admin, (db) => assert.rejects(cancel(db,delivered,"delivered",true,"Motivo de prueba"), code("23514")));
});

test("SPEC-023 only advances one state at a time and records explicit test delivery", async () => {
  const slot = randomUUID();
  await owner.query("insert into public.pickup_slots(id, service_date, starts_at, capacity) values ($1, current_date, '15:00', 5)", [slot]);
  const id = (await submit(owner, users.alice, slot)).rows[0].id;
  const advance = (db: Client, from: string, to: string, payment = false, pickup = false) =>
    db.query("select public.advance_order($1,$2,$3,$4,$5)", [id, from, to, payment, pickup]);
  await asRole("authenticated", users.alice, (db) => assert.rejects(advance(db, "pending", "confirmed"), code("42501")));
  await asRole("authenticated", users.admin, (db) => assert.rejects(advance(db, "pending", "ready"), code("23514")));
  const tabs = await Promise.allSettled([1, 2].map(() =>
    asRole("authenticated", users.admin, (db) => advance(db, "pending", "confirmed"))));
  assert.equal(tabs.filter((tab) => tab.status === "fulfilled").length, 1);
  const conflict = tabs.find((tab) => tab.status === "rejected");
  assert.ok(conflict && code("40001")(conflict.reason));
  await asRole("authenticated", users.admin, async (db) => {
    await advance(db, "confirmed", "preparing");
    await advance(db, "preparing", "ready");
    await assert.rejects(advance(db, "ready", "delivered", true), code("23514"));
    await assert.rejects(advance(db, "ready", "delivered", false, true), code("23514"));
    await advance(db, "ready", "delivered", true, true);
    await assert.rejects(advance(db, "delivered", "ready"), code("23514"));
  });
  const events = await owner.query("select previous_status,next_status,actor_id,created_at from public.order_events where order_id=$1 order by id", [id]);
  assert.deepEqual(events.rows.map((row) => [row.previous_status, row.next_status]), [
    ["pending", "confirmed"], ["confirmed", "preparing"], ["preparing", "ready"], ["ready", "delivered"],
  ]);
  assert.ok(events.rows.every((row) => row.actor_id === users.admin && row.created_at instanceof Date));

  const missing = (await submit(owner, users.alice, slot)).rows[0].id;
  await asRole("authenticated", users.admin, async (db) => {
    await db.query("select public.advance_order($1,'pending','confirmed')", [missing]);
    await db.query("select public.advance_order($1,'confirmed','preparing')", [missing]);
    await db.query("select public.cancel_order($1,'preparing',true,'Artículo de prueba faltante')", [missing]);
    await assert.rejects(db.query("select public.advance_order($1,'cancelled','ready')", [missing]), code("23514"));
  });
});

test("SPEC-024 sends one internal notification per transition and only its owner can mark it read", async () => {
  const slot = randomUUID();
  await owner.query("insert into public.pickup_slots(id, service_date, starts_at, capacity) values ($1, current_date, '15:15', 5)", [slot]);
  const id = (await submit(owner, users.alice, slot)).rows[0].id;
  await owner.query("insert into public.order_events(order_id,next_status) values($1,'pending')", [id]);
  await asRole("authenticated", users.admin, async (db) => {
    await db.query("select public.advance_order($1,'pending','confirmed')", [id]);
    await assert.rejects(db.query("select public.advance_order($1,'pending','confirmed')", [id]), code("40001"));
    await db.query("select public.advance_order($1,'confirmed','preparing')", [id]);
  });
  const { rows } = await owner.query("select n.id,e.next_status from public.notifications n join public.order_events e on e.id=n.event_id where e.order_id=$1 order by e.id", [id]);
  assert.deepEqual(rows.map((row) => row.next_status), ["pending", "confirmed", "preparing"]);
  const notice = rows[0].id;
  await asRole("authenticated", users.bob, async (db) => {
    assert.equal((await db.query("select id from public.notifications where id=$1", [notice])).rowCount, 0);
    assert.equal((await db.query("select public.mark_order_notification_read($1) as marked", [notice])).rows[0].marked, false);
  });
  await asRole("authenticated", users.alice, async (db) => {
    assert.equal((await db.query("select public.mark_order_notification_read($1) as marked", [notice])).rows[0].marked, true);
    const first = (await db.query("select read_at from public.notifications where id=$1", [notice])).rows[0].read_at;
    assert.ok(first);
    await db.query("select public.mark_order_notification_read($1)", [notice]);
    assert.deepEqual((await db.query("select read_at from public.notifications where id=$1", [notice])).rows[0].read_at, first);
    await assert.rejects(db.query("update public.notifications set read_at=null where id=$1", [notice]), code("42501"));
  });
  await owner.query("update public.orders set status='cancelled' where id=$1", [id]);
});

test("SPEC-026 administration masks national ID and revokes active sessions on suspension", async () => {
  const lookup = await owner.query("select updated_at::text, national_id from public.profiles where user_id=$1", [users.alice]);
  const first = lookup.rows[0].updated_at;
  const id = lookup.rows[0].national_id;
  const toggle = (db: Client, version: string, disabled: boolean) =>
    db.query("select public.admin_set_customer_disabled($1,$2,$3)", [users.alice, version, disabled]);
  await asRole("authenticated", users.alice, async (client) => {
    assert.equal((await client.query("select * from public.admin_search_customers($1)", [id])).rowCount, 0);
    await assert.rejects(toggle(client, first, true), code("42501"));
    await asRole("authenticated", users.admin, async (admin) => {
      assert.equal((await admin.query("select national_id from public.profiles where user_id=$1", [users.alice])).rowCount, 0);
      assert.equal((await admin.query("select user_id from public.admin_search_customers($1)", [id])).rows[0].user_id, users.alice);
      const [detail] = (await admin.query("select masked_id from public.admin_customer_detail($1)", [users.alice])).rows;
      assert.equal(detail.masked_id, "••••••0001");
      assert.ok((await admin.query("select * from public.admin_search_orders('alice@example.test','delivered')")).rowCount);
      assert.equal((await admin.query("select * from public.admin_search_orders('0000000000')")).rowCount, 0);
      await toggle(admin, first, true);
      await assert.rejects(toggle(admin, first, false), code("40001"));
      assert.equal((await client.query("select public.is_active_customer() as active")).rows[0].active, false);
      assert.equal((await client.query("select id from public.orders")).rowCount, 0);
      const next = (await admin.query("select updated_at::text from public.admin_customer_detail($1)", [users.alice])).rows[0].updated_at;
      await toggle(admin, next, false);
      assert.equal((await client.query("select public.is_active_customer() as active")).rows[0].active, false);
      assert.equal((await admin.query(`select id from public.audit_log
        where entity='profiles' and entity_id=$1 and actor_id=$2 and action='UPDATE'`, [users.alice, users.admin])).rowCount, 2);
    });
  });
  await asRole("authenticated", users.alice, async (client) => {
    assert.equal((await client.query("select public.is_active_customer() as active")).rows[0].active, true);
  });
});

test("SPEC-027 protects editorial changes and publishes only visible text and media", async () => {
  const id = "demo-arroz";
  const photo = randomUUID() + ".webp";
  await asRole("authenticated", users.alice, (db) =>
    assert.rejects(db.query("insert into public.product_editorial(product_id,description) values($1,'Prueba')", [id]), code("42501")));
  await asRole("authenticated", users.admin, async (db) => {
    const category = (await db.query("insert into public.editorial_categories(slug,title,visible) values('prueba','Categoría de prueba',true) returning id")).rows[0].id;
    await db.query("insert into public.product_editorial(product_id,category_id,description,featured) values($1,$2,'Texto de prueba',true)", [id, category]);
    await db.query("insert into storage.objects(bucket_id,name) values('editorial',$1)", [photo]);
    await db.query("insert into public.editorial_images(product_id,object_path,alt_text) values($1,$2,'Foto de prueba')", [id, photo]);
  });
  await asRole("anon", null, async (db) => {
    const row = (await db.query("select * from public.storefront_editorial(array[$1])", [id])).rows[0];
    assert.equal(row.description, "Texto de prueba");
    assert.equal(row.category_title, "Categoría de prueba");
    assert.equal(row.photos[0].object_path, photo);
    assert.equal((await db.query("select name from storage.objects")).rows[0].name, photo);
    await assert.rejects(db.query("select * from public.product_editorial"), code("42501"));
  });
  await asRole("authenticated", users.admin, (db) => db.query("update public.product_editorial set visible=false where product_id=$1", [id]));
  await asRole("anon", null, async (db) => {
    assert.deepEqual((await db.query("select visible,description,featured,photos from public.storefront_editorial(array[$1])", [id])).rows[0],
      { visible: false, description: null, featured: false, photos: [] });
    assert.equal((await db.query("select name from storage.objects")).rowCount, 0);
  });
});

test("SPEC-028 serves scheduled banners by placement, order and publication status", async () => {
  const desktop = randomUUID() + ".webp";
  const mobile = randomUUID() + ".webp";
  await asRole("authenticated", users.admin, async (db) => {
    await db.query("insert into storage.objects(bucket_id,name) values('editorial',$1),('editorial',$2)", [desktop,mobile]);
    await db.query(`insert into public.banners(location,title,desktop_path,mobile_path,alt_text,starts_at,ends_at,position,enabled)
      select v.location,v.title,$1,$2,'Foto de prueba',now()+v.open_delay,now()+v.close_delay,v.position,v.enabled from
      (values ('home','Tarde','-1 hour'::interval,'1 hour'::interval,2,true),
      ('home','Primero','-1 hour','1 hour',1,true),('home','Vencido','-2 hour','-1 hour',0,true),
      ('home','Futuro','1 hour','2 hour',0,true),('promotions','Promo','-1 hour','1 hour',0,true),
      ('home','Pausado','-1 hour','1 hour',0,false)) as v(location,title,open_delay,close_delay,position,enabled)`, [desktop,mobile]);
  });
  await asRole("anon", null, async (db) => {
    assert.deepEqual((await db.query("select title from public.active_banners('home')")).rows.map(({ title }) => title), ["Primero","Tarde"]);
    assert.deepEqual((await db.query("select title from public.active_banners('promotions')")).rows.map(({ title }) => title), ["Promo"]);
    assert.equal((await db.query("select name from storage.objects")).rowCount, 2);
  });
  await asRole("authenticated", users.alice, async (db) => {
    assert.equal((await db.query("update public.banners set enabled=false returning id")).rowCount, 0);
  });
  await asRole("authenticated", users.admin, (db) => db.query("update public.banners set enabled=false"));
  await asRole("anon", null, async (db) => {
    assert.equal((await db.query("select title from public.active_banners('home')")).rowCount, 0);
    assert.equal((await db.query("select name from storage.objects")).rowCount, 0);
  });
});

test("SPEC-029 permits private drafts, protects published content and rejects stale writes", async () => {
  const draft = JSON.stringify({ title: "Versión de prueba", body: "<script>texto</script>" });
  const publication = JSON.stringify({ title: "Versión publicada de prueba" });
  await asRole("authenticated", users.alice, (db) =>
    assert.rejects(db.query("select public.save_cms_page('nosotros',$1,null,false,false)", [draft]), code("42501")));
  let version: string;
  await asRole("authenticated", users.admin, async (db) => {
    await db.query("select public.save_cms_page('nosotros',$1,null,false,false)", [draft]);
    await assert.rejects(db.query("select public.save_cms_page('privacidad',$1,null,true,false)", [draft]), code("23514"));
    version = (await db.query("select updated_at::text from public.admin_cms_page('nosotros')")).rows[0].updated_at;
  });
  await asRole("anon", null, async (db) => {
    assert.equal((await db.query("select public.published_cms_page('nosotros') as body")).rows[0].body, null);
    await assert.rejects(db.query("select * from public.admin_cms_page('nosotros')"), code("42501"));
  });
  await asRole("authenticated", users.admin, async (db) => {
    await db.query("select public.save_cms_page('nosotros',$1,$2,true,false)", [publication, version]);
    await assert.rejects(db.query("select public.save_cms_page('nosotros',$1,$2,false,false)", [draft, version]), code("40001"));
    const next = (await db.query("select updated_at::text from public.admin_cms_page('nosotros')")).rows[0].updated_at;
    await db.query("select public.save_cms_page('nosotros',$1,$2,false,false)", [draft,next]);
  });
  await asRole("anon", null, async (db) => {
    assert.equal((await db.query("select public.published_cms_page('nosotros')->>'title' as title")).rows[0].title, "Versión publicada de prueba");
  });
});

test("SPEC-031 keeps cancelled web orders in the correct reporting interval and scopes aggregates to administrators", async () => {
  const id = (await owner.query("select id from public.orders where status='cancelled' limit 1")).rows[0].id;
  await owner.query("update public.orders set created_at='2025-10-20T05:00:00Z' where id=$1", [id]);
  const args = ["2025-10-20T05:00:00Z", "2025-10-21T05:00:00Z"];
  await asRole("authenticated", users.admin, async (db) => {
    const { rows } = await db.query("select status,amount::integer from public.web_order_report($1,$2)", args);
    assert.deepEqual(rows, [{ status: "cancelled", amount: 1 }]);
    assert.equal((await db.query("select status from public.web_order_report($1,$2)", ["2025-10-19T05:00:00Z", args[0]])).rowCount, 0);
  });
  await asRole("authenticated", users.alice, async (db) =>
    assert.equal((await db.query("select status from public.web_order_report($1,$2)", args)).rowCount, 0));
});

test("SPEC-031 counts one valid submission intent per retry key", async () => {
  const accepted = (await owner.query("select user_id,request_key from public.orders limit 1")).rows[0];
  const open = randomUUID();
  await owner.query("select public.note_demo_attempt($1,$2),public.note_demo_attempt($1,$2),public.note_demo_attempt($1,$3)",
    [accepted.user_id, accepted.request_key, open]);
  await asRole("authenticated", users.admin, async (db) => {
    const { rows } = await db.query("select attempts::integer,accepted::integer,preparation_count::integer from public.web_order_metrics('-infinity','infinity')");
    assert.deepEqual(rows, [{ attempts: 2, accepted: 1, preparation_count: 1 }]);
  });
  await asRole("authenticated", users.alice, async (db) => {
    await assert.rejects(db.query("select public.note_demo_attempt($1,$2)", [users.alice, open]), code("42501"));
    assert.equal((await db.query("select * from public.web_order_metrics('-infinity','infinity')")).rowCount, 0);
  });
});

test("SPEC-031 deduplicates demo visits and keeps event data private", async () => {
  const all = randomUUID();
  const partial = randomUUID();
  for (const event of ["visit","visit","search","add","signin","accepted"]) {
    await owner.query("select public.note_demo_funnel($1,$2)", [all,event]);
  }
  for (const event of ["visit","add"]) await owner.query("select public.note_demo_funnel($1,$2)", [partial,event]);
  await asRole("authenticated", users.admin, async (client) => {
    const { rows } = await client.query("select visits::integer,carts::integer,authenticated::integer,accepted::integer from public.demo_funnel_report('-infinity','infinity')");
    assert.deepEqual(rows, [{ visits: 2, carts: 2, authenticated: 1, accepted: 1 }]);
    await assert.rejects(client.query("select * from public.demo_funnel_events"), code("42501"));
  });
  await asRole("authenticated", users.alice, async (client) => {
    assert.equal((await client.query("select visits from public.demo_funnel_report('-infinity','infinity')")).rowCount, 0);
  });
});

test("SPEC-034 restores an isolated PostgreSQL copy with orders, capacity, events and permissions", async () => {
  const stateQuery = `select (select count(*) from public.orders) as orders,
    (select count(*) from public.order_events) as events,
    (select sum(reserved) from public.pickup_slots) as reserved,
    (select count(*) from public.audit_log) as audit`;
  const expected = (await owner.query(stateQuery)).rows[0];
  assert.ok(Number(expected.orders) > 0 && Number(expected.events) > 0 && Number(expected.audit) > 0);
  await owner.end();
  ownerClosed = true;
  await server.stop();
  started = false;
  const copy = join(fixtureRoot, "restored");
  await cp(join(fixtureRoot, "source"), copy, { recursive: true, errorOnExist: true });
  const restored = new EmbeddedPostgres({
    databaseDir: copy, user: "postgres", password: fixturePassword, port: await openPort(), persistent: true,
    postgresFlags: ["-h", "127.0.0.1"], onLog: () => {},
  });
  await restored.start();
  const check = restored.getPgClient();
  try {
    await check.connect();
    assert.deepEqual((await check.query(stateQuery)).rows[0], expected);
    await check.query("set role authenticated");
    assert.equal((await check.query("select id from public.orders")).rowCount, 0);
    await assert.rejects(check.query("update public.orders set status='cancelled'"), code("42501"));
  } finally {
    await check.end();
    await restored.stop();
  }
});
