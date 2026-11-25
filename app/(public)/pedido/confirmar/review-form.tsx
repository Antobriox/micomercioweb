"use client";

import { useActionState } from "react";

import { Button, Notice } from "../../../../components/ui/primitives";
import { acceptReview, type ReviewFeedback } from "./actions";

export function ReviewForm({ revision }: { revision: string }) {
  const [status, action, pending] = useActionState(acceptReview, null as ReviewFeedback | null, "/pedido/confirmar");
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="revision" value={revision} />
      {status && <Notice tone={status.state === "accepted" ? "success" : "warning"} announce>{status.message}</Notice>}
      {status?.state !== "accepted" && <Button type="submit" loadingLabel={pending ? "Comprobando precios" : undefined}>
        Aceptar total estimado
      </Button>}
    </form>
  );
}
