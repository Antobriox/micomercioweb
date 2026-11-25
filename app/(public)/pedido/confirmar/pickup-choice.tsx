"use client";

import { useState } from "react";

import { Notice } from "../../../../components/ui/primitives";
import type { PickupTime } from "../../../../lib/server/pickup";

export function PickupChoice({ slots }: { slots: readonly PickupTime[] | null }) {
  const [choice, setChoice] = useState("");
  if (slots === null) return <Notice tone="warning">No pudimos consultar las franjas de retiro. Tu carrito sigue guardado.</Notice>;
  if (!slots.length) return <Notice>No hay franjas de retiro disponibles hoy.</Notice>;
  return (
    <div className="space-y-2">
      <label className="grid gap-1 font-semibold">Franja de retiro de hoy
        <select name="pickup" className="ui-field font-normal" value={choice} onChange={(event) => setChoice(event.target.value)}>
          <option value="">Selecciona una hora</option>
          {slots.map(({ starts_at, remaining, service_date }) => (
            <option key={starts_at} value={`${service_date}T${starts_at.slice(0, 5)}`}>
              {starts_at.slice(0, 5)} · {remaining} {remaining === 1 ? "cupo" : "cupos"}
            </option>
          ))}
        </select>
      </label>
      <p className="text-sm text-muted">El cupo se reserva al registrar el pedido.</p>
    </div>
  );
}
