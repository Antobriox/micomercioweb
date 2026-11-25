"use client";

import { useActionState } from "react";
import { Button, Notice } from "../../../../components/ui/primitives";
import { readNotification } from "./actions";

export function ReadNotificationButton({ id }: { id: string }) {
  const [message, action, pending] = useActionState(readNotification, "");
  return <form action={action} className="space-y-2">
    <input type="hidden" name="notification" value={id} />
    <Button type="submit" tone="secondary" loadingLabel={pending ? "Guardando" : undefined}>Marcar como leída</Button>
    {message && <Notice tone="warning" announce>{message}</Notice>}
  </form>;
}
