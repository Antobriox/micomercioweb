import assert from "node:assert/strict";
import { test } from "node:test";

import { buildCartReview } from "../../lib/cart/review";
import { createCommercialService } from "../../lib/server/commercial/service";
import { createSimulatedAdapter } from "../../lib/server/commercial/simulated-adapter";

const date = new Date("2026-11-24T14:00:00Z");
const clock = () => date;
const period = { from: "2026-11-21T00:00:00Z", before: "2026-11-25T00:00:00Z" };

test("catalog data is simulated, current, and retains unknown fields", async () => {
  const catalog = await createCommercialService(createSimulatedAdapter(clock), clock).getCatalog();
  assert.equal(catalog.state, "available");
  if (catalog.state !== "available") return;
  assert.equal(catalog.source, "simulated");
  assert.equal(catalog.observedAt, date.toISOString());
  assert.ok(catalog.validUntil > catalog.observedAt);
  assert.equal(catalog.records.find(({ id }) => id === "demo-jugo")?.variants[0].availableQuantity, null);
  assert.equal(catalog.records.find(({ id }) => id === "demo-avena")?.variants[0].availableQuantity, 0);
});

test("missing, stale, malformed and failed upstream data have distinct states", async () => {
  const adapter = createSimulatedAdapter(clock);
  const empty = { ...adapter, readCatalog: async () => ({ ...(await adapter.readCatalog()), records: [] }) };
  assert.equal((await createCommercialService(empty, clock).getCatalog()).state, "empty");
  const afterExpiry = () => new Date("2026-11-24T15:00:00Z");
  assert.equal((await createCommercialService(adapter, afterExpiry).getCatalog()).state, "stale");
  const malformed = { ...adapter, readCatalog: async () => ({ ...(await adapter.readCatalog()), observedAt: "invalid" }) };
  assert.equal((await createCommercialService(malformed, clock).getCatalog()).state, "unavailable");
  const failure = { ...adapter, readCatalog: async () => { throw new Error("Private upstream error"); } };
  assert.deepEqual(await createCommercialService(failure, clock).getCatalog(), {
    state: "unavailable", source: "simulated",
  });
});

test("a promotion is excluded at the exact end of its validity", async () => {
  let now = date;
  const mutableClock = () => now;
  const service = createCommercialService(createSimulatedAdapter(mutableClock), mutableClock);
  const initial = await service.getCatalog();
  assert.ok("records" in initial);
  assert.equal(initial.records[0].variants[0].promotions.length, 1);
  now = new Date("2026-12-01T14:00:00Z");
  const later = await service.getCatalog();
  assert.ok("records" in later);
  assert.equal(later.records[0].variants[0].promotions.length, 0);
});

test("restricted reports and real sources are denied before any upstream call", async () => {
  const adapter = createSimulatedAdapter(clock);
  let calls = 0;
  const restricted = {
    ...adapter,
    readInventory: async () => { calls++; return adapter.readInventory(); },
    readSales: async () => { calls++; return adapter.readSales(period); },
  };
  const service = createCommercialService(restricted, clock);
  assert.deepEqual(await service.getInventory("visitor"), { state: "forbidden" });
  assert.deepEqual(await service.getSales("customer", period), { state: "forbidden" });
  const real = createCommercialService({ ...restricted, source: "picking" }, clock);
  assert.deepEqual(await real.getSales("administrator", period), { state: "forbidden" });
  assert.deepEqual(await real.getCatalog(), { state: "forbidden" });
  assert.equal(calls, 0);
  assert.equal((await service.getSales("administrator", period)).state, "available");
  assert.equal((await service.getInventory("administrator")).state, "available");
});

test("SPEC-033 times out and shows the last verified catalog while keeping checkout closed", async () => {
  const adapter = createSimulatedAdapter(clock);
  let behavior: "healthy" | "timeout" | "bad" = "healthy";
  let aborted = false;
  const service = createCommercialService({
    ...adapter,
    async readCatalog(signal) {
      if (behavior === "timeout") {
        signal?.addEventListener("abort", () => { aborted = true; }, { once: true });
        return new Promise(() => {});
      }
      const snapshot = await adapter.readCatalog();
      return behavior === "bad" ? { ...snapshot, records: [snapshot.records[0], snapshot.records[0]] } : snapshot;
    },
  }, clock, 15);
  assert.equal((await service.getCatalog()).state, "available");
  const cart = [{ variantId: "demo-arroz-1-kg", quantity: 1 }];
  behavior = "timeout";
  const stale = await service.getCatalog();
  assert.equal(stale.state, "stale");
  assert.ok(aborted);
  assert.equal(buildCartReview(cart, stale, date).state, "unavailable");
  assert.equal(cart[0].quantity, 1);
  behavior = "bad";
  assert.equal((await service.getCatalog()).state, "stale");
  behavior = "healthy";
  const restored = buildCartReview(cart, await service.getCatalog(), date);
  assert.equal(restored.state, "available");
  assert.ok(restored.state === "available" && restored.valid);
});
