"use client";

import { useActionState } from "react";
import { Button, Field, Notice } from "../../../../../components/ui/primitives";
import { cmsTitles, type CmsContent, type CmsSlug } from "../../../../../lib/editorial/cms";
import { saveContent } from "./actions";

export function CmsForm({ slug, draft, version }: { slug: CmsSlug; draft: CmsContent | null; version?: string }) {
  const [message, action, pending] = useActionState(saveContent, "");
  return <form action={action} className="space-y-3">
    <input type="hidden" name="slug" value={slug} />
    <input type="hidden" name="version" value={version ?? ""} />
    <Field id="cms-title" name="title" label="Título" maxLength={120} required defaultValue={draft?.title ?? cmsTitles[slug]} />
    <label className="block font-semibold">Contenido
      <textarea name="body" rows={6} maxLength={7000} defaultValue={draft?.body} className="ui-field mt-1" />
    </label>
    {(slug === "nosotros" || slug === "preguntas-frecuentes") && <label className="block font-semibold">
      {slug === "nosotros" ? "Línea de tiempo" : "Preguntas frecuentes"}
      <span className="block text-sm font-normal text-muted">{slug === "nosotros" ? "Una entrada por línea con el formato fecha | hito." : "Una entrada por línea con el formato pregunta | respuesta."}</span>
      <textarea name="pairs" rows={5} maxLength={12600} className="ui-field mt-1"
        defaultValue={draft?.pairs.map(({ label, text }) => `${label} | ${text}`).join("\n")} />
    </label>}
    {slug === "contacto" && <>
      <Field id="cms-address" name="address" label="Dirección confirmada" maxLength={240} defaultValue={draft?.address} />
      <Field id="cms-map" name="map" label="Enlace HTTPS del mapa" type="url" maxLength={500} defaultValue={draft?.map} />
      <Field id="cms-phone" name="phone" label="Teléfono confirmado" type="tel" maxLength={22} defaultValue={draft?.phone} />
      <Field id="cms-email" name="email" label="Correo confirmado" type="email" maxLength={254} defaultValue={draft?.email} />
    </>}
    {slug === "nosotros" && <>
      <Field id="cms-photo" name="photo" label="Agregar foto a la galería" type="file" accept="image/jpeg,image/png,image/webp" />
      <Field id="cms-alt" name="alt" label="Texto alternativo de la foto" maxLength={240} />
      {!!draft?.photos.length && <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="removePhotos" /> Retirar las fotos del borrador</label>}
    </>}
    <Field id="cms-seo-title" name="seoTitle" label="Título para buscadores" maxLength={100} defaultValue={draft?.seoTitle} />
    <Field id="cms-seo-description" name="seoDescription" label="Descripción para buscadores" maxLength={180} defaultValue={draft?.seoDescription} />
    {(slug === "privacidad" || slug === "condiciones") && <label className="flex min-h-11 items-center gap-2">
      <input type="checkbox" name="reviewed" /> Se revisó el texto legal para su publicación
    </label>}
    {message && <Notice tone={message === "Borrador guardado." || message === "Página publicada." ? "success" : "warning"} announce>{message}</Notice>}
    <div className="flex flex-wrap gap-3">
      <Button type="submit" name="operation" value="draft" loadingLabel={pending ? "Guardando" : undefined}>Guardar borrador</Button>
      <Button type="submit" name="operation" value="publish" tone="secondary" disabled={pending}>Publicar</Button>
    </div>
  </form>;
}
