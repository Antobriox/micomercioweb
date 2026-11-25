import { FunnelMark } from "../../../../components/storefront/funnel-mark";
import { StorePage } from "../../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../../components/ui/primitives";
import { formatMoney } from "../../../../lib/commercial/catalog";
import { requireAccount } from "../../../../lib/server/account";
import { getAccountOrderReview } from "../../../../lib/server/order-review";
import { availablePickups } from "../../../../lib/server/pickup";
import { getOrderWriter } from "../../../../lib/server/supabase";
import { DemoSubmit } from "./demo-submit";
import { PickupChoice } from "./pickup-choice";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Revisar pedido de prueba" };

export default async function OrderReviewPage() {
  const account = await requireAccount("/pedido/confirmar");
  const [review, accepted, slots] = await Promise.all([
    getAccountOrderReview(account),
    account.client.from("order_reviews").select("revision").eq("user_id", account.id).maybeSingle(),
    availablePickups(account),
  ]);
  const approved = review.state === "available" && review.revision && accepted.data?.revision === review.revision
    ? review.revision : null;
  return (
    <StorePage title="Revisar pedido de prueba" parents={[{ label: "Carrito", href: "/carrito" }]}>
      <FunnelMark kind="signin" />
      <div className="space-y-4">
        {review.state !== "available" ? <Notice tone="warning">No se puede verificar el catálogo en este momento. Tu carrito sigue guardado.</Notice> :
          !review.items.length ? <Notice>El carrito está vacío.</Notice> :
          <>
            {review.items.some(({ changed }) => changed) && <Notice tone="warning">Cambió un precio o promoción. Revisa los nuevos importes antes de continuar.</Notice>}
            <ul className="space-y-3">
              {review.items.map((item) => <li key={item.id}><Card>
                <h2 className="font-extrabold">{item.productName}</h2>
                <p>{item.presentation} · {item.quantity} × {formatMoney(item.price)}</p>
                <p className="font-semibold">Subtotal · {formatMoney(item.subtotal)}</p>
                {!item.available && <p className="font-semibold text-accent">La cantidad ya no está disponible. Actualízala desde el carrito.</p>}
              </Card></li>)}
            </ul>
            <Card className="space-y-3">
              <p className="text-xl font-extrabold">Total estimado · {formatMoney(review.total)}</p>
              <p>Pago y factura exclusivamente en caja.</p>
              {!approved && <PickupChoice slots={slots} />}
              {review.revision && (accepted.data?.revision === review.revision
                ? <Notice tone="success">El total estimado actual está revisado.</Notice>
                : <ReviewForm revision={review.revision} />)}
            </Card>
          </>}
        <DemoSubmit revision={approved} slots={slots} enabled={!!getOrderWriter()} />
        <TextLink href="/carrito">Editar carrito</TextLink>
      </div>
    </StorePage>
  );
}
