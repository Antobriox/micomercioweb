const destinations = new Set(["/cuenta", "/cuenta/favoritos", "/admin", "/carrito", "/pedido/confirmar"]);

export function loginDestination(value: unknown) {
  return typeof value === "string" && (destinations.has(value) ||
    (value.length <= 120 && /^\/producto\/[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value))) ? value : "/cuenta";
}

export function normalizedEmail(input: unknown) {
  const value = typeof input === "string" ? input.trim().toLowerCase() : "";
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

export function allowedPassword(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && new TextEncoder().encode(value).length <= 72;
}

export function validNewPassword(value: unknown): value is string {
  return allowedPassword(value) && Array.from(value).length >= 12;
}
