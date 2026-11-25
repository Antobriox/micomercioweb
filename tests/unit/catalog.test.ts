import assert from "node:assert/strict";
import { test } from "node:test";

import { availability, paginateCatalog, purchaseLimit } from "../../lib/commercial/catalog";
import type { Product, Variant } from "../../lib/commercial/contracts";

const variant: Variant = { id: "test", presentation: "Bolsa", unit: "bolsa", price: { currency: "USD", amountInMinorUnits: 200 }, availableQuantity: 8, maxPerOrder: 5, promotions: [] };

test("missing and invalid commercial data cannot become purchasable", () => {
  assert.equal(purchaseLimit(variant), 5);
  assert.equal(purchaseLimit({ ...variant, availableQuantity: 2 }), 2);
  assert.equal(purchaseLimit({ ...variant, maxPerOrder: null }), 0);
  assert.equal(purchaseLimit({ ...variant, availableQuantity: 1.5 }), 0);
  assert.equal(availability({ ...variant, availableQuantity: 0 }), "Agotado");
  assert.equal(availability({ ...variant, price: null }), "Disponibilidad no confirmada");
});

test("large catalogs are paged without gaps or out of range offsets", () => {
  const input: Product[] = Array.from({ length: 1001 }, (_, index) => ({
    id: String(index), slug: String(index), name: "Producto de prueba", brand: "Demo", categoryId: "test", variants: [],
  }));
  const middle = paginateCatalog(input, "2");
  assert.equal(middle.records.length, 24);
  assert.equal(middle.records[0].id, "24");
  assert.equal(paginateCatalog(input, "99999999").records.at(-1)?.id, "1000");
  assert.equal(paginateCatalog([], "-1").page, 1);
});
