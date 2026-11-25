import type { Money, Product, Variant } from "./contracts";
import { knownPrice, variantPricing } from "./pricing";

export const categoryLabels: Readonly<Record<string, string>> = {
  despensa: "Despensa",
  bebidas: "Bebidas",
};

export function categoryName(id: string) {
  return Object.hasOwn(categoryLabels, id) ? categoryLabels[id] : id;
}

export function formatMoney(price: Money | null) {
  if (!knownPrice(price)) return "Precio no disponible";
  const format = new Intl.NumberFormat("es-EC", { style: "currency", currency: price.currency });
  return format.format(price.amountInMinorUnits / 10 ** (format.resolvedOptions().maximumFractionDigits ?? 2));
}

export function purchaseLimit(variant: Variant, at = new Date()) {
  const { availableQuantity, maxPerOrder } = variant;
  if (!variantPricing(variant, at).current || availableQuantity === null || maxPerOrder === null ||
    !Number.isSafeInteger(availableQuantity) || !Number.isSafeInteger(maxPerOrder)) return 0;
  return Math.max(0, Math.min(availableQuantity, maxPerOrder, 10000));
}

export function availability(variant: Variant) {
  if (variant.availableQuantity === 0) return "Agotado";
  return purchaseLimit(variant) > 0 ? "Disponible" : "Disponibilidad no confirmada";
}

export const catalogPageSize = 24;

export function paginateCatalog(records: readonly Product[], value: unknown) {
  const pages = Math.max(1, Math.ceil(records.length / catalogPageSize));
  const requested = typeof value === "string" && /^\d{1,8}$/.test(value) ? Number(value) : 1;
  const page = Math.min(pages, Math.max(1, requested));
  const start = (page - 1) * catalogPageSize;
  return { page, pages, records: records.slice(start, start + catalogPageSize) };
}
