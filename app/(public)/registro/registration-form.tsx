"use client";

import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";

import { Button, Field, Notice, TextLink } from "../../../components/ui/primitives";
import {
  validateRegistration, type RegistrationErrors, type RegistrationState,
} from "../../../lib/account/registration";
import { registerAccount } from "./actions";

const initialState: RegistrationState = { status: "idle" };

export function RegistrationForm() {
  const [state, action, pending] = useActionState(registerAccount, initialState, "/registro");
  const [clientErrors, setClientErrors] = useState<RegistrationErrors | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const completion = useRef<HTMLHeadingElement>(null);
  const errors = clientErrors ?? state.errors ?? {};

  useEffect(() => {
    if (state.status === "pending") {
      completion.current?.focus();
    } else if (clientErrors || state.status === "invalid") {
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    }
  }, [clientErrors, state]);

  function checkForm(event: FormEvent<HTMLFormElement>) {
    const result = validateRegistration(new FormData(event.currentTarget));
    if (result.ok) {
      setClientErrors(null);
    } else {
      event.preventDefault();
      setClientErrors(result.errors);
    }
  }

  if (state.status === "pending") {
    return (
      <>
        <h2 ref={completion} tabIndex={-1} className="mb-3 text-xl font-bold">Registro pendiente de verificación</h2>
        <Notice tone="success">La cuenta de prueba quedó pendiente de confirmar el correo.</Notice>
        <TextLink className="mt-4" href="/verificar">Verificar correo</TextLink>
      </>
    );
  }

  return (
    <form ref={form} action={action} onSubmit={checkForm} noValidate className="space-y-5">
      <Notice tone="info">Usa únicamente datos ficticios para probar el registro.</Notice>
      {state.message && <Notice tone="error" announce>{state.message}</Notice>}
      {(clientErrors || state.errors) && <Notice tone="error" announce>Revisa los campos indicados.</Notice>}
      <Field id="givenNames" name="givenNames" label="Nombres" autoComplete="given-name" maxLength={100} error={errors.givenNames} required />
      <Field id="familyNames" name="familyNames" label="Apellidos" autoComplete="family-name" maxLength={100} error={errors.familyNames} required />
      <Field id="nationalId" name="nationalId" label="Cédula ecuatoriana" type="text" inputMode="numeric" autoComplete="off" maxLength={10}
        hint="Ingresa los diez dígitos, incluidos los ceros iniciales." error={errors.nationalId} required />
      <Field id="mobile" name="mobile" label="Celular" type="tel" autoComplete="tel" maxLength={25} error={errors.mobile} required />
      <Field id="email" name="email" label="Correo electrónico" type="email" autoComplete="email" maxLength={254} error={errors.email} required />
      <Field id="password" name="password" label="Contraseña" type="password" autoComplete="new-password" maxLength={72}
        hint="Mínimo 12 caracteres." error={errors.password} required />
      <div>
        <div className="flex flex-wrap gap-x-4 text-sm">
          <TextLink href="/privacidad">Privacidad</TextLink>
          <TextLink href="/condiciones">Condiciones</TextLink>
        </div>
        <label className="flex min-h-11 items-center gap-3 font-semibold">
          <input type="checkbox" name="consent" value="demo" required className="size-6 shrink-0"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined} />
          Confirmo que voy a usar datos ficticios.
        </label>
        {errors.consent && <p id="consent-error" className="text-sm text-accent">{errors.consent}</p>}
      </div>
      <Button type="submit" loadingLabel={pending ? "Registrando" : undefined}>Crear cuenta de prueba</Button>
    </form>
  );
}
