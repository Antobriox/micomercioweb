import { notFound } from "next/navigation";

import { StorePage } from "../../../../components/storefront/layout";
import { CatalogGrid } from "../../../../components/storefront/catalog-grid";
import { FavoriteButton } from "../../../../components/storefront/favorite-button";
import { ProductPurchase } from "../../../../components/storefront/product-purchase";
import { Notice, TextLink } from "../../../../components/ui/primitives";
import { categoryName } from "../../../../lib/commercial/catalog";
import { demoEditorial } from "../../../../lib/commercial/demo-editorial";
import { readSearchReturn } from "../../../../lib/commercial/search";
import { recommendProducts } from "../../../../lib/commercial/recommendations";
import { getCurrentAccount } from "../../../../lib/server/account";
import { commercial } from "../../../../lib/server/commercial";

export default async function ProductPage({ params, searchParams }: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ volver?: string | string[] }>;
}) {
  const [{ slug }, { volver }] = await Promise.all([params, searchParams]);
  const catalog = await commercial.getCatalog();
  if (!("records" in catalog)) {
    return <StorePage title="Producto no disponible"><Notice tone="error">El catálogo no está disponible.</Notice><TextLink href="/catalogo">Volver al catálogo</TextLink></StorePage>;
  }
  const product = catalog.records.find((record) => record.slug === slug);
  if (!product) notFound();
  const editorial = catalog.source === "simulated" ? demoEditorial(product.id) : undefined;
  const related = catalog.state === "available" ? recommendProducts(product, catalog.records) : [];
  const account = await getCurrentAccount();
  const favorite = account && await account.client.from("favorites").select("product_id")
    .eq("user_id", account.id).eq("product_id", product.id).maybeSingle();
  const returnUrl = readSearchReturn(volver);
  const parents = [
    { label: "Catálogo", href: "/catalogo" },
    { label: categoryName(product.categoryId), href: `/catalogo?categoria=${encodeURIComponent(product.categoryId)}` },
  ];
  return (
    <StorePage title={product.name} parents={parents}>
      <Notice>{catalog.state === "stale" ? "Datos de prueba desactualizados." : "Producto de demostración."}</Notice>
      {returnUrl && <TextLink className="mt-2" href={returnUrl}>Volver a resultados</TextLink>}
      <p className="my-4 text-muted">{product.brand}</p>
      {account ? favorite && (favorite.error ? <Notice tone="warning">Tus favoritos no están disponibles.</Notice> :
        <FavoriteButton productId={product.id} saved={!!favorite.data} />) :
        <TextLink className="mb-3" href={{ pathname: "/acceso", query: { volver: `/producto/${slug}` } }}>Inicia sesión para guardar en favoritos</TextLink>}
      <ProductPurchase key={product.id} variants={product.variants} photos={editorial?.photos ?? []} canAdd={catalog.state === "available"} signedIn={!!account} />
      <section className="mt-6" aria-labelledby="product-description">
        <h2 id="product-description" className="mb-2 text-xl font-bold">Descripción</h2>
        <p>{editorial?.description ?? "Descripción no disponible."}</p>
      </section>
      {related.length > 0 && <section className="mt-8" aria-labelledby="related-products">
        <h2 id="related-products" className="mb-4 text-xl font-bold">Productos relacionados</h2>
        <CatalogGrid products={related} simulated={catalog.source === "simulated"} headingLevel={3} />
      </section>}
    </StorePage>
  );
}
