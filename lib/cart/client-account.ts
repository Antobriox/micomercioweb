import {
  clearGuestCartIfUnchanged, guestCartSnapshot, parseGuestCart, type GuestCartLine,
} from "./guest";

const endpoint = "/api/carrito/cuenta";

type CartState = { mode: "loading" | "guest" | "error" | "account"; lines: readonly GuestCartLine[] };
const initial: CartState = { mode: "loading", lines: [] };
let state = initial;
let pendingSync: Promise<void> | null = null;
let generation = 0;
const subscribers = new Set<() => void>();

export const accountCartSnapshot = () => state;
export const initialAccountCart = () => initial;

export function subscribeToAccountCart(listener: () => void) {
  subscribers.add(listener);
  return () => subscribers.delete(listener);
}

function setState(next: CartState) {
  state = next;
  for (const notify of subscribers) notify();
}

function post(payload: object) {
  return fetch(endpoint, {
    method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function syncAccountCart() {
  if (pendingSync) return pendingSync;
  const current = ++generation;
  const save = (next: CartState) => { if (current === generation) setState(next); };
  pendingSync = (async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      if (response.status === 401) { save({ mode: "guest", lines: [] }); return; }
      if (!response.ok) throw new Error("Cart lookup failed");
      const { lines }: { lines: GuestCartLine[] } = await response.json();
      const original = guestCartSnapshot();
      const local = parseGuestCart(original);
      if (!local.length) {
        save({ mode: "account", lines });
        return;
      }
      const merged = await post({ key: crypto.randomUUID(), intent: "merge", lines: local });
      if (!merged.ok) throw new Error("Cart merge failed");
      const { lines: combined }: { lines: GuestCartLine[] } = await merged.json();
      if (current === generation) clearGuestCartIfUnchanged(original);
      save({ mode: "account", lines: combined });
    } catch {
      save({ mode: "error", lines: [] });
    } finally {
      pendingSync = null;
    }
  })();
  return pendingSync;
}

export async function changeAccountCart(
  intent: "add" | "set", variantId: string, quantity: number, key: string,
): Promise<"saved" | "limit" | "expired" | "error"> {
  await pendingSync;
  const current = ++generation;
  try {
    const response = await post({ key, intent, variantId, quantity });
    if (response.status === 401) {
      if (current === generation) setState({ mode: "guest", lines: [] });
      return "expired";
    }
    if (response.status === 409) return "limit";
    if (!response.ok) return "error";
    const { lines }: { lines: GuestCartLine[] } = await response.json();
    if (current === generation) setState({ mode: "account", lines });
    return "saved";
  } catch {
    return "error";
  }
}
