import Link from "next/link";

import { FavoriteButton } from "../../../../components/storefront/favorite-button";
import { StoreFooter, StoreHeader, StorePage } from "../../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../../components/ui/primitives";
import { requireAccount } from "../../../../lib/server/account";
import { commercial } from "../../../../lib/server/commercial";

export const metadata = { title: "Favoritos" };

export default async function FavoritesPage() {
  const account = await requireAccount("/cuenta/favoritos");
  const [{ data, error }, catalog] = await Promise.all([
    account.client.from("favorites").select("product_id").eq("user_id", account.id).order("created_at", { ascending: false }),
    commercial.getCatalog(),
  ]);
  const records = "records" in catalog ? catalog.records : [];
  return (
    <>
      <StoreHeader />
      <div id="contenido" tabIndex={-1} className="scroll-mt-32">
        <StorePage title="Favoritos" parents={[{ label: "Mi cuenta", href: "/cuenta" }]}>
          {error ? <Notice tone="error">No se pudieron consultar los favoritos.</Notice> :
            !data?.length ? <Card><p>Aún no tienes productos guardados.</p><TextLink href="/catalogo">Explorar catálogo</TextLink></Card> :
            <ul className="grid gap-4 sm:grid-cols-2">
              {data.map(({ product_id }) => {
                const product = records.find(({ id }) => id === product_id);
                return <li key={product_id}><Card>
                  {product ? <Link className="ui-link" href={`/producto/${encodeURIComponent(product.slug)}`}>{product.name}</Link> :
                    <p>Producto guardado sin ficha disponible.</p>}
                  <FavoriteButton productId={product_id} saved />
                </Card></li>;
              })}
            </ul>}
        </StorePage>
      </div>
      <StoreFooter />
    </>
  );
}
