"use client";

import { ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

import { readGuestCart, subscribeToGuestCart } from "../../lib/cart/guest";

function cartCount() {
  return readGuestCart().reduce((total, line) => total + line.quantity, 0);
}

export function CartCount({ showLabel = true }: { showLabel?: boolean }) {
  const count = useSyncExternalStore(subscribeToGuestCart, cartCount, () => 0);
  return showLabel ? (
    <Link href="/carrito" aria-label={`Carrito, ${count} ${count === 1 ? "artículo" : "artículos"}`}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 font-semibold text-brand sm:px-3">
      <ShoppingBasket size={20} aria-hidden="true" />
      <span className="hidden sm:inline">Carrito</span>
      <span className="min-w-6 rounded-full bg-brand px-1.5 py-0.5 text-center text-xs text-white" aria-hidden="true">{count}</span>
      <span className="sr-only" role="status">Carrito, {count} {count === 1 ? "artículo" : "artículos"}</span>
    </Link>
  ) : (
    <p role="status">{count} {count === 1 ? "artículo" : "artículos"} en el carrito.</p>
  );
}
