import type { Product } from "../commercial/contracts";

export type Banner = {
  id: string;
  location: "home" | "promotions";
  title: string;
  body: string | null;
  desktop_path: string;
  mobile_path: string;
  alt_text: string;
  destination: string | null;
  starts_at: string;
  ends_at: string;
  position: number;
  enabled: boolean;
  updated_at: string;
};

const guayaquil = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/Guayaquil", dateStyle: "short", timeStyle: "short", hourCycle: "h23",
});

export function bannerLocalDateTime(value: string) {
  return guayaquil.format(new Date(value)).replace(" ", "T");
}

export function bannerInstant(value: string) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value)) return null;
  const date = new Date(`${value}-05:00`);
  if (!Number.isFinite(date.getTime()) || bannerLocalDateTime(date.toISOString()) !== value) return null;
  return date.toISOString();
}

export function bannerDestination(value: string | null, products: readonly Product[]) {
  if (!value) return null;
  const product = products.find(({ slug }) => value === `/producto/${encodeURIComponent(slug)}`);
  if (product) return value;
  if (products.some(({ categoryId }) => value === `/catalogo?categoria=${encodeURIComponent(categoryId)}`)) return value;
  return null;
}
