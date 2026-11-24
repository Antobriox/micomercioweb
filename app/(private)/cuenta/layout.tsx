import type { ReactNode } from "react";

import { requireAccount } from "../../../lib/server/account";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireAccount();
  return children;
}
