import type { ReactNode } from "react";
import { StoreFooter, StoreHeader, StorePage } from "./layout";

export function AccountOrderPage({ title, detail, children }: { title: string; detail?: boolean; children: ReactNode }) {
  return <>
    <StoreHeader />
    <div id="contenido" tabIndex={-1} className="scroll-mt-32">
      <StorePage title={title} parents={detail
        ? [{ label: "Mi cuenta", href: "/cuenta" }, { label: "Mis pedidos", href: "/cuenta/pedidos" }]
        : [{ label: "Mi cuenta", href: "/cuenta" }]}>
        {children}
      </StorePage>
    </div>
    <StoreFooter />
  </>;
}
