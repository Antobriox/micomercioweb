"use client";

import { useActionState, useState } from "react";

import { Button, Field, Notice } from "../../../components/ui/primitives";
import { logIn } from "./actions";

export function LoginForm({ destination }: { destination: string }) {
  const [message, action, pending] = useActionState(logIn, "");
  const [email, setEmail] = useState("");

  return (
    <form action={action} className="space-y-5">
      {message && <Notice tone="error" announce>{message}</Notice>}
      <input type="hidden" name="volver" value={destination} />
      <Field id="login-email" label="Correo electrónico" name="email" type="email" autoComplete="username"
        maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} required />
      <Field id="login-password" label="Contraseña" name="password" type="password" autoComplete="current-password"
        maxLength={72} required />
      <Button type="submit" loadingLabel={pending ? "Ingresando" : undefined}>Iniciar sesión</Button>
    </form>
  );
}
