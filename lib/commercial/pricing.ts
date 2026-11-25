import type { Money, Variant } from "./contracts";
import { getActivePromotions } from "./promotions";

export function knownPrice(price: Money | null | undefined): price is Money {
  return !!price && /^[A-Z]{3}$/.test(price.currency) && Number.isSafeInteger(price.amountInMinorUnits) && price.amountInMinorUnits >= 0;
}

export function variantPricing(variant: Variant | undefined, instant = new Date()) {
  const base = knownPrice(variant?.price) ? variant.price : null;
  const eligible = variant ? getActivePromotions(variant.promotions, instant).filter(({ price }) =>
    knownPrice(price) && (!base || base.currency === price.currency),
  ) : [];
  if (eligible.length !== 1) return { current: base, offer: null };

  const promotion = eligible[0];
  const prior = promotion.previousPrice;
  const previous = knownPrice(prior) && prior.currency === promotion.price.currency &&
    prior.amountInMinorUnits > promotion.price.amountInMinorUnits ? prior : null;
  const percentage = previous
    ? Number(BigInt(previous.amountInMinorUnits - promotion.price.amountInMinorUnits) * BigInt(100) / BigInt(previous.amountInMinorUnits))
    : 0;
  return { current: promotion.price, offer: { ...promotion, previous, percentage } };
}

export function equalPrice(a: Money | null, b: Money | null) {
  return a?.amountInMinorUnits === b?.amountInMinorUnits && a?.currency === b?.currency;
}
