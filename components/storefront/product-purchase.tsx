"use client";

import { useRef, useState, type FormEvent } from "react";

import { recordFunnelEvent } from "../../lib/analytics/demo-funnel";
import { FunnelMark } from "./funnel-mark";
import { addGuestCartLine } from "../../lib/cart/guest";
import { changeAccountCart } from "../../lib/cart/client-account";
import { availability, purchaseLimit } from "../../lib/commercial/catalog";
import type { Variant } from "../../lib/commercial/contracts";
import type { CatalogPhoto } from "../../lib/commercial/demo-editorial";
import { variantPricing } from "../../lib/commercial/pricing";
import { Button, Notice, TextLink } from "../ui/primitives";
import { ProductImage } from "./product-image";
import { ProductPrice } from "./product-price";

export function ProductPurchase({ variants, photos, canAdd, signedIn }: {
  variants: readonly Variant[]; photos: readonly CatalogPhoto[]; canAdd: boolean; signedIn: boolean;
}) {
  const [id, setId] = useState(variants.length === 1 ? variants[0].id : "");
  const [quantity, setQuantity] = useState("1");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [pending, setPending] = useState(false);
  const attempt = useRef<{ sku: string; count: number; key: string }>(null);
  const selector = useRef<HTMLSelectElement>(null);
  const quantityField = useRef<HTMLInputElement>(null);
  const variant = variants.find((entry) => entry.id === id);
  const preview = variant ?? variants[0];
  const visiblePhotos = photos.filter((photo) => !photo.variantId || photo.variantId === preview?.id);
  const limit = variant && canAdd ? purchaseLimit(variant) : 0;

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    if (!variant) {
      setResult({ ok: false, message: "Selecciona una presentación antes de agregar el producto." });
      selector.current?.focus();
      return;
    }
    const count = /^\d+$/.test(quantity) ? Number(quantity) : NaN;
    if (signedIn && Number.isSafeInteger(count) && count > 0 && count <= limit) {
      if (attempt.current?.sku !== variant.id || attempt.current.count !== count) {
        attempt.current = { sku: variant.id, count, key: crypto.randomUUID() };
      }
      setPending(true);
      const saved = await changeAccountCart("add", variant.id, count, attempt.current.key);
      setPending(false);
      if (saved !== "expired") {
        if (saved === "saved") recordFunnelEvent("add");
        if (saved !== "error") attempt.current = null;
        setResult({ ok: saved === "saved", message: saved === "saved" ? "Producto agregado al carrito de prueba."
          : saved === "limit" ? `El límite de esta presentación, incluido tu carrito, es ${limit}.`
            : "No pudimos confirmar el cambio. Intenta nuevamente con la misma cantidad." });
        return;
      }
    }
    const status = addGuestCartLine(variant.id, count, limit, variantPricing(variant).current);
    if (status === "added") {
      recordFunnelEvent("add");
      setResult({ ok: true, message: "Producto agregado al carrito de prueba." });
    }
    else {
      setResult({
        ok: false,
        message: status === "limit" ? `Usa una cantidad entera. El límite de esta presentación, incluido tu carrito, es ${limit}.`
          : "No se pudo guardar el carrito en este navegador.",
      });
      if (status === "limit") quantityField.current?.focus();
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <FunnelMark kind="product" />
      <div>
        <ProductImage photo={visiblePhotos[photoIndex]} sizes="(min-width: 768px) 45vw, 90vw" />
        {visiblePhotos.length > 1 && <div className="mt-2 flex flex-wrap gap-2">
          {visiblePhotos.map((photo, index) => (
            <Button key={photo.src} tone="secondary" aria-pressed={photoIndex === index} onClick={() => setPhotoIndex(index)}>Foto {index + 1}</Button>
          ))}
        </div>}
      </div>
      <form onSubmit={add} noValidate className="min-w-0 space-y-4 rounded-2xl bg-white p-5 sm:p-7">
        <div aria-live="polite">
          {preview && <p className="text-sm text-muted">{preview.presentation} · por {preview.unit}</p>}
          <ProductPrice variant={preview} details className="text-2xl" />
          <p>{preview ? availability(preview) : "Sin presentaciones disponibles"}</p>
          {variant?.availableQuantity != null && canAdd && <p className="text-sm text-muted">Existencia de prueba: {variant.availableQuantity}</p>}
          {limit > 0 && <p className="text-sm text-muted">Hasta {limit} por pedido.</p>}
        </div>
        {variants.length > 1 && <div>
          <label htmlFor="product-variant" className="font-semibold">Presentación</label>
          <select ref={selector} id="product-variant" className="ui-field mt-1" value={id} onChange={(event) => {
            setId(event.target.value);
            setQuantity("1");
            setResult(null);
            setPhotoIndex(0);
          }}>
            <option value="">Elige una presentación</option>
            {variants.map(({ id, presentation }) => <option key={id} value={id}>{presentation}</option>)}
          </select>
        </div>}
        <div>
          <label htmlFor="product-quantity" className="font-semibold">Cantidad</label>
          <input ref={quantityField} id="product-quantity" className="ui-field mt-1" type="number" min={1} max={limit || undefined}
            step={1} inputMode="numeric" disabled={limit === 0} value={quantity} onChange={(event) => {
              setQuantity(event.target.value);
              setResult(null);
            }} />
        </div>
        <Button type="submit" disabled={!canAdd || variants.length === 0 || (!!variant && limit === 0)} loadingLabel={pending ? "Agregando" : undefined}>
          Agregar al carrito
        </Button>
        {result && <Notice tone={result.ok ? "success" : "error"} announce>{result.message}</Notice>}
        {result?.ok && <TextLink href="/carrito">Ver carrito</TextLink>}
      </form>
    </div>
  );
}
