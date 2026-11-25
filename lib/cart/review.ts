import { purchaseLimit } from "../commercial/catalog";
import type { CommercialRead, Product } from "../commercial/contracts";
import { equalPrice, variantPricing } from "../commercial/pricing";
import { estimateTotal, lineEstimate } from "./estimate";
import type { GuestCartLine } from "./guest";

export function buildCartReview(lines: readonly GuestCartLine[], catalog: CommercialRead<Product>, at: Date) {
  if (catalog.state !== "available" && catalog.state !== "empty") return { state: "unavailable" } as const;
  const variants = new Map(catalog.records.flatMap((product) => product.variants.map((variant) => [variant.id, { product, variant }] as const)));
  const items = [...lines].sort((a, b) => a.variantId.localeCompare(b.variantId)).map((line) => {
    const record = variants.get(line.variantId);
    const price = variantPricing(record?.variant, at).current;
    const subtotal = lineEstimate(price, line.quantity);
    const limit = record ? purchaseLimit(record.variant, at) : 0;
    return {
      id: line.variantId,
      productName: record?.product.name ?? "Presentación guardada",
      presentation: record?.variant.presentation ?? "Datos no disponibles",
      unit: record?.variant.unit ?? "",
      quantity: line.quantity,
      price,
      subtotal,
      limit,
      changed: !!line.observedUnitPrice && !equalPrice(line.observedUnitPrice, price),
      available: !!record && Number.isSafeInteger(line.quantity) && line.quantity > 0 && line.quantity <= limit && !!subtotal,
    };
  });
  const total = estimateTotal(items.map(({ subtotal }) => subtotal));
  const valid = !!total && items.length > 0 && items.every(({ available }) => available);
  return { state: "available", source: catalog.source, items, total, valid } as const;
}

export function reviewSnapshot(review: Extract<ReturnType<typeof buildCartReview>, { state: "available" }>) {
  return {
    lines: review.items.map(({ id, productName, presentation, unit, quantity, price }) => ({
      sku: id, productName, presentation, unit, quantity, unitPriceMinor: price?.amountInMinorUnits,
      currency: price?.currency,
    })),
    totalMinor: review.total?.amountInMinorUnits,
    currency: review.total?.currency,
  };
}
