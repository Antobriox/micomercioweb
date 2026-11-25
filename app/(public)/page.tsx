import type { Metadata } from "next";
import { PageContent } from "../../components/storefront/page-content";
import { publishedPage } from "../../lib/server/cms";
import { ArrowRight, ShoppingBasket } from "lucide-react";
import Link from "next/link";

import { EditorialBanners } from "../../components/storefront/editorial-banners";
import { activeBanners } from "../../lib/server/banners";
import { CatalogGrid } from "../../components/storefront/catalog-grid";
import { getStorefrontCatalog } from "../../lib/server/commercial/storefront";
import { TextLink } from "../../components/ui/primitives";
import { operation } from "../../lib/server/environment";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await publishedPage("inicio");
  return { title: content?.seoTitle || content?.title || "Comisariato Mi Comercio", description: content?.seoDescription || undefined };
}

export default async function Home() {
  const [catalog, banners, content] = await Promise.all([getStorefrontCatalog(), activeBanners("home"), publishedPage("inicio")]);
  const featured = "records" in catalog ? catalog.records.filter(({ editorial }) => editorial?.featured).slice(0, 8) : [];
  return (
    <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-8 sm:py-12">
      <section aria-labelledby="home-title" className="grid items-center gap-5 rounded-3xl bg-white p-6 shadow-sm sm:p-12 md:grid-cols-[minmax(0,1fr)_minmax(0,0.7fr)]">
        <div>
          <p className="font-semibold text-brand">{operation.label}</p>
          <h1 id="home-title" className="mt-3 text-4xl leading-tight font-extrabold tracking-tight sm:text-6xl">{content?.title || "Comisariato Mi Comercio"}</h1>
          <p className="mt-4 text-lg text-muted">Portoviejo, Manabí, Ecuador</p>
          <p className="mt-5 max-w-prose text-muted">Este sitio utiliza datos de prueba. Los pedidos comerciales están deshabilitados.</p>
          <Link href="/catalogo" className="ui-action mt-6" data-tone="primary" data-size="large">
            Explorar catálogo <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <div aria-hidden="true" className="hidden aspect-square max-h-80 place-items-center rounded-3xl bg-brand text-white md:grid">
          <ShoppingBasket size={106} strokeWidth={1.2} />
        </div>
      </section>
      {content && <PageContent content={content} slug="inicio" />}
      <EditorialBanners rows={banners} products={"records" in catalog ? catalog.records : []} />
      {featured.length > 0 && <section aria-labelledby="featured-title">
        <h2 id="featured-title" className="mb-4 text-2xl font-bold">Productos destacados</h2>
        <CatalogGrid products={featured} simulated={("source" in catalog) && catalog.source === "simulated"} headingLevel={3} />
      </section>}
      <TextLink href="/diagnostico">Consultar entorno de prueba</TextLink>
    </main>
  );
}
