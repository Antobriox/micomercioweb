"use client";

import { useActionState } from "react";

import { Button, Field, Notice } from "../../../components/ui/primitives";
import { sendRecovery } from "./actions";

export function RecoveryForm() {
  const [sent, action, pending] = useActionState(sendRecovery, false, "/recuperar");
  if (sent) return <Notice tone="info" announce>Si la cuenta puede recuperarse, recibirás un enlace por correo. Ábrelo en este navegador.</Notice>;
  return (
    <form action={action} className="space-y-5">
      <Field id="recovery-email" label="Correo electrónico" type="email" name="email" autoComplete="email" maxLength={254} required />
      <Button type="submit" loadingLabel={pending ? "Solicitando" : undefined}>Solicitar enlace</Button>
    </form>
  );
}
