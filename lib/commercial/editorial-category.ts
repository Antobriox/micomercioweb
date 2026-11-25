import { categoryName } from "./catalog";
import type { Product } from "./contracts";

export function storefrontCategoryLabel(products: readonly Product[], id: string) {
  return products.find((product) => product.categoryId === id)?.editorial?.categoryTitle ?? categoryName(id);
}
