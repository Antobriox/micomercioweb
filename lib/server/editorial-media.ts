import "server-only";

import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { SupabaseClient } from "@supabase/supabase-js";

export const mediaBucket = "editorial";
export const editorialPath = /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\.webp$/;

export async function uploadEditorialImage(client: SupabaseClient, file: File) {
  if (file.size < 1 || file.size > 1_000_000 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return { error: "Usa un archivo JPG, PNG o WebP de hasta 1 MB." } as const;
  }

  let image: Buffer;
  try {
    const decoded = sharp(Buffer.from(await file.arrayBuffer()), { limitInputPixels: 16_000_000 });
    const { format } = await decoded.metadata();
    if (format !== "jpeg" && format !== "png" && format !== "webp") throw new Error("Unsupported image");
    image = await decoded.rotate().resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  } catch {
    return { error: "El contenido del archivo no es una imagen admitida." } as const;
  }

  const path = `${randomUUID()}.webp`;
  const { error } = await client.storage.from(mediaBucket).upload(path, image, { contentType: "image/webp", upsert: false });
  return error ? { error: "No se pudo guardar la imagen en el almacenamiento." } as const : { path } as const;
}
