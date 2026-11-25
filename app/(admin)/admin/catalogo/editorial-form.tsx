"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Button, Field, Notice } from "../../../../components/ui/primitives";
import { updateEditorial } from "./actions";

export function EditorialForm({ children, label, gallery, danger }: { children: ReactNode; label: string; gallery?: boolean; danger?: boolean }) {
  const [state, action, pending] = useActionState(updateEditorial, { message: "" });
  const [files, setFiles] = useState<string[]>([]);
  return <form action={action} className="space-y-3">
    {children}
    {gallery && <>
      <Field id="gallery-files" name="images" type="file" label="Fotos" accept="image/jpeg,image/png,image/webp" multiple
        hint="Hasta 8 archivos JPG, PNG o WebP, de hasta 1 MB cada uno."
        onChange={(event) => setFiles(Array.from(event.target.files ?? []).slice(0, 8).map((file) => file.name))} />
      {files.map((name, index) => <Field key={`${index}/${name}`} id={`gallery-alt-${index}`} name={`alt-${index}`}
        label={`Texto alternativo · ${name}`} maxLength={240} />)}
    </>}
    <Button type="submit" tone={danger ? "danger" : "primary"} loadingLabel={pending ? "Guardando" : undefined}>{label}</Button>
    {state.message && <Notice tone={state.ok ? "success" : "warning"} announce>
      <p>{state.message}</p>
      {!!state.issues?.length && <ul className="ms-5 list-disc">{state.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
    </Notice>}
  </form>;
}
