"use client";

import { useActionState } from "react";
import { Heart } from "lucide-react";

import { setFavorite } from "../../app/(private)/cuenta/favoritos/actions";
import { Button, Notice } from "../ui/primitives";

export function FavoriteButton({ productId, saved }: { productId: string; saved: boolean }) {
  const [message, action, pending] = useActionState(setFavorite, "");
  const label = saved ? "Quitar de favoritos" : "Guardar en favoritos";
  return (
    <form action={action} className="my-3 space-y-2">
      <input type="hidden" name="product" value={productId} />
      <input type="hidden" name="intent" value={saved ? "remove" : "save"} />
      <Button type="submit" tone="secondary" aria-pressed={saved} loadingLabel={pending ? "Guardando" : undefined}>
        <Heart size={18} aria-hidden="true" fill={saved ? "currentColor" : "none"} /> {label}
      </Button>
      {message && <Notice tone="error" announce>{message}</Notice>}
    </form>
  );
}
