import { NextResponse, type NextRequest } from "next/server";

import { parseGuestCart, type GuestCartLine } from "../../../../lib/cart/guest";
import { purchaseLimit } from "../../../../lib/commercial/catalog";
import { variantPricing } from "../../../../lib/commercial/pricing";
import { getCurrentAccount } from "../../../../lib/server/account";
import { getAppOrigin } from "../../../../lib/server/app-origin";
import { getStorefrontCatalog } from "../../../../lib/server/commercial/storefront";

type Account = NonNullable<Awaited<ReturnType<typeof getCurrentAccount>>>;

function problem(status: number) {
  return NextResponse.json({ error: "No se pudo actualizar el carrito." }, { status });
}

async function snapshot(account: Account) {
  const { data, error } = await account.client.from("cart_items")
    .select("variant_id,quantity,quoted_minor,quoted_currency").eq("user_id", account.id).limit(200);
  if (error) return problem(503);
  const lines: GuestCartLine[] = (data ?? []).map((row) => ({
    variantId: row.variant_id, quantity: row.quantity,
    ...(row.quoted_minor !== null && row.quoted_currency ? {
      observedUnitPrice: { amountInMinorUnits: row.quoted_minor, currency: row.quoted_currency },
    } : {}),
  }));
  return NextResponse.json({ lines }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const account = await getCurrentAccount();
  return account ? snapshot(account) : problem(401);
}

export async function POST(request: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return problem(401);
  const origin = request.headers.get("origin");
  if (!origin || origin !== getAppOrigin()) return problem(403);

  let body: unknown;
  try { body = await request.json(); } catch { return problem(400); }
  if (!body || typeof body !== "object" || !("intent" in body) || !("key" in body) ||
      typeof body.key !== "string" || !/^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i.test(body.key)) return problem(400);

  let input;
  if (body.intent === "merge" && "lines" in body && Array.isArray(body.lines)) {
    const lines = parseGuestCart(JSON.stringify(body.lines));
    if (!lines.length || lines.length !== body.lines.length) return problem(400);
    input = lines.map(({ variantId, quantity, observedUnitPrice }) => ({
      sku: variantId, quantity, ceiling: 10000,
      minor: observedUnitPrice?.amountInMinorUnits ?? null, currency: observedUnitPrice?.currency ?? null,
    }));
  } else if ((body.intent === "set" || body.intent === "add") && "variantId" in body && "quantity" in body &&
      typeof body.variantId === "string" && body.variantId.length >= 1 && body.variantId.length <= 100 &&
      typeof body.quantity === "number" && Number.isSafeInteger(body.quantity) && body.quantity >= 0 &&
      (body.intent !== "add" || body.quantity > 0)) {
    const sku = body.variantId;
    const quantity = body.quantity;
    if (quantity === 0) {
      input = [{ sku, quantity, ceiling: 0, minor: null, currency: null }];
    } else {
      const catalog = await getStorefrontCatalog();
      if (catalog.state !== "available") return problem(503);
      const variant = catalog.records.flatMap(({ variants }) => variants).find(({ id }) => id === sku);
      const ceiling = variant ? purchaseLimit(variant) : 0;
      if (!variant || quantity > ceiling) return problem(409);
      const price = variantPricing(variant).current;
      input = [{ sku, quantity, ceiling, minor: price?.amountInMinorUnits, currency: price?.currency }];
    }
  } else {
    return problem(400);
  }

  const { error } = await account.client.rpc("change_my_cart", { operation: body.key, intent: body.intent, incoming: input });
  if (error) return problem(error.code === "23514" ? 409 : error.code === "42501" ? 401 : 503);
  return snapshot(account);
}
