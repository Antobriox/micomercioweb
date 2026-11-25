"use client";

import { recordFunnelEvent } from "../../lib/analytics/demo-funnel";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import {
  accountCartSnapshot, changeAccountCart, initialAccountCart, subscribeToAccountCart, syncAccountCart,
} from "../../lib/cart/client-account";
import { guestCartSnapshot, parseGuestCart, setGuestCartQuantity, subscribeToGuestCart, type GuestCartLine } from "../../lib/cart/guest";
import { estimateTotal, lineEstimate } from "../../lib/cart/estimate";
import { formatMoney } from "../../lib/commercial/catalog";
import type { Money } from "../../lib/commercial/contracts";
import { equalPrice } from "../../lib/commercial/pricing";
import { Button, Card, Notice, TextLink } from "../ui/primitives";
import { CartCount } from "./cart-count";

type Item = { id: string; name: string; slug: string; presentation: string; limit: number; price: Money | null };

function CartLine({ line, item, change, disabled }: {
  line: GuestCartLine;
  item?: Item;
  change: (id: string, quantity: number, limit: number) => void;
  disabled: boolean;
}) {
  const [value, setValue] = useState(String(line.quantity));
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    change(line.variantId, /^\d+$/.test(value) ? Number(value) : NaN, item?.limit ?? 0);
  }
  return (
    <Card>
      <h2 className="text-lg font-extrabold">
        {item ? <Link href={`/producto/${encodeURIComponent(item.slug)}`} className="ui-link">{item.name}</Link> : "Presentación guardada"}
      </h2>
      <p className="text-muted">{item?.presentation ?? "Datos de la presentación no disponibles."}</p>
      <p className="mt-1">{formatMoney(item?.price ?? null)} por presentación</p>
      {item && item.limit < line.quantity && <p className="mt-1 font-semibold text-accent">La cantidad guardada supera la disponibilidad actual.</p>}
      <p className="mt-1 font-semibold">Subtotal · {formatMoney(lineEstimate(item?.price ?? null, line.quantity))}</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <form className="flex flex-wrap items-end gap-2" onSubmit={save} noValidate>
          <label className="grid w-28 gap-1 text-sm font-semibold">Cantidad
            <input className="ui-field" type="number" min="1" step="1" max={item?.limit} value={value}
              onChange={(event) => setValue(event.target.value)} disabled={disabled || !item?.limit} />
          </label>
          <Button type="submit" tone="secondary" disabled={disabled || !item?.limit}>Actualizar</Button>
        </form>
        <Button type="button" tone="danger" disabled={disabled} onClick={() => change(line.variantId, 0, 0)}>Quitar</Button>
      </div>
    </Card>
  );
}

export function CartView() {
  const raw = useSyncExternalStore(subscribeToGuestCart, guestCartSnapshot, () => null);
  const account = useSyncExternalStore(subscribeToAccountCart, accountCartSnapshot, initialAccountCart);
  useEffect(() => {
    if (account.mode === "account") recordFunnelEvent("signin");
  }, [account.mode]);
  const guest = parseGuestCart(raw);
  const lines = account.mode === "account" ? account.lines : guest;
  const key = JSON.stringify(lines.map(({ variantId }) => variantId));
  const [lookup, setLookup] = useState<{ key: string; items: Item[]; error: boolean } | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ids: string[] = JSON.parse(key);
    if (!ids.length) return;
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/carrito/cotizar", {
          method: "POST", body: JSON.stringify({ ids }), headers: { "Content-Type": "application/json" }, signal: controller.signal,
        });
        if (!response.ok) throw new Error("Cart prices unavailable");
        const { items }: { items: Item[] } = await response.json();
        if (!controller.signal.aborted) setLookup({ key, items, error: false });
      } catch {
        if (!controller.signal.aborted) setLookup({ key, items: [], error: true });
      }
    }
    void refresh();
    return () => controller.abort();
  }, [key]);

  const current = lookup?.key === key ? lookup : null;
  const items = new Map(current?.items.map((item) => [item.id, item]));
  const changed = current && !current.error && lines.some(({ variantId, observedUnitPrice }) =>
    observedUnitPrice && !equalPrice(observedUnitPrice, items.get(variantId)?.price ?? null));
  const total = estimateTotal(lines.map((line) => lineEstimate(items.get(line.variantId)?.price ?? null, line.quantity)));

  async function change(id: string, quantity: number, limit: number) {
    if (quantity !== 0 && (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > limit)) {
      setMessage(`Usa una cantidad entera entre 1 y ${limit}.`);
      return;
    }
    setMessage("");
    if (account.mode === "account") {
      setPending(true);
      const status = await changeAccountCart("set", id, quantity, crypto.randomUUID());
      setPending(false);
      if (status === "saved" && quantity === 0) recordFunnelEvent("remove");
      if (status !== "saved") setMessage(status === "expired" ? "Tu sesión expiró. Tu carrito de cuenta sigue guardado." :
        "El cambio no se confirmó. Las líneas permanecen guardadas.");
      return;
    }
    const status = setGuestCartQuantity(id, quantity, limit);
    if (status !== "saved") setMessage("El navegador no pudo guardar el cambio.");
    else if (quantity === 0) recordFunnelEvent("remove");
  }

  if (!lines.length && account.mode === "loading") return <p role="status">Cargando carrito.</p>;
  return (
    <div className="space-y-4">
      <CartCount showLabel={false} />
      {account.mode === "error" && <Notice tone="warning">No pudimos sincronizar tu carrito. Tus líneas de visitante siguen guardadas.
        <Button className="mt-2" onClick={() => void syncAccountCart()}>Reintentar sincronización</Button>
      </Notice>}
      {message && <Notice tone="error" announce>{message}</Notice>}
      {current?.error && <Notice tone="warning">No pudimos volver a verificar los precios del carrito.</Notice>}
      {changed && <Notice tone="warning" announce>Algún precio o promoción cambió desde que agregaste el producto. Revisa los precios vigentes.</Notice>}
      {!lines.length ? <Card><p>El carrito está vacío.</p><TextLink href="/catalogo">Explorar el catálogo</TextLink></Card> :
        <>
          <ul className="grid gap-3">
            {lines.map((line) => <li key={line.variantId}><CartLine key={line.quantity} line={line}
              item={items.get(line.variantId)} change={change} disabled={pending || account.mode === "loading"} /></li>)}
          </ul>
          <Card>
            <p className="text-lg font-extrabold">Total estimado · {formatMoney(total)}</p>
            <p>Pago y facturación únicamente en caja.</p>
            <TextLink href={account.mode === "account" ? "/pedido/confirmar" : "/acceso?volver=/pedido/confirmar"}>
              Revisar pedido de prueba
            </TextLink>
          </Card>
        </>}
    </div>
  );
}
