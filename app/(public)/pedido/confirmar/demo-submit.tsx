"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { Button, Notice, TextLink } from "../../../../components/ui/primitives";
import { syncAccountCart } from "../../../../lib/cart/client-account";
import { orderStatusLabel } from "../../../../lib/orders/status";
import type { PickupTime } from "../../../../lib/server/pickup";
import { PickupChoice } from "./pickup-choice";

const checkpoint = "mi-comercio:intento-de-pedido";
type Attempt = { revision: string; key: string };

function readAttempt(): Attempt | null {
  try {
    const data: unknown = JSON.parse(sessionStorage.getItem(checkpoint) ?? "null");
    return typeof data === "object" && data !== null && "key" in data && typeof data.key === "string" &&
      "revision" in data && typeof data.revision === "string" ? { key: data.key, revision: data.revision } : null;
  } catch {
    return null;
  }
}

async function request(payload: object) {
  const response = await fetch("/api/pedidos/demo", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const result: { id?: string; status?: string; error?: string } = await response.json();
  return result;
}

export function DemoSubmit({ revision, slots, enabled }: {
  revision: string | null; slots: readonly PickupTime[] | null; enabled: boolean;
}) {
  const [receipt, setReceipt] = useState<{ id: string; status: string } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const writing = useRef(false);
  const attempt = useRef<Attempt>(null);

  useEffect(() => {
    const saved = readAttempt();
    if (!saved) return;
    let active = true;
    void request({ key: saved.key, intent: "receipt" }).then(({ id, status }) => {
      if (active && id) {
        setReceipt({ id, status: status ?? "pending" });
        void syncAccountCart();
      }
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!revision || writing.current) return;
    const pickup = new FormData(event.currentTarget).get("pickup");
    if (typeof pickup !== "string" || !pickup) {
      setMessage("Selecciona una franja para continuar.");
      return;
    }
    const previous = attempt.current ?? readAttempt();
    const current = previous?.revision === revision ? previous : { revision, key: crypto.randomUUID() };
    attempt.current = current;
    try { sessionStorage.setItem(checkpoint, JSON.stringify(current)); } catch { /* Keep the attempt for this visit. */ }

    writing.current = true;
    setPending(true);
    setMessage("");
    try {
      const { id, status, error } = await request({ pickup, revision, key: current.key });
      if (id) {
        setReceipt({ id, status: status ?? "pending" });
        void syncAccountCart();
      } else {
        setMessage(error || "No pudimos confirmar el intento. Reintenta con el mismo pedido.");
      }
    } catch {
      setMessage("La conexión se interrumpió. Puedes reintentar sin duplicar el pedido.");
    } finally {
      writing.current = false;
      setPending(false);
    }
  }

  if (receipt) return <Notice tone="success" announce>
    <p className="font-bold">Pedido de prueba registrado.</p>
    <p>Estado · {orderStatusLabel(receipt.status)}</p>
    <p className="break-all">Identificador · {receipt.id}</p>
    <TextLink href="/carrito">Ver carrito</TextLink>
  </Notice>;
  if (!revision) return null;
  return (
    <form className="space-y-3" onSubmit={submit}>
      <PickupChoice slots={slots} />
      {message && <Notice tone="warning" announce>{message}</Notice>}
      {!enabled ? <p>El envío de pedidos de prueba no está disponible en este entorno.</p> :
        !!slots?.length && <Button type="submit" loadingLabel={pending ? "Registrando pedido" : undefined}>Enviar pedido de prueba</Button>}
    </form>
  );
}
