import { purchaseLimit } from "./catalog";
import type { Product, Variant } from "./contracts";
import { variantPricing } from "./pricing";

export type SearchParameters = Record<string, string | string[] | undefined>;
type Availability = "disponible" | "agotado" | "sin-informacion";
type Sort = "relevancia" | "precio-asc" | "precio-desc";
type Filters = {
  q: string;
  categoria: string;
  marca: string;
  disponibilidad: Availability | "";
  minimo: string;
  maximo: string;
  orden: Sort;
};

function selection(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 100) : "";
}

export function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es").trim();
}

function readPrice(input: unknown): string {
  const text = selection(input);
  return /^\d{1,6}(?:[.,]\d{1,2})?$/.test(text) ? text.replace(",", ".") : "";
}

function minorUnits(value: string) {
  const [units, fraction = ""] = value.split(".");
  return Number(units) * 100 + Number(fraction.padEnd(2, "0"));
}

export function parseFilters(params: SearchParameters): Filters {
  const availability = params.disponibilidad;
  const order = params.orden;
  return {
    q: selection(params.q),
    categoria: selection(params.categoria),
    marca: selection(params.marca),
    disponibilidad: availability === "disponible" || availability === "agotado" || availability === "sin-informacion" ? availability : "",
    minimo: readPrice(params.minimo),
    maximo: readPrice(params.maximo),
    orden: order === "precio-asc" || order === "precio-desc" ? order : "relevancia",
  };
}

export function searchReturnUrl(params: SearchParameters) {
  const filters = parseFilters(params);
  const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
  const page = params.pagina;
  if (typeof page === "string" && /^\d{1,8}$/.test(page)) query.set("pagina", page);
  return `/buscar?${query.toString()}#resultados`;
}

export function readSearchReturn(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/buscar?") || value.length > 1000) return null;
  const url = new URL(value, "https://catalogo.invalid");
  if (url.origin !== "https://catalogo.invalid" || url.pathname !== "/buscar") return null;
  return searchReturnUrl(Object.fromEntries(url.searchParams));
}

const labels: Record<Availability, string> = {
  disponible: "Disponible", agotado: "Agotado", "sin-informacion": "Sin confirmar",
};

export const searchAvailability = Object.entries(labels);
const spanish = new Intl.Collator("es", { sensitivity: "base" });

function priceForSearch(variant: Variant) {
  // Demo prices and the filter are both denominated in USD.
  const price = variantPricing(variant).current;
  return price?.currency === "USD" && Number.isSafeInteger(price.amountInMinorUnits) && price.amountInMinorUnits >= 0
    ? price.amountInMinorUnits : null;
}

export function searchProducts(products: readonly Product[], filters: Filters) {
  const text = normalizeSearch(filters.q);
  const terms = text.split(/\s+/).filter(Boolean);
  const min = filters.minimo ? minorUnits(filters.minimo) : 0;
  const max = filters.maximo ? minorUnits(filters.maximo) : Infinity;
  const invalidRange = max < min;
  const hasPriceFilter = !!(filters.maximo || filters.minimo);
  if (invalidRange) return { matches: [], invalidRange };

  const matches = products.flatMap((product) => {
    if (filters.categoria && product.categoryId !== filters.categoria || filters.marca && product.brand !== filters.marca) return [];
    const name = normalizeSearch(product.name);
    const brand = normalizeSearch(product.brand);
    const content = `${name} ${brand}`;
    if (!terms.every((term) => content.includes(term))) return [];
    const variants = product.variants.filter((variant) => {
      const price = priceForSearch(variant);
      if (hasPriceFilter && (price === null || price < min || price > max)) return false;
      if (filters.disponibilidad === "disponible") return purchaseLimit(variant) > 0;
      if (filters.disponibilidad === "agotado") return variant.availableQuantity === 0;
      if (filters.disponibilidad === "sin-informacion") return variant.availableQuantity !== 0 && purchaseLimit(variant) === 0;
      return true;
    });
    if (!variants.length && (hasPriceFilter || filters.disponibilidad)) return [];
    const price = Math.min(...variants.flatMap((variant) => {
      const amount = priceForSearch(variant);
      return amount === null ? [] : [amount];
    }));
    const score = !text ? 0 : name === text ? 3 : name.startsWith(text) ? 2 : brand.startsWith(text) ? 1 : 0;
    const representative = hasPriceFilter || filters.disponibilidad || filters.orden !== "relevancia"
      ? [...variants].sort((a, b) => (priceForSearch(a) ?? Infinity) - (priceForSearch(b) ?? Infinity))[0]
      : undefined;
    return [{ product: representative ? { ...product, variants: [representative, ...product.variants.filter(({ id }) => id !== representative.id)] } : product, price, score }];
  }).sort((a, b) => {
    if (filters.orden !== "relevancia" && a.price !== b.price) {
      if (a.price === Infinity) return 1;
      if (b.price === Infinity) return -1;
      return filters.orden === "precio-asc" ? a.price - b.price : b.price - a.price;
    }
    return b.score - a.score || spanish.compare(a.product.name, b.product.name) || a.product.id.localeCompare(b.product.id);
  });
  return { matches: matches.map(({ product }) => product), invalidRange };
}
