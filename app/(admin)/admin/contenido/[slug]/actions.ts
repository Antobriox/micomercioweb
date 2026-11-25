"use server";

import { revalidatePath } from "next/cache";
import { decodeCmsContent, httpsLink, isCmsSlug, type CmsPhoto } from "../../../../../lib/editorial/cms";
import { getCurrentAccount } from "../../../../../lib/server/account";
import { mediaBucket, uploadEditorialImage } from "../../../../../lib/server/editorial-media";

export async function saveContent(_previous: string, form: FormData): Promise<string> {
  const account = await getCurrentAccount();
  const role = await account?.client.rpc("is_administrator");
  if (!account || role?.data !== true) return "La edición requiere acceso de administración.";
  const { client } = account;
  const read = (name: string) => String(form.get(name) ?? "").trim();
  const slug = read("slug");
  const version = read("version") || null;
  const publish = form.get("operation") === "publish";
  const reviewed = form.has("reviewed");
  if (!isCmsSlug(slug)) return "No se encontró la página.";
  if (publish && (slug === "privacidad" || slug === "condiciones") && !reviewed) return "Confirma la revisión del texto legal antes de publicar.";

  const rawPairs = read("pairs").split("\n").map((line) => line.trim()).filter(Boolean);
  const pairs = rawPairs.map((line) => {
    const [label, ...body] = line.split("|");
    return { label: label.trim(), text: body.join("|").trim() };
  });
  const title = read("title");
  const body = read("body");
  const seoTitle = read("seoTitle");
  const seoDescription = read("seoDescription");
  const address = read("address");
  const map = read("map");
  const phone = read("phone");
  const email = read("email");
  if (!title || title.length > 120 || body.length > 7000 || seoTitle.length > 100 || seoDescription.length > 180 ||
      address.length > 240 || map.length > 500 || (map && !httpsLink(map)) ||
      (phone && !/^\+?[\d -]{7,22}$/.test(phone)) || (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) ||
      pairs.length > 20 || pairs.some(({ label, text }) => !label || !text || label.length > 180 || text.length > 450)) {
    return "Revisa los límites de los campos, los enlaces HTTPS y el formato de las líneas de contenido.";
  }

  const { data, error: loading } = await client.rpc("admin_cms_page", { target: slug });
  if (loading) return "No se pudo consultar la versión vigente.";
  const current = Array.isArray(data) ? data[0] : undefined;
  if ((current?.updated_at ?? null) !== version) return "La página cambió. Vuelve a cargarla antes de editar.";
  const draft = decodeCmsContent(current?.draft);
  const photos: CmsPhoto[] = form.has("removePhotos") ? [] : draft?.photos ?? [];
  const file = form.get("photo");
  let uploaded: string | undefined;
  if (file instanceof File && file.size > 0) {
    const alt = read("alt");
    if (!alt || alt.length > 240 || photos.length >= 6) return "Escribe un texto alternativo y conserva hasta seis fotos.";
    const result = await uploadEditorialImage(client, file);
    if (!result.path) return result.error ?? "No se pudo guardar la foto.";
    uploaded = result.path;
    photos.push({ path: uploaded, alt });
  }

  const content = { title, body, seoTitle, seoDescription, pairs, photos, address, map, phone, email };
  const { error } = await client.rpc("save_cms_page", {
    target: slug, content, expected_version: version, publish, legal_reviewed: reviewed,
  });
  if (error) {
    if (uploaded) await client.storage.from(mediaBucket).remove([uploaded]);
    return error.code === "40001" ? "La página cambió. Vuelve a cargarla antes de editar." : "No se pudo guardar el contenido.";
  }

  const removed = draft?.photos.filter(({ path }) => !photos.some((photo) => photo.path === path)) ?? [];
  const protectedPhotos = publish ? photos : decodeCmsContent(current?.published)?.photos ?? [];
  const obsolete = removed.filter(({ path }) => !protectedPhotos.some((photo) => photo.path === path));
  if (obsolete.length) await client.storage.from(mediaBucket).remove(obsolete.map(({ path }) => path));

  revalidatePath(`/admin/contenido/${slug}`);
  revalidatePath(slug === "inicio" ? "/" : `/${slug}`);
  return publish ? "Página publicada." : "Borrador guardado.";
}
