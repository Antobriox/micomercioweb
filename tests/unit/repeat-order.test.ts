import assert from "node:assert/strict";
import { test } from "node:test";

import { planRepeat } from "../../lib/orders/repeat";
import { createSimulatedAdapter } from "../../lib/server/commercial/simulated-adapter";

test("repeat uses current pricing, preserves identity and reports unavailable quantities", async () => {
  const now = new Date("2026-11-25T12:00:00Z");
  const { records } = await createSimulatedAdapter(() => now).readCatalog();
  const lines = [
    { variant_id: "demo-arroz-1-kg", quantity: 2, product_name: "Arroz histórico" },
    { variant_id: "demo-arroz-caja", quantity: 9, product_name: "Cantidad agotada" },
    { variant_id: "retirado", quantity: 1, product_name: "Retirado" },
  ];
  const results = planRepeat(lines, records, now);
  assert.deepEqual(results.map(({ item }) => item?.minor ?? null), [210, null, null]);
  assert.equal(planRepeat(lines, records, new Date("2026-12-04T12:00:00Z"))[0].item?.minor, 250);
});
