"use client";

import { useActionState } from "react";
import { Button, Field, Notice } from "../../../../components/ui/primitives";
import { bannerLocalDateTime, type Banner } from "../../../../lib/editorial/banner";
import { saveBanner } from "./actions";

export type BannerChoice = { href: string; title: string };

export function BannerForm({ banner, choices }: { banner?: Banner; choices: BannerChoice[] }) {
  const [message, action, pending] = useActionState(saveBanner, "");
  const prefix = banner?.id ?? "new";
  return <form action={action} className="grid gap-3">
    {banner && <>
      <input type="hidden" name="id" value={banner.id} />
      <input type="hidden" name="version" value={banner.updated_at} />
    </>}
    <Field id={`${prefix}-title`} name="title" label="Título" maxLength={120} required defaultValue={banner?.title} />
    <label className="block font-semibold">Texto editorial
      <textarea name="body" className="ui-field mt-1" rows={3} maxLength={400} defaultValue={banner?.body ?? ""} />
    </label>
    <Field id={`${prefix}-alt`} name="alt" label="Texto alternativo" maxLength={240} required defaultValue={banner?.alt_text} />
    <div className="grid gap-3 sm:grid-cols-2">
      <Field id={`${prefix}-desktop`} name="desktop" type="file" label="Foto de escritorio" accept="image/jpeg,image/png,image/webp" required={!banner} />
      <Field id={`${prefix}-mobile`} name="mobile" type="file" label="Foto móvil" accept="image/jpeg,image/png,image/webp" required={!banner} />
      <label className="block font-semibold">Ubicación
        <select name="location" className="ui-field mt-1" defaultValue={banner?.location ?? "home"}>
          <option value="home">Inicio</option><option value="promotions">Promociones</option>
        </select>
      </label>
      <label className="block font-semibold">Destino
        <select name="destination" className="ui-field mt-1" defaultValue={banner?.destination ?? ""}>
          <option value="">Sin enlace</option>
          {banner?.destination && !choices.some(({ href }) => href === banner.destination) && <option value={banner.destination}>Destino no disponible</option>}
          {choices.map(({ href, title }) => <option key={href} value={href}>{title}</option>)}
        </select>
      </label>
      <Field id={`${prefix}-starts`} name="starts" type="datetime-local" label="Inicio en Guayaquil" required
        defaultValue={banner && bannerLocalDateTime(banner.starts_at)} />
      <Field id={`${prefix}-ends`} name="ends" type="datetime-local" label="Fin en Guayaquil" required
        defaultValue={banner && bannerLocalDateTime(banner.ends_at)} />
    </div>
    <Field id={`${prefix}-position`} name="position" type="number" min={0} max={32767} label="Orden" defaultValue={banner?.position ?? 0} required />
    <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={banner?.enabled ?? false} /> Activar publicación durante la vigencia</label>
    <Button type="submit" className="justify-self-start" loadingLabel={pending ? "Guardando" : undefined}>Guardar pieza</Button>
    {message && <Notice tone={message === "Pieza guardada." ? "success" : "warning"} announce>{message}</Notice>}
  </form>;
}
