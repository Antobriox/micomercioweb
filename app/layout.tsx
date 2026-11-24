import type { Metadata } from "next";
import type { ReactNode } from "react";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Comisariato Mi Comercio",
    template: "%s | Comisariato Mi Comercio",
  },
  description: "Entorno de demostración de Comisariato Mi Comercio, Portoviejo.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-EC">
      <body>{children}</body>
    </html>
  );
}
