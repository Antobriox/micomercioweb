import type { ReactNode } from "react";

import { requireAdministrator } from "../../../lib/server/account";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdministrator();
  return children;
}
