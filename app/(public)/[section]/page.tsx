import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageContent } from "../../../components/storefront/page-content";
import { isCmsSlug } from "../../../lib/editorial/cms";
import { publishedPage } from "../../../lib/server/cms";
import { StorePage } from "../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../components/ui/primitives";
import { storefrontCategoryLabel } from "../../../lib/commercial/editorial-category";
import { getStorefrontCatalog } from "../../../lib/server/commercial/storefront";

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
  categorias: "Categorías",
} as const;

type PageProps = {
  params: Promise<{ section: string }>;
};

function isKey<T extends object>(value: string, map: T): value is Extract<keyof T, string> {
  return Object.hasOwn(map, value);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (isKey(section, informationalPages)) {
    const content = isCmsSlug(section) ? await publishedPage(section) : null;
    return { title: content?.seoTitle || content?.title || informationalPages[section].title, description: content?.seoDescription || undefined };
  }
  if (isKey(section, catalogPages)) return { title: catalogPages[section] };
  return {};
}

export default async function SectionPage({ params }: PageProps) {
  const { section } = await params;
  if (isKey(section, informationalPages)) {
    const { title, text } = informationalPages[section];
    const slug = isCmsSlug(section) ? section : null;
    const content = slug ? await publishedPage(slug) : null;
    return <StorePage title={content?.title ?? title}><Card className="space-y-4">
      {content && slug ? <PageContent content={content} slug={slug} /> : <p>{text}</p>}
      {content && section === "contacto" && !content.address && !content.map && !content.email && !content.phone && <p>{text}</p>}
      {section === "contacto" && <div><TextLink href="/horarios">Consultar horarios</TextLink></div>}
      <TextLink href="/">Volver al inicio</TextLink></Card></StorePage>;
  }
  if (!isKey(section, catalogPages)) notFound();

  const title = catalogPages[section];
  const catalog = await getStorefrontCatalog();
  if (!("records" in catalog)) {
    return <StorePage title={title}><Notice tone="error">El catálogo no está disponible.</Notice><TextLink href="/">Volver al inicio</TextLink></StorePage>;
  }
  const categories = Array.from(new Set(catalog.records.map((product) => product.categoryId)));
  return (
    <StorePage title={title}>
      <Notice>{catalog.state === "stale" ? "Datos de prueba desactualizados." : "Datos simulados de demostración."}</Notice>
      {categories.length > 0 ? (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {categories.map((id) => (
            <li key={id}><Card><TextLink href={{ pathname: "/catalogo", query: { categoria: id } }}>{storefrontCategoryLabel(catalog.records, id)}</TextLink></Card></li>
          ))}
        </ul>
      ) : <p className="mt-4">No hay categorías disponibles.</p>}
    </StorePage>
  );
}
