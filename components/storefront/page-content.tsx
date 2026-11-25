import { ProductImage } from "./product-image";
import { TextLink } from "../ui/primitives";
import type { CmsContent, CmsSlug } from "../../lib/editorial/cms";

export function PageContent({ content, slug, preview = false }: { content: CmsContent; slug: CmsSlug; preview?: boolean }) {
  return <div className="space-y-4">
    {content.body && <p className="max-w-prose whitespace-pre-line">{content.body}</p>}
    {slug === "contacto" && <address className="flex flex-col items-start gap-2 not-italic">
      {content.address && <p>{content.address}</p>}
      {content.phone && <TextLink href={`tel:${content.phone.replace(/[^\d+]/g, "")}`}>{content.phone}</TextLink>}
      {content.email && <TextLink href={`mailto:${content.email}`}>{content.email}</TextLink>}
      {content.map && <TextLink href={content.map}>Ver ubicación en el mapa</TextLink>}
    </address>}
    {content.pairs.length > 0 && <section aria-label={slug === "nosotros" ? "Historia y línea de tiempo" : "Preguntas y respuestas"}>
      <dl className="space-y-3">{content.pairs.map(({ label, text }, index) => <div key={index}>
        <dt className="font-bold">{label}</dt><dd>{text}</dd>
      </div>)}</dl>
    </section>}
    {content.photos.length > 0 && <ul className="grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Galería">
      {content.photos.map((photo) => <li key={photo.path}>
        <ProductImage photo={{ src: `/api/editorial/imagen/${photo.path}${preview ? "?vista=administracion" : ""}`, alt: photo.alt }} sizes="(min-width: 680px) 300px, 90vw" />
      </li>)}
    </ul>}
  </div>;
}
