"use client";

import { useActionState, type ReactNode } from "react";
import { Button, Notice } from "../../../../components/ui/primitives";
import { saveSchedule } from "./actions";

export function ScheduleForm({ area, children }: { area: string; children: ReactNode }) {
  const [message, action, pending] = useActionState(saveSchedule, "", "/admin/calendario");
  return <form className="space-y-3" action={action} aria-label={area}>
    {children}
    {message && <Notice tone={message === "Calendario actualizado." ? "success" : "warning"} announce>{message}</Notice>}
    <Button type="submit" loadingLabel={pending ? "Guardando" : undefined}>Guardar</Button>
  </form>;
}
