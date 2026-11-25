const labels: Readonly<Record<string, string>> = {
  pending: "Pendiente", confirmed: "Confirmado", preparing: "En preparación",
  ready: "Listo para retirar", delivered: "Entregado", cancelled: "Cancelado",
};

export function orderStatusLabel(status: string) {
  return Object.hasOwn(labels, status) ? labels[status] : "Estado no disponible";
}
