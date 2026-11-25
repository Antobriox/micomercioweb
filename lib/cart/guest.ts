import type { Money } from "../commercial/contracts";
import { knownPrice } from "../commercial/pricing";

export const guestCartKey = "mi-comercio:carrito-de-prueba";
export const guestCartEvent = "mi-comercio:carrito-actualizado";

export interface GuestCartLine {
  variantId: string;
  quantity: number;
  observedUnitPrice?: Money;
}

function readPrice(value: unknown): Money | undefined {
  if (!value || typeof value !== "object" || !("amountInMinorUnits" in value) || !("currency" in value) ||
    typeof value.amountInMinorUnits !== "number" || typeof value.currency !== "string") return;
  const price = { amountInMinorUnits: value.amountInMinorUnits, currency: value.currency };
  return knownPrice(price) ? price : undefined;
}

export function parseGuestCart(raw: string | null): GuestCartLine[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const lines: GuestCartLine[] = [];
    const seen = new Set<string>();
    for (const candidate of value.slice(0, 200)) {
      if (typeof candidate !== "object" || candidate === null) continue;
      const { variantId, quantity, observedUnitPrice } = candidate as Record<string, unknown>;
      if (typeof variantId !== "string" || variantId.length === 0 || variantId.length > 100 ||
        typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000 ||
        seen.has(variantId)) continue;
      const price = readPrice(observedUnitPrice);
      lines.push({ variantId, quantity, ...(price ? { observedUnitPrice: price } : {}) });
      seen.add(variantId);
    }
    return lines;
  } catch {
    return [];
  }
}

export function guestCartSnapshot() {
  try {
    return window.localStorage.getItem(guestCartKey);
  } catch {
    return null;
  }
}

export function readGuestCart() {
  return parseGuestCart(guestCartSnapshot());
}

export function clearGuestCartIfUnchanged(snapshot: string | null) {
  try {
    if (window.localStorage.getItem(guestCartKey) !== snapshot) return false;
    window.localStorage.removeItem(guestCartKey);
    window.dispatchEvent(new Event(guestCartEvent));
    return true;
  } catch {
    return false;
  }
}

export function setGuestCartQuantity(variantId: string, quantity: number, limit: number): "saved" | "limit" | "storage" {
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > Math.min(limit, 10000)) return "limit";
  try {
    const lines = parseGuestCart(window.localStorage.getItem(guestCartKey));
    const existing = lines.find((line) => line.variantId === variantId);
    if (existing) {
      existing.quantity = quantity;
      window.localStorage.setItem(guestCartKey, JSON.stringify(lines.filter((line) => line.quantity > 0)));
      window.dispatchEvent(new Event(guestCartEvent));
    }
    return "saved";
  } catch {
    return "storage";
  }
}

export function addGuestCartLine(variantId: string, quantity: number, limit: number, unitPrice?: Money | null): "added" | "limit" | "storage" {
  if (!variantId || variantId.length > 100 || !Number.isSafeInteger(quantity) || quantity < 1 ||
    !Number.isSafeInteger(limit) || quantity > Math.min(limit, 10000)) return "limit";
  try {
    const lines = parseGuestCart(window.localStorage.getItem(guestCartKey));
    const line = lines.find((entry) => entry.variantId === variantId);
    if (line) {
      if (line.quantity + quantity > Math.min(limit, 10000)) return "limit";
      line.quantity += quantity;
      if (!line.observedUnitPrice && knownPrice(unitPrice)) line.observedUnitPrice = unitPrice;
    } else {
      if (lines.length >= 200) return "storage";
      lines.push({ variantId, quantity, ...(knownPrice(unitPrice) ? { observedUnitPrice: unitPrice } : {}) });
    }
    window.localStorage.setItem(guestCartKey, JSON.stringify(lines));
    window.dispatchEvent(new Event(guestCartEvent));
    return "added";
  } catch {
    return "storage";
  }
}

export function subscribeToGuestCart(onChange: () => void) {
  function storageChanged(event: StorageEvent) {
    if (event.key === guestCartKey || event.key === null) onChange();
  }
  window.addEventListener("storage", storageChanged);
  window.addEventListener(guestCartEvent, onChange);
  return () => {
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(guestCartEvent, onChange);
  };
}

