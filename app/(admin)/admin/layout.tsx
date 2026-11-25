import type { ReactNode } from "react";

import { requireAdministrator } from "../../../lib/server/account";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdministrator();
  return <>
    <a href="#admin-contenido" className="fixed top-3 left-3 z-50 -translate-y-24 rounded-lg bg-white px-4 py-3 font-semibold text-brand shadow focus:translate-y-0">
      Saltar al contenido
    </a>
    <div id="admin-contenido" tabIndex={-1}>{children}</div>
  </>;
}
