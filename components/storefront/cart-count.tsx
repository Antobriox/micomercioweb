"use client";

import { ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { readGuestCart, subscribeToGuestCart } from "../../lib/cart/guest";
import { accountCartSnapshot, initialAccountCart, subscribeToAccountCart, syncAccountCart } from "../../lib/cart/client-account";

function cartCount() {
  return readGuestCart().reduce((total, line) => total + line.quantity, 0);
}

export function CartCount({ showLabel = true }: { showLabel?: boolean }) {
  const guest = useSyncExternalStore(subscribeToGuestCart, cartCount, () => 0);
  const account = useSyncExternalStore(subscribeToAccountCart, accountCartSnapshot, initialAccountCart);
  const path = usePathname();
  useEffect(() => {
    if (!showLabel) return;
    void syncAccountCart();
    const refresh = () => { void syncAccountCart(); };
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, [path, showLabel]);
  const count = account.mode === "account" ? account.lines.reduce((total, { quantity }) => total + quantity, 0) : guest;
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
