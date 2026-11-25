"use client";

import { useActionState } from "react";
import { cancelOrder } from "../../app/actions/cancel-order";
import { Button, Field, Notice } from "../ui/primitives";

export function CancelOrderForm({ id, status, admin = false }: { id: string; status: string; admin?: boolean }) {
  const [message, action, pending] = useActionState(cancelOrder, "");
  return <details className="border-t border-slate-200 pt-2">
    <summary className="min-h-11 cursor-pointer py-2 font-semibold text-accent">Cancelar pedido</summary>
    <form action={action} className="mt-2 space-y-3">
      <input type="hidden" name="order" value={id} />
      <input type="hidden" name="status" value={status} />
      {admin && <>
        <input type="hidden" name="admin" value="1" />
        <Field id="cancellation-reason" name="reason" label="Motivo de cancelación" maxLength={240} required />
      </>}
      <p>Al cancelar se libera el cupo y el pedido permanece en el historial.</p>
      {message && <Notice tone="warning" announce>{message}</Notice>}
      <Button tone="danger" type="submit" loadingLabel={pending ? "Cancelando" : undefined}>Confirmar cancelación</Button>
    </form>
  </details>;
}
