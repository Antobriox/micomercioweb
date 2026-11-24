import type { ReactNode } from "react";

import { StoreFooter, StoreHeader } from "../../components/storefront/layout";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <StoreHeader />
      <div id="contenido" tabIndex={-1} className="scroll-mt-32">{children}</div>
      <StoreFooter />
    </>
  );
}
