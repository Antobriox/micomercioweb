import Image from "next/image";
import { TextLink } from "../ui/primitives";
import { bannerDestination, type Banner } from "../../lib/editorial/banner";
import type { Product } from "../../lib/commercial/contracts";

export function BannerPreview({ banner, href, admin = false }: { banner: Banner; href: string | null; admin?: boolean }) {
  const image = (path: string) => `/api/editorial/imagen/${encodeURIComponent(path)}${admin ? '?vista=administracion' : ''}`;
  return <article className="grid overflow-hidden rounded-2xl bg-white shadow-sm md:grid-cols-2">
    <picture className="min-w-0">
      <source media="(max-width: 767px)" srcSet={image(banner.mobile_path)} />
      <Image src={image(banner.desktop_path)} unoptimized alt={banner.alt_text} width={800} height={500}
        className="aspect-video w-full bg-canvas object-cover md:aspect-[8/5]" />
    </picture>
    <div className="flex flex-col items-start justify-center gap-2 p-5 sm:p-7">
      <h3 className="text-xl font-bold">{banner.title}</h3>
      {banner.body && <p className="whitespace-pre-line">{banner.body}</p>}
      {href && <TextLink href={href}>Ver · {banner.title}</TextLink>}
    </div>
  </article>;
}

export function EditorialBanners({ rows, products }: { rows: Banner[]; products: readonly Product[] }) {
  if (!rows.length) return null;
  return <section aria-label="Campañas" className="mb-5 grid gap-4">
    <h2 className="sr-only">Campañas</h2>
    {rows.map((row) => <BannerPreview key={row.id} banner={row} href={bannerDestination(row.destination, products)} />)}
  </section>;
}
