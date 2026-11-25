import { Bell } from "lucide-react";
import Link from "next/link";
import { requireAccount } from "../../lib/server/account";

export async function CustomerNotificationLink({ current = false }: { current?: boolean }) {
  const { client, id } = await requireAccount();
  const { count, error } = await client.from("notifications").select("id", { count: "exact", head: true })
    .eq("user_id", id).is("read_at", null);
  const unread = !error ? (count ?? 0) : 0;
  if (current) return <p role="status">{error ? "No se pudo consultar el contador." : `${unread} sin leer`}</p>;
  return <Link href="/cuenta/notificaciones" className="inline-flex min-h-11 min-w-11 items-center gap-2 font-semibold text-brand underline">
    <Bell aria-hidden="true" size={20} />
    <span>Notificaciones</span>
    <span aria-live="polite" className="font-bold">{unread > 0 ? `${unread} sin leer` : ""}</span>
  </Link>;
}
