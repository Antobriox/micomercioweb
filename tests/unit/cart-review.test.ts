import assert from "node:assert/strict";
import { test } from "node:test";

import { estimateTotal, lineEstimate } from "../../lib/cart/estimate";
import { buildCartReview, reviewSnapshot } from "../../lib/cart/review";
import { createCommercialService } from "../../lib/server/commercial/service";
import { createSimulatedAdapter } from "../../lib/server/commercial/simulated-adapter";

const now = new Date("2026-11-24T12:00:00Z");
const clock = () => now;
const line = { variantId: "demo-arroz-1-kg", quantity: 3, observedUnitPrice: { amountInMinorUnits: 250, currency: "USD" } };

test("checkout recomputes discounted line amounts in minor units and preserves the accepted snapshot", async () => {
  const catalog = await createCommercialService(createSimulatedAdapter(clock), clock).getCatalog();
  const review = buildCartReview([line], catalog, now);
  assert.equal(review.state, "available");
  if (review.state !== "available") return;
  assert.equal(review.valid, true);
  assert.equal(review.items[0].changed, true);
  assert.equal(review.total?.amountInMinorUnits, 630);
  assert.equal(reviewSnapshot(review).lines[0].unitPriceMinor, 210);
});

test("bad stock or incomplete prices prevent confirmation without hiding saved lines", async () => {
  const catalog = await createCommercialService(createSimulatedAdapter(clock), clock).getCatalog();
  const review = buildCartReview([{ ...line, quantity: 7 }, { variantId: "desconocido", quantity: 1 }], catalog, now);
  assert.equal(review.state, "available");
  if (review.state !== "available") return;
  assert.equal(review.items.length, 2);
  assert.equal(review.valid, false);
  assert.equal(review.total, null);
  assert.deepEqual(buildCartReview([line], { state: "unavailable", source: "simulated" }, now), { state: "unavailable" });
  assert.equal(estimateTotal([lineEstimate({ amountInMinorUnits: 10, currency: "USD" }, 3), { amountInMinorUnits: 20, currency: "EUR" }]), null);
});
