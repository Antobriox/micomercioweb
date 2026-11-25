import assert from "node:assert/strict";
import { test } from "node:test";

import { parseFilters, searchProducts } from "../../lib/commercial/search";
import { createSimulatedAdapter } from "../../lib/server/commercial/simulated-adapter";

test("search handles accents, brand words and unknown filters", async () => {
  const { records } = await createSimulatedAdapter().readCatalog();
  const result = searchProducts(records, parseFilters({ q: "ÁRROZ demostracion" }));
  assert.deepEqual(result.matches.map(({ id }) => id), ["demo-arroz"]);
  assert.deepEqual(searchProducts(records, parseFilters({ q: "[<]" })).matches, []);
  assert.equal(parseFilters({ disponibilidad: "desconocido", orden: "otro" }).orden, "relevancia");
});

test("filters select the same variant and retain source records while ordering", async () => {
  const { records } = await createSimulatedAdapter().readCatalog();
  const result = searchProducts(records, parseFilters({ categoria: "despensa", disponibilidad: "disponible", minimo: "10,00", maximo: "15" }));
  assert.deepEqual(result.matches.map(({ variants }) => variants[0].id), ["demo-arroz-5-kg"]);
  assert.equal(records[0].variants[0].id, "demo-arroz-1-kg");
  assert.equal(searchProducts(records, parseFilters({ minimo: "10", maximo: "8" })).invalidRange, true);
  assert.equal(searchProducts(records, parseFilters({ orden: "precio-asc" })).matches[0].id, "demo-avena");
});
