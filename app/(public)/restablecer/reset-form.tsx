"use client";

import { useActionState } from "react";

import { Button, Field, Notice } from "../../../components/ui/primitives";
import { changeRecoveredPassword } from "./actions";

export function ResetForm() {
  const [message, action, pending] = useActionState(changeRecoveredPassword, "");
  return (
    <form action={action} className="space-y-5">
      {message && <Notice tone="error" announce>{message}</Notice>}
      <Field id="reset-password" name="password" type="password" label="Nueva contraseña" autoComplete="new-password" minLength={12} maxLength={72} required />
      <Field id="reset-repeat" name="repeatPassword" type="password" label="Repetir contraseña" autoComplete="new-password" minLength={12} maxLength={72} required />
      <Button type="submit" loadingLabel={pending ? "Guardando" : undefined}>Guardar contraseña</Button>
    </form>
  );
}
