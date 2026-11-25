"use client";

import { useActionState } from "react";
import { Button, Notice, TextLink } from "../../../../../components/ui/primitives";
import { repeatOrder } from "./repeat-action";

export function RepeatButton({ id }: { id: string }) {
  const [result, action, pending] = useActionState(repeatOrder, null);
  return <form action={action} className="space-y-3">
    <input type="hidden" name="order" value={id} />
    <Button type="submit" tone="secondary" loadingLabel={pending ? "Preparando carrito" : undefined}>Repetir en el carrito</Button>
    {result && <Notice tone={result.ok ? "info" : "warning"} announce>{result.message}</Notice>}
    {result?.ok && <TextLink href="/carrito">Revisar carrito</TextLink>}
  </form>;
}
