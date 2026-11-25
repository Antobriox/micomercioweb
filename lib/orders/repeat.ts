import { purchaseLimit } from "../commercial/catalog";
import type { Product } from "../commercial/contracts";
import { variantPricing } from "../commercial/pricing";

export function planRepeat(
  previous: readonly { variant_id: string; quantity: number; product_name: string }[],
  catalog: readonly Product[],
  at = new Date(),
) {
  const variants = new Map(catalog.flatMap(({ variants }) => variants.map((variant) => [variant.id, variant] as const)));
  return previous.map((entry) => {
    const current = variants.get(entry.variant_id);
    const price = variantPricing(current, at).current;
    if (!current || !price || entry.quantity > purchaseLimit(current, at) || entry.quantity < 1 || !Number.isInteger(entry.quantity)) {
      return { name: entry.product_name, item: null };
    }
    return {
      name: entry.product_name,
      item: { sku: current.id, quantity: entry.quantity, ceiling: 10000, minor: price.amountInMinorUnits, currency: price.currency },
    };
  });
}
