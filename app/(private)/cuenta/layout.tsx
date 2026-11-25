import type { ReactNode } from "react";

import { FunnelMark } from "../../../components/storefront/funnel-mark";
import { requireAccount } from "../../../lib/server/account";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  await requireAccount();
  return <><FunnelMark kind="signin" />{children}</>;
}
