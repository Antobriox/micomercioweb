"use client";

import { useActionState } from "react";

import { Button, Field, Notice } from "../../../components/ui/primitives";
import { requestEmailUpdate, updateContact, updatePassword, type ProfileFeedback } from "./actions";

function Feedback({ result }: { result: ProfileFeedback | null }) {
  return result && <Notice tone={result.ok ? "success" : "error"} announce>{result.message}</Notice>;
}

export function ContactForm({ names, surnames, mobile, version }: {
  names: string; surnames: string; mobile: string; version: string;
}) {
  const [status, action, pending] = useActionState(updateContact, null, "/cuenta");
  return (
    <form action={action} className="space-y-4">
      <Feedback result={status} />
      <input type="hidden" name="version" value={version} />
      <Field id="profile-names" name="givenNames" label="Nombres" defaultValue={names} autoComplete="given-name" maxLength={100} required />
      <Field id="profile-surnames" name="familyNames" label="Apellidos" defaultValue={surnames} autoComplete="family-name" maxLength={100} required />
      <Field id="profile-mobile" name="mobile" label="Celular" type="tel" defaultValue={mobile} autoComplete="tel" maxLength={25} required />
      <Button type="submit" loadingLabel={pending ? "Guardando" : undefined}>Guardar contacto</Button>
    </form>
  );
}

export function EmailChangeForm() {
  const [status, action, pending] = useActionState(requestEmailUpdate, null, "/cuenta");
  return (
    <form action={action} className="space-y-4 py-3">
      <Feedback result={status} />
      <Field id="profile-email" name="newEmail" label="Nuevo correo" type="email" autoComplete="email" maxLength={254} required />
      <Field id="profile-email-password" name="password" label="Contraseña actual" type="password" autoComplete="current-password" maxLength={72} required />
      <Button type="submit" loadingLabel={pending ? "Solicitando" : undefined}>Solicitar cambio de correo</Button>
    </form>
  );
}

export function PasswordChangeForm() {
  const [status, action, pending] = useActionState(updatePassword, null, "/cuenta");
  return (
    <form action={action} className="space-y-4 py-3">
      <Feedback result={status} />
      <Field id="profile-current-password" name="currentPassword" label="Contraseña actual" type="password" autoComplete="current-password" maxLength={72} required />
      <Field id="profile-new-password" name="newPassword" label="Nueva contraseña" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
      <Field id="profile-repeat-password" name="repeatPassword" label="Repetir contraseña" type="password" autoComplete="new-password" minLength={12} maxLength={72} required />
      <Button type="submit" loadingLabel={pending ? "Guardando" : undefined}>Cambiar contraseña</Button>
    </form>
  );
}
