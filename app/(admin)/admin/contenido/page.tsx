import { StorePage } from "../../../../components/storefront/layout";
import { Card, TextLink } from "../../../../components/ui/primitives";
import { cmsTitles } from "../../../../lib/editorial/cms";
import { requireAdministrator } from "../../../../lib/server/account";

export default async function AdminContentPage() {
  await requireAdministrator();
  return <StorePage title="Contenido del sitio" parents={[{ label: "Administración", href: "/admin" }]}>
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(cmsTitles).map(([slug, title]) => <li key={slug}>
      <Card><TextLink href={`/admin/contenido/${slug}`}>{title}</TextLink></Card>
    </li>)}</ul>
  </StorePage>;
}
