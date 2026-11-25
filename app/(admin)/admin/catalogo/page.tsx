import { StorePage } from "../../../../components/storefront/layout";
import { Card, Field, Notice, TextLink } from "../../../../components/ui/primitives";
import { requireAdministrator } from "../../../../lib/server/account";
import { commercial } from "../../../../lib/server/commercial";
import { EditorialForm } from "./editorial-form";

export default async function EditorialCatalogPage() {
  const { client } = await requireAdministrator();
  const [catalog, categories] = await Promise.all([
    commercial.getCatalog(),
    client.from("editorial_categories").select("id,slug,title,visible").order("title"),
  ]);
  return <StorePage title="Catálogo editorial" parents={[{ label: "Administración", href: "/admin" }]}>
    <div className="grid gap-5 lg:grid-cols-2">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Productos de la fuente comercial</h2>
        {catalog.state !== "available" ? <Notice tone="warning">La fuente comercial no está disponible para edición editorial.</Notice> :
          <ul className="divide-y divide-slate-200">{catalog.records.map((product) => <li key={product.id}>
            <TextLink href={`/admin/catalogo/${encodeURIComponent(product.id)}`}>{product.name} · {product.id}</TextLink>
          </li>)}</ul>}
      </Card>
      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Categorías editoriales</h2>
        <EditorialForm label="Guardar categoría">
          <input type="hidden" name="intent" value="category" />
          <Field id="new-category-slug" name="slug" label="URL corta" maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
          <Field id="new-category-title" name="title" label="Nombre" maxLength={100} required />
          <label className="flex min-h-11 items-center gap-2"><input name="visible" type="checkbox" defaultChecked /> Visible</label>
        </EditorialForm>
        {categories.error ? <Notice tone="error">No se pudieron consultar las categorías.</Notice> :
          categories.data?.map((row) => <details key={row.id} className="border-t border-slate-200 pt-2">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">{row.title}</summary>
            <EditorialForm label="Actualizar categoría">
              <input type="hidden" name="intent" value="category" />
              <input type="hidden" name="slug" value={row.slug} />
              <Field id={`category-${row.id}`} name="title" label="Nombre" maxLength={100} required defaultValue={row.title} />
              <label className="flex min-h-11 items-center gap-2"><input name="visible" type="checkbox" defaultChecked={row.visible} /> Visible</label>
            </EditorialForm>
          </details>)}
      </Card>
    </div>
  </StorePage>;
}
