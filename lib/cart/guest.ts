export const guestCartKey = "mi-comercio:carrito-de-prueba";
export const guestCartEvent = "mi-comercio:carrito-actualizado";

export interface GuestCartLine {
  variantId: string;
  quantity: number;
}

export function parseGuestCart(raw: string | null): GuestCartLine[] {
  try {
    const value: unknown = JSON.parse(raw ?? "[]");
    if (!Array.isArray(value)) return [];
    const lines: GuestCartLine[] = [];
    const seen = new Set<string>();
    for (const candidate of value.slice(0, 200)) {
      if (typeof candidate !== "object" || candidate === null) continue;
      const { variantId, quantity } = candidate as Record<string, unknown>;
      if (typeof variantId !== "string" || variantId.length === 0 || variantId.length > 100 ||
        typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000 ||
        seen.has(variantId)) continue;
      lines.push({ variantId, quantity });
      seen.add(variantId);
    }
    return lines;
  } catch {
    return [];
  }
}

export function readGuestCart() {
  try {
    return parseGuestCart(window.localStorage.getItem(guestCartKey));
  } catch {
    return [];
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
