import type { ReactNode } from "react";

import { FunnelMark } from "../../components/storefront/funnel-mark";
import { StoreFooter, StoreHeader } from "../../components/storefront/layout";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <FunnelMark kind="visit" />
      <StoreHeader />
      <div id="contenido" tabIndex={-1} className="scroll-mt-32">{children}</div>
      <StoreFooter />
    </>
  );
}
