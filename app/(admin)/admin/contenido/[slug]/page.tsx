import { notFound } from "next/navigation";
import { PageContent } from "../../../../../components/storefront/page-content";
import { StorePage } from "../../../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../../../components/ui/primitives";
import { cmsTitles, decodeCmsContent, isCmsSlug } from "../../../../../lib/editorial/cms";
import { orderInstant } from "../../../../../lib/orders/display";
import { requireAdministrator } from "../../../../../lib/server/account";
import { CmsForm } from "./cms-form";

export default async function AdminContentEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { client } = await requireAdministrator();
  const { slug } = await params;
  if (!isCmsSlug(slug)) notFound();
  const { data, error } = await client.rpc("admin_cms_page", { target: slug });
  const row = Array.isArray(data) ? data[0] : undefined;
  const draft = decodeCmsContent(row?.draft);
  return <StorePage title={cmsTitles[slug]} parents={[{ label: "Administración", href: "/admin" }, { label: "Contenido", href: "/admin/contenido" }]}>
    {error ? <Notice tone="error">No se pudo cargar la página.</Notice> :
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <Card><CmsForm slug={slug} draft={draft} version={row?.updated_at} /></Card>
        <Card className="space-y-4">
          <p>{row?.published_at ? `Publicado · ${orderInstant(row.published_at)}` : "Sin versión publicada."}</p>
          <TextLink href={slug === "inicio" ? "/" : `/${slug}`}>Abrir página pública</TextLink>
          <section className="border-t border-slate-200 pt-3" aria-labelledby="preview-title">
            <h2 id="preview-title" className="mb-2 text-xl font-bold">Vista previa del borrador</h2>
            {draft ? <><h3 className="mb-2 font-bold">{draft.title}</h3><PageContent slug={slug} content={draft} preview /></> :
              <p>Guarda el borrador para ver una vista previa.</p>}
          </section>
        </Card>
      </div>}
  </StorePage>;
}
