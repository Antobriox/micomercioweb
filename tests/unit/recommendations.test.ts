import assert from "node:assert/strict";
import { test } from "node:test";

import { recommendProducts } from "../../lib/commercial/recommendations";
import { createSimulatedAdapter } from "../../lib/server/commercial/simulated-adapter";

test("recommendations exclude the current product and unavailable alternatives", async () => {
  const { records } = await createSimulatedAdapter().readCatalog();
  const [rice, oats] = records;
  assert.deepEqual(recommendProducts(rice, records), []);
  assert.deepEqual(recommendProducts(oats, records).map(({ id }) => id), [rice.id]);
  assert.deepEqual(recommendProducts(oats, records.map((item) => ({ ...item, variants: [] }))), []);
});
