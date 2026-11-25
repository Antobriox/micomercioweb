"use server";

import { revalidatePath } from "next/cache";
import { requireAdministrator } from "../../../../lib/server/account";

export async function saveSchedule(_last: string, form: FormData) {
  const { client } = await requireAdministrator();
  const intent = form.get("intent");
  const date = form.get("day");
  const notice = String(form.get("notice") ?? "").trim();
  const capacityInput = form.get("capacity");
  const capacity = typeof capacityInput === "string" && /^\d{1,5}$/.test(capacityInput) ? Number(capacityInput) : NaN;
  const closed = form.get("closed") === "on";
  const hours = {
    store_open: form.get("store_open"),
    store_close: form.get("store_close"),
    web_open: form.get("web_open"),
    web_close: form.get("web_close"),
  };
  const validHours = Object.values(hours).every((value) => typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value));
  if (notice.length > 240) return "El aviso supera los 240 caracteres.";
  let error;
  if (intent === "capacity" && Number.isInteger(capacity) && capacity <= 10000) {
    ({ error } = await client.from("operating_switch").update({ default_capacity: capacity }).eq("id", true));
  } else if (intent === "slot" && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    typeof hours.store_open === "string" && /^(?:[01]\d|2[0-3]):(?:00|15|30|45)$/.test(hours.store_open) &&
    Number.isInteger(capacity) && capacity <= 10000 && (!closed || notice)) {
    ({ error } = await client.rpc("configure_pickup_slot", {
      day: date, starts: hours.store_open, places: capacity, reason: closed ? notice : null,
    }));
  } else if (intent === "weekday" && typeof date === "string" && /^[1-7]$/.test(date) && validHours) {
    ({ error } = await client.from("operating_weekdays").update(hours).eq("day", Number(date)));
  } else if ((intent === "exception" || intent === "remove") && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    if (intent === "remove") {
      ({ error } = await client.from("operating_exceptions").delete().eq("day", date));
    } else {
      if (!notice || (!closed && !validHours)) return "Indica un aviso y un horario válido, o marca la fecha como cerrada.";
      const times = closed ? { store_open: null, store_close: null, web_open: null, web_close: null } : hours;
      ({ error } = await client.from("operating_exceptions").upsert({ day: date, closed, notice, ...times }));
    }
  } else if (intent === "pause" && (!closed || notice)) {
    ({ error } = await client.from("operating_switch").update({ paused: closed, notice: notice || null }).eq("id", true));
  } else {
    return "Revisa los datos del calendario antes de guardar.";
  }
  if (error) return "No se guardó el calendario. Revisa los horarios y conserva el cupo de las reservas existentes.";
  revalidatePath("/admin/calendario");
  revalidatePath("/horarios");
  return "Calendario actualizado.";
}
