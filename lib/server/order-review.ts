import "server-only";

import { createHash } from "node:crypto";

import { buildCartReview, reviewSnapshot } from "../cart/review";
import { getStorefrontCatalog } from "./commercial/storefront";
import type { getCurrentAccount } from "./account";

type Account = NonNullable<Awaited<ReturnType<typeof getCurrentAccount>>>;

export async function getAccountOrderReview(account: Account) {
  const [{ data, error }, catalog] = await Promise.all([
    account.client.from("cart_items").select("variant_id,quantity,quoted_minor,quoted_currency")
      .eq("user_id", account.id).limit(200),
    getStorefrontCatalog(),
  ]);
  if (error || !data) return { state: "unavailable" } as const;
  const review = buildCartReview(data.map((row) => ({
    variantId: row.variant_id,
    quantity: row.quantity,
    ...(row.quoted_minor != null && row.quoted_currency ? {
      observedUnitPrice: { amountInMinorUnits: row.quoted_minor, currency: row.quoted_currency },
    } : {}),
  })), catalog, new Date());
  if (review.state !== "available") return review;

  const snapshot = reviewSnapshot(review);
  const revision = review.valid ? createHash("sha256").update(JSON.stringify(snapshot)).digest("hex") : null;
  return { ...review, revision, snapshot };
}
