export const cmsTitles = {
  inicio: "Inicio", nosotros: "Nosotros", contacto: "Contacto", "como-comprar": "Cómo comprar",
  "preguntas-frecuentes": "Preguntas frecuentes", privacidad: "Privacidad", condiciones: "Condiciones",
} as const;

export type CmsSlug = keyof typeof cmsTitles;
export type CmsPhoto = { path: string; alt: string };
export type CmsContent = {
  title: string; body: string; seoTitle: string; seoDescription: string;
  pairs: { label: string; text: string }[]; photos: CmsPhoto[];
  address: string; map: string; phone: string; email: string;
};

export function isCmsSlug(value: string): value is CmsSlug { return Object.hasOwn(cmsTitles, value); }

export function httpsLink(value: string) {
  try {
    const link = new URL(value);
    return link.protocol === "https:" && !link.username && !link.password ? link.href : null;
  } catch { return null; }
}

export function decodeCmsContent(value: unknown): CmsContent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.title !== "string" || !row.title.trim()) return null;
  const text = (field: string) => typeof row[field] === "string" ? row[field] as string : "";
  const strings = <K extends string, V extends string>(field: string, left: K, right: V) =>
    Array.isArray(row[field]) ? row[field].filter((item): item is Record<K | V, string> =>
      !!item && typeof item === "object" && typeof item[left] === "string" && typeof item[right] === "string") : [];
  const photos = strings("photos", "path", "alt").filter((photo) => /^[a-f0-9-]{36}\.webp$/.test(photo.path) && !!photo.alt.trim());
  return { title: row.title, body: text("body"), seoTitle: text("seoTitle"), seoDescription: text("seoDescription"),
    pairs: strings("pairs", "label", "text"), photos, address: text("address"), map: httpsLink(text("map")) ?? "",
    phone: /^\+?[\d -]{7,22}$/.test(text("phone")) ? text("phone") : "", email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text("email")) ? text("email") : "",
  };
}
