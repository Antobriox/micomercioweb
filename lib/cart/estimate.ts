import type { Money } from "../commercial/contracts";
import { knownPrice } from "../commercial/pricing";

export function lineEstimate(price: Money | null, quantity: number): Money | null {
  if (!knownPrice(price) || !Number.isSafeInteger(quantity) || quantity < 1) return null;
  const amount = price.amountInMinorUnits * quantity;
  return Number.isSafeInteger(amount) ? { ...price, amountInMinorUnits: amount } : null;
}

export function estimateTotal(values: readonly (Money | null)[]): Money | null {
  const first = values[0];
  if (!first) return null;
  let total = 0;
  for (const value of values) {
    if (!knownPrice(value) || value.currency !== first.currency) return null;
    total += value.amountInMinorUnits;
    if (!Number.isSafeInteger(total)) return null;
  }
  return { ...first, amountInMinorUnits: total };
}
