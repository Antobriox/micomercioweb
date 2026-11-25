import { AccountOrderPage } from "../../../../components/storefront/account-order-page";
import { CustomerNotificationLink } from "../../../../components/storefront/customer-notification-link";
import { OrderRefresh } from "../../../../components/storefront/order-refresh";
import { Card, Notice, TextLink } from "../../../../components/ui/primitives";
import { orderInstant } from "../../../../lib/orders/display";
import { orderStatusLabel } from "../../../../lib/orders/status";
import { requireAccount } from "../../../../lib/server/account";
import { ReadNotificationButton } from "./read-button";

export const metadata = { title: "Notificaciones" };

type Notification = {
  id: string;
  created_at: string;
  read_at: string | null;
  order_events: { order_id: string; next_status: string };
};

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  const { client, id } = await requireAccount();
  const { pagina } = await searchParams;
  const page = typeof pagina === "string" && /^\d{1,5}$/.test(pagina) ? Math.max(1, Number(pagina)) : 1;
  const offset = (page - 1) * 20;
  const { data, error } = await client.from("notifications")
    .select("id,created_at,read_at,order_events!inner(order_id,next_status)")
    .eq("user_id", id).order("created_at", { ascending: false }).order("id")
    .range(offset, offset + 20).returns<Notification[]>();
  return <AccountOrderPage title="Notificaciones">
    <OrderRefresh />
    <div className="mb-4"><CustomerNotificationLink current /></div>
    {error ? <Notice tone="error">No se pudieron consultar los avisos. Vuelve a cargar la página.</Notice> :
      !data?.length ? <Card>No tienes avisos en esta página.</Card> :
      <ul className="grid gap-3 md:grid-cols-2">
        {data.slice(0, 20).map((notice) => <li key={notice.id}>
          <Card className="space-y-2">
            <p className="font-bold">{orderStatusLabel(notice.order_events.next_status)} · {notice.read_at ? "Leída" : "Sin leer"}</p>
            <time dateTime={notice.created_at} className="block text-sm text-muted">{orderInstant(notice.created_at)}</time>
            <TextLink href={`/cuenta/pedidos/${notice.order_events.order_id}`}>Ver pedido {notice.order_events.order_id.slice(0, 8).toUpperCase()}</TextLink>
            {!notice.read_at && <ReadNotificationButton id={notice.id} />}
          </Card>
        </li>)}
      </ul>}
    <nav aria-label="Páginas de notificaciones" className="mt-4 flex gap-4">
      {page > 1 && <TextLink href={`/cuenta/notificaciones?pagina=${page - 1}`}>Anterior</TextLink>}
      {(data?.length ?? 0) > 20 && <TextLink href={`/cuenta/notificaciones?pagina=${page + 1}`}>Siguiente</TextLink>}
    </nav>
  </AccountOrderPage>;
}
