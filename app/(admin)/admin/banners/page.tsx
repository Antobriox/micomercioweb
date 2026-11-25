import { BannerPreview } from "../../../../components/storefront/editorial-banners";
import { StorePage } from "../../../../components/storefront/layout";
import { Card, Notice } from "../../../../components/ui/primitives";
import { storefrontCategoryLabel } from "../../../../lib/commercial/editorial-category";
import { bannerDestination, type Banner } from "../../../../lib/editorial/banner";
import { requireAdministrator } from "../../../../lib/server/account";
import { getStorefrontCatalog } from "../../../../lib/server/commercial/storefront";
import { BannerForm } from "./banner-form";

export default async function AdminBannersPage() {
  const { client } = await requireAdministrator();
  const [campaigns, catalog] = await Promise.all([
    client.from("banners").select("*").order("position").order("id").limit(100),
    getStorefrontCatalog(),
  ]);
  const products = "records" in catalog ? catalog.records : [];
  const choices = [
    ...products.map((product) => ({ href: `/producto/${encodeURIComponent(product.slug)}`, title: product.name })),
    ...[...new Set(products.map(({ categoryId }) => categoryId))]
      .map((id) => ({ href: `/catalogo?categoria=${encodeURIComponent(id)}`, title: storefrontCategoryLabel(products, id) })),
  ];
  const banners = (campaigns.data ?? []) as Banner[];
  return <StorePage title="Banners" parents={[{ label: "Administración", href: "/admin" }]}>
    <p className="mb-4">Piezas de prueba. Las ofertas y precios vigentes se consultan en el catálogo.</p>
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <Card>
        <h2 className="mb-3 text-xl font-bold">Nueva pieza</h2>
        <BannerForm choices={choices} />
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Piezas guardadas</h2>
        {campaigns.error ? <Notice tone="error">No se pudieron consultar las piezas.</Notice> :
          banners.length === 0 ? <p>Aún no hay piezas guardadas.</p> : banners.map((banner) => <details key={banner.id} className="space-y-3 border-t border-slate-200 pt-2">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">{banner.title} · {banner.enabled ? "Activada" : "Desactivada"}</summary>
            <section aria-label="Vista previa de la pieza" className="bg-canvas p-2">
              <BannerPreview admin banner={banner} href={bannerDestination(banner.destination, products)} />
            </section>
            <BannerForm key={banner.updated_at} banner={banner} choices={choices} />
          </details>)}
      </Card>
    </div>
  </StorePage>;
}
