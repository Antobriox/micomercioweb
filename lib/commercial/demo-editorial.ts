export interface CatalogPhoto {
  src: string;
  alt: string;
  variantId?: string;
}

const editorial: Readonly<Record<string, { description: string; photos: readonly CatalogPhoto[] }>> = {
  "demo-arroz": {
    description: "Arroz blanco de grano largo. Producto ficticio para probar presentaciones y cantidades.",
    photos: [{ src: "/demo/arroz-1kg.webp", alt: "Foto ilustrativa de una bolsa de arroz de 1 kg", variantId: "demo-arroz-1-kg" }],
  },
};

export function demoEditorial(productId: string) {
  return Object.hasOwn(editorial, productId) ? editorial[productId] : undefined;
}
