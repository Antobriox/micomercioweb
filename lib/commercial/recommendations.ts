import { purchaseLimit } from "./catalog";
import type { Product } from "./contracts";

const complements: Readonly<Record<string, readonly string[]>> = {
  despensa: ["bebidas"],
  bebidas: ["despensa"],
};

export function recommendProducts(current: Product, records: readonly Product[]) {
  const complementary = Object.hasOwn(complements, current.categoryId) ? complements[current.categoryId] : [];
  const order = [current.categoryId, ...complementary];

  return order.flatMap((category) => records.filter((item) =>
    item.id !== current.id && item.categoryId === category && item.variants.some((variant) => purchaseLimit(variant) > 0),
  )).slice(0, 4);
}
