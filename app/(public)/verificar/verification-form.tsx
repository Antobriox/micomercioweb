"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Button, Field, Notice, TextLink } from "../../../components/ui/primitives";
import { verifyAccount, type VerificationState } from "./actions";

const initialState: VerificationState = { status: "idle" };

export function VerificationForm() {
  const [state, action, pending] = useActionState(verifyAccount, initialState, "/verificar");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (state.status === "verified") heading.current?.focus();
    if (state.status === "invalid") form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);

  if (state.status === "verified") return (
    <>
      <h2 ref={heading} tabIndex={-1} className="mb-3 text-xl font-bold">Correo verificado</h2>
      <Notice tone="success" announce>Ya puedes acceder con tu correo y contraseña.</Notice>
      <TextLink className="mt-4" href="/acceso">Ir al acceso</TextLink>
    </>
  );

  return (
    <form ref={form} action={action} noValidate className="space-y-5">
      {state.message && <Notice tone={state.status === "sent" ? "info" : "warning"} announce>{state.message}</Notice>}
      <Field id="verification-email" label="Correo electrónico" name="email" type="email" autoComplete="email"
        maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)}
        error={state.emailError} required />
      <Field id="verification-code" label="Código de seis dígitos" name="code" type="text" inputMode="numeric"
        autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value)}
        hint="Revisa el buzón del correo usado en el registro." error={state.codeError} required />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="intent" value="verify" loadingLabel={pending ? "Procesando" : undefined}>Verificar correo</Button>
        <Button type="submit" name="intent" value="resend" tone="secondary" disabled={pending}>Reenviar código</Button>
      </div>
    </form>
  );
}
