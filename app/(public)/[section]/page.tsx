import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CartCount } from "../../../components/storefront/cart-count";
import { StorePage } from "../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../components/ui/primitives";
import { commercial } from "../../../lib/server/commercial";

const informationalPages = {
  nosotros: { title: "Nosotros", text: "Comisariato Mi Comercio está en Portoviejo, Manabí, Ecuador. La historia y las fotografías oficiales están pendientes de publicación." },
  contacto: { title: "Contacto", text: "Portoviejo, Manabí, Ecuador. La dirección exacta y los canales oficiales se publicarán cuando se confirmen." },
  "como-comprar": { title: "Cómo comprar", text: "En la operación comercial, los pedidos se reservan para retiro el mismo día. El pago y la facturación se realizan únicamente en caja." },
  "preguntas-frecuentes": { title: "Preguntas frecuentes", text: "El importe mostrado durante la compra es un total estimado. La demostración utiliza datos de prueba." },
  privacidad: { title: "Privacidad", text: "El aviso oficial de privacidad está pendiente de revisión y publicación." },
  condiciones: { title: "Condiciones", text: "Las condiciones oficiales están pendientes de revisión y publicación." },
  "servicio-no-disponible": { title: "Servicio no disponible", text: "Vuelve al inicio para seguir navegando o intenta más tarde." },
} as const;

const catalogPages = {
  catalogo: "Catálogo",
  categorias: "Categorías",
  buscar: "Resultados de búsqueda",
  promociones: "Promociones",
} as const;

const categoryLabels: Readonly<Record<string, string>> = {
  despensa: "Despensa",
  bebidas: "Bebidas",
};

type PageProps = {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ q?: string | string[]; categoria?: string | string[] }>;
};

function isKey<T extends object>(value: string, map: T): value is Extract<keyof T, string> {
  return Object.hasOwn(map, value);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (isKey(section, informationalPages)) return { title: informationalPages[section].title };
  if (isKey(section, catalogPages)) return { title: catalogPages[section] };
  return section === "carrito" ? { title: "Carrito" } : {};
}

export default async function SectionPage({ params, searchParams }: PageProps) {
  const { section } = await params;
  if (isKey(section, informationalPages)) {
    const { title, text } = informationalPages[section];
    return <StorePage title={title}><Card><p>{text}</p><TextLink href="/">Volver al inicio</TextLink></Card></StorePage>;
  }
  if (section === "carrito") {
    return <StorePage title="Carrito"><Card><CartCount showLabel={false} /><TextLink href="/catalogo">Explorar el catálogo</TextLink></Card></StorePage>;
  }
  if (!isKey(section, catalogPages)) notFound();

  const title = catalogPages[section];
  const catalog = await commercial.getCatalog();
  if (!("records" in catalog)) {
    return <StorePage title={title}><Notice tone="error">El catálogo no está disponible.</Notice><TextLink href="/">Volver al inicio</TextLink></StorePage>;
  }
  const { q, categoria } = await searchParams;
  const term = typeof q === "string" ? q.trim().slice(0, 100) : "";
  const category = typeof categoria === "string" ? categoria : null;
  const categories = Array.from(new Set(catalog.records.map((product) => product.categoryId)));
  const matches = catalog.records.filter((product) => {
    if (section === "promociones" && !product.variants.some((variant) => variant.promotions.length > 0)) return false;
    if (category && product.categoryId !== category) return false;
    return !term || `${product.name} ${product.brand}`.toLocaleLowerCase("es").includes(term.toLocaleLowerCase("es"));
  });
  return (
    <StorePage title={title}>
      <Notice>{catalog.state === "stale" ? "Datos de prueba desactualizados." : "Datos simulados de demostración."}</Notice>
      {section === "categorias" ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {categories.map((id) => (
            <li key={id}><Card><TextLink href={{ pathname: "/catalogo", query: { categoria: id } }}>{categoryLabels[id] ?? id}</TextLink></Card></li>
          ))}
        </ul>
      ) : (
        <div className="mt-4">
          {term && <p className="mb-3">Consulta: {term}</p>}
          {matches.length > 0 ? (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((product) => <li key={product.id}><Card><h2 className="text-lg font-bold">{product.name}</h2></Card></li>)}
            </ul>
          ) : <Card><p>No se encontraron productos para esta selección.</p><TextLink href="/catalogo">Ver todo el catálogo</TextLink></Card>}
        </div>
      )}
    </StorePage>
  );
}
