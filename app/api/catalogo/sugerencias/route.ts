import { NextResponse, type NextRequest } from "next/server";

import { formatMoney } from "../../../../lib/commercial/catalog";
import { demoEditorial } from "../../../../lib/commercial/demo-editorial";
import { variantPricing } from "../../../../lib/commercial/pricing";
import { parseFilters, searchProducts } from "../../../../lib/commercial/search";
import { commercial } from "../../../../lib/server/commercial";

export async function GET(request: NextRequest) {
  const { q } = parseFilters({ q: request.nextUrl.searchParams.get("q") ?? undefined });
  if (q.length < 2) return NextResponse.json([]);
  const catalog = await commercial.getCatalog();
  if (!("records" in catalog)) return NextResponse.json([], { status: 503 });
  const { matches } = searchProducts(catalog.records, parseFilters({ q }));
  return NextResponse.json(matches.slice(0, 6).map((product) => ({
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: formatMoney(variantPricing(product.variants[0]).current),
    photo: catalog.source === "simulated" ? demoEditorial(product.id)?.photos[0]?.src : undefined,
  })), { headers: { "Cache-Control": "no-store" } });
}
