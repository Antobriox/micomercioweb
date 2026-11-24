"use client";

import { StorePage } from "../../components/storefront/layout";
import { Button, Notice } from "../../components/ui/primitives";

export default function PublicError({ reset }: { reset: () => void }) {
  return (
    <StorePage title="Servicio no disponible">
      <Notice tone="error" announce>La página no pudo cargar. Puedes volver a intentarlo.</Notice>
      <Button className="mt-5" onClick={reset}>Volver a intentar</Button>
    </StorePage>
  );
}
