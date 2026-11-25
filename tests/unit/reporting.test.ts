import assert from "node:assert/strict";
import { test } from "node:test";
import type { Sale } from "../../lib/commercial/contracts";
import { inventoryOverview, reportPeriod, salesOverview } from "../../lib/commercial/reporting";

test("SPEC-031 uses calendar boundaries in Guayaquil for every reporting period", () => {
  assert.equal(reportPeriod("2026-11-25", "dia").selection.from, "2026-11-25T05:00:00.000Z");
  assert.equal(reportPeriod("2026-11-25", "semana").from, "2026-11-23");
  assert.equal(reportPeriod("2026-11-25", "mes").before, "2026-12-01");
  assert.equal(reportPeriod("2026-11-25", "anio").comparison.from, "2025-01-01T05:00:00.000Z");
  assert.equal(reportPeriod("2026-02-31", "dia", new Date("2026-03-01T01:00:00Z")).from, "2026-02-28");
});

test("SPEC-031 reports cash sales and refunds separately, preserving missing data", () => {
  const sale: Sale = { id: "test-sale", occursAt: "2026-11-25T16:30Z", total: { amountInMinorUnits: 500, currency: "USD" },
    register: "Caja de prueba", cashier: null, kind: "sale", lines: [{ variantId: "sku-test", quantity: 2 }] };
  const result = salesOverview([sale, { ...sale, id: "test-refund", kind: "return", total: { amountInMinorUnits: 200, currency: "USD" } }]);
  assert.equal(result.net?.amountInMinorUnits, 300);
  assert.equal(result.ticket?.amountInMinorUnits, 300);
  assert.equal(result.peak, "11");
  assert.deepEqual(result.top, [["sku-test", 2]]);
  assert.equal(salesOverview([{ ...sale, total: null }]).net, null);
  assert.equal(salesOverview([]).net, null);
});

test("SPEC-032 preserves stock zero, unknown stock and duplicate identifiers", () => {
  const cost = { amountInMinorUnits: 100, currency: "USD" };
  const stock = [
    { variantId: "empty", quantity: 0, unitCost: cost },
    { variantId: "low", quantity: 3, unitCost: cost },
  ];
  assert.equal(inventoryOverview(stock).valuation?.amountInMinorUnits, 300);
  assert.equal(inventoryOverview([{ ...stock[0], unitCost: null }]).valuation, null);
  assert.equal(inventoryOverview([{ ...stock[0], quantity: null }]).valuation, null);
  const duplicate = inventoryOverview([...stock, stock[1]]);
  assert.equal(duplicate.valuation, null);
  assert.deepEqual(duplicate.bad, ["low"]);
  assert.equal(duplicate.distinct[0].quantity, 0);
});
