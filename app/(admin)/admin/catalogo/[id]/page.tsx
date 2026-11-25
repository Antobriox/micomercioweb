import { notFound } from "next/navigation";
import { ProductImage } from "../../../../../components/storefront/product-image";
import { StorePage } from "../../../../../components/storefront/layout";
import { Card, Field, Notice } from "../../../../../components/ui/primitives";
import type { Variant } from "../../../../../lib/commercial/contracts";
import { requireAdministrator } from "../../../../../lib/server/account";
import { commercial } from "../../../../../lib/server/commercial";
import { EditorialForm } from "../editorial-form";

function VariantField({ variants, selected }: { variants: readonly Variant[]; selected?: string | null }) {
  return <label className="block font-semibold">Presentación
    <select name="variant" defaultValue={selected ?? ""} className="ui-field mt-1">
      <option value="">Todas las presentaciones</option>
      {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.presentation}</option>)}
      {selected && !variants.some((variant) => variant.id === selected) &&
        <option value={selected} disabled>Presentación retirada · {selected}</option>}
    </select>
  </label>;
}

export default async function EditorialProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { client } = await requireAdministrator();
  const { id } = await params;
  const catalog = await commercial.getCatalog();
  const product = "records" in catalog ? catalog.records.find((entry) => entry.id === id) : undefined;
  if (!product) notFound();

  const [details, categories, images] = await Promise.all([
    client.from("product_editorial").select("description,category_id,visible,featured").eq("product_id", id).maybeSingle(),
    client.from("editorial_categories").select("id,title").order("title"),
    client.from("editorial_images").select("id,object_path,alt_text,position,variant_id").eq("product_id", id).order("position").order("id"),
  ]);
  const parents = [{ label: "Administración", href: "/admin" }, { label: "Catálogo editorial", href: "/admin/catalogo" }];
  return <StorePage title={product.name} parents={parents}>
    {(details.error || categories.error || images.error) ? <Notice tone="error">No se pudo cargar la ficha editorial.</Notice> :
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="space-y-3">
          <p>ID comercial · {id}</p>
          <EditorialForm label="Guardar ficha editorial">
            <input type="hidden" name="intent" value="details" />
            <input type="hidden" name="product" value={id} />
            <label className="block font-semibold">Descripción
              <textarea name="description" defaultValue={details.data?.description ?? ""} rows={5} maxLength={4000} className="ui-field mt-1" />
            </label>
            <label className="block font-semibold">Categoría editorial
              <select name="category" defaultValue={details.data?.category_id ?? ""} className="ui-field mt-1">
                <option value="">Categoría de origen</option>
                {categories.data?.map((category) => <option key={category.id} value={category.id}>{category.title}</option>)}
              </select>
            </label>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="visible" defaultChecked={details.data?.visible ?? true} /> Visible en el catálogo</label>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="featured" defaultChecked={details.data?.featured ?? false} /> Destacado en inicio</label>
          </EditorialForm>
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Galería</h2>
          <EditorialForm label="Subir fotos" gallery>
            <input type="hidden" name="intent" value="upload" />
            <input type="hidden" name="product" value={id} />
            <VariantField variants={product.variants} />
          </EditorialForm>
          {images.data?.map((image) => <details key={image.id} className="border-t border-slate-200 pt-2">
            <summary className="min-h-11 cursor-pointer py-2 font-semibold">{image.alt_text}</summary>
            {details.data?.visible && <div className="mb-2 max-w-40"><ProductImage photo={{ src: `/api/editorial/imagen/${image.object_path}`, alt: image.alt_text }} sizes="160px" /></div>}
            <EditorialForm label="Actualizar foto">
              <input type="hidden" name="intent" value="edit" />
              <input type="hidden" name="product" value={id} />
              <input type="hidden" name="media" value={image.id} />
              <Field id={`alt-${image.id}`} name="alt-0" label="Texto alternativo" defaultValue={image.alt_text} maxLength={240} required />
              <Field id={`order-${image.id}`} name="position" label="Orden" type="number" min={0} max={32767} defaultValue={image.position} required />
              <Field id={`file-${image.id}`} name="image" label="Reemplazar archivo" type="file" accept="image/jpeg,image/png,image/webp" />
              <VariantField variants={product.variants} selected={image.variant_id} />
            </EditorialForm>
            <div className="mt-3">
              <EditorialForm label="Retirar foto" danger>
                <input type="hidden" name="intent" value="remove" />
                <input type="hidden" name="product" value={id} />
                <input type="hidden" name="media" value={image.id} />
              </EditorialForm>
            </div>
          </details>)}
        </Card>
      </div>}
  </StorePage>;
}
