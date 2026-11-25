import assert from "node:assert/strict";
import { test } from "node:test";

import type { Promotion, Variant } from "../../lib/commercial/contracts";
import { variantPricing } from "../../lib/commercial/pricing";

const now = new Date("2026-11-24T13:00:00Z");
const offer: Promotion = {
  id: "offer", price: { amountInMinorUnits: 210, currency: "USD" },
  previousPrice: { amountInMinorUnits: 250, currency: "USD" },
  startsAt: "2026-11-23T00:00:00Z", endsAt: "2026-11-25T00:00:00Z", conditions: null,
};
const variant: Variant = {
  id: "demo", presentation: "Bolsa", unit: "bolsa", price: offer.previousPrice,
  availableQuantity: 2, maxPerOrder: 2, promotions: [offer],
};

test("an active offer reports its source price and a verified discount", () => {
  assert.equal(variantPricing(variant, now).current?.amountInMinorUnits, 210);
  assert.equal(variantPricing(variant, now).offer?.percentage, 16);
  const expired = variantPricing(variant, new Date(offer.endsAt!));
  assert.deepEqual(expired, { current: variant.price, offer: null });
});

test("missing comparators and overlapping offers do not create discounts", () => {
  const incomplete = variantPricing({ ...variant, promotions: [{ ...offer, previousPrice: null }] }, now);
  assert.equal(incomplete.current?.amountInMinorUnits, 210);
  assert.equal(incomplete.offer?.percentage, 0);
  const mixed = variantPricing({ ...variant, promotions: [{ ...offer, previousPrice: { amountInMinorUnits: 260, currency: "EUR" } }] }, now);
  assert.equal(mixed.offer?.previous, null);
  assert.equal(variantPricing({ ...variant, promotions: [offer, { ...offer, id: "other" }] }, now).offer, null);
});
