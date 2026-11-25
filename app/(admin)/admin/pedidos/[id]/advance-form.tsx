"use client";

import { useActionState } from "react";
import { Button, Notice } from "../../../../../components/ui/primitives";
import { advanceOrder } from "./advance-action";

const steps: Readonly<Record<string, { next: string; label: string }>> = {
  pending: { next: "confirmed", label: "Confirmar pedido" },
  confirmed: { next: "preparing", label: "Iniciar preparación" },
  preparing: { next: "ready", label: "Marcar listo para retirar" },
  ready: { next: "delivered", label: "Registrar entrega de prueba" },
};

export function AdvanceOrderForm({ id, status }: { id: string; status: string }) {
  const [message, action, pending] = useActionState(advanceOrder, "");
  const step = Object.hasOwn(steps, status) ? steps[status] : undefined;
  if (!step) return null;
  return <form action={action} className="space-y-3 border-t border-slate-200 pt-3">
    <input type="hidden" name="order" value={id} />
    <input type="hidden" name="from" value={status} />
    <input type="hidden" name="to" value={step.next} />
    {status === "confirmed" && <p>Comunica verbalmente al empleado qué artículos debe preparar.</p>}
    {status === "preparing" && <p>Confirma la preparación física. Si falta un artículo, registra una cancelación con el motivo.</p>}
    {step.next === "delivered" && <fieldset className="space-y-1">
      <legend className="font-semibold">Verificación de entrega simulada</legend>
      <label className="flex min-h-11 items-center gap-2"><input required name="payment" type="checkbox" /> Verifiqué el cobro de prueba en caja</label>
      <label className="flex min-h-11 items-center gap-2"><input required name="pickup" type="checkbox" /> Verifiqué el retiro de prueba</label>
    </fieldset>}
    {message && <Notice tone="warning" announce>{message}</Notice>}
    <Button type="submit" loadingLabel={pending ? "Actualizando" : undefined}>{step.label}</Button>
  </form>;
}
