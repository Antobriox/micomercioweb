import { NextResponse, type NextRequest } from "next/server";

import { purchaseLimit } from "../../../../lib/commercial/catalog";
import { variantPricing } from "../../../../lib/commercial/pricing";
import { commercial } from "../../../../lib/server/commercial";

export async function POST(request: NextRequest) {
  let ids: unknown;
  try {
    const payload: unknown = await request.json();
    if (typeof payload === "object" && payload !== null && "ids" in payload) ids = payload.ids;
  } catch {
    // Invalid JSON uses the same response as an invalid list.
  }

  if (!Array.isArray(ids) || ids.length > 200 || ids.some((id) => typeof id !== "string" || id.length < 1 || id.length > 100)) {
    return NextResponse.json({ error: "Presentaciones inválidas." }, { status: 400 });
  }
  const catalog = await commercial.getCatalog();
  if (catalog.state !== "available" && catalog.state !== "empty") {
    return NextResponse.json({ error: "Los precios actuales no están disponibles." }, { status: 503 });
  }
  const selected = new Set<string>(ids);
  const at = new Date();
  const items = catalog.records.flatMap(({ name, slug, variants }) => variants
    .filter(({ id }) => selected.has(id))
    .map((variant) => ({
      id: variant.id, name, slug, presentation: variant.presentation,
      limit: purchaseLimit(variant), price: variantPricing(variant, at).current,
    })));
  const quotes = Object.fromEntries(items.map(({ id, price }) => [id, price]));
  return NextResponse.json({ quotes, items }, { headers: { "Cache-Control": "no-store" } });
}
