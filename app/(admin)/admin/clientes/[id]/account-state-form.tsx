"use client";

import { useActionState } from "react";
import { Button, Notice } from "../../../../../components/ui/primitives";
import { updateCustomer } from "./actions";

export function AccountStateForm({ id, version, suspended }: { id: string; version: string; suspended: boolean }) {
  const [message, action, pending] = useActionState(updateCustomer, "");
  return <details className="border-t border-slate-200 pt-2">
    <summary className="min-h-11 cursor-pointer py-2 font-semibold">{suspended ? "Reactivar cuenta" : "Suspender cuenta"}</summary>
    <form action={action} className="space-y-3">
      <input type="hidden" name="customer" value={id} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="operation" value={suspended ? "resume" : "suspend"} />
      <p>{suspended ? "El cliente podrá iniciar una nueva sesión cuando se reactive su cuenta." :
        "Se cerrarán las sesiones del cliente y sus pedidos seguirán disponibles para administración."}</p>
      {message && <Notice tone="warning" announce>{message}</Notice>}
      <Button type="submit" tone={suspended ? "primary" : "danger"} loadingLabel={pending ? "Guardando" : undefined}>
        {suspended ? "Confirmar reactivación" : "Confirmar suspensión"}
      </Button>
    </form>
  </details>;
}
