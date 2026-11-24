import "server-only";

import { cookies } from "next/headers";

import { getAppOrigin } from "./app-origin";

export const sessionCookieName = "mi-comercio-session";
export const recoveryCookieName = "mi-comercio-recovery";

export function sessionCookieOptions() {
  return {
    name: sessionCookieName,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: getAppOrigin()?.startsWith("https://") ?? true,
    path: "/",
  };
}

export function recoveryCookieOptions() {
  const { httpOnly, sameSite, secure } = sessionCookieOptions();
  return { httpOnly, sameSite, secure, path: "/restablecer", maxAge: 900 };
}

export async function clearSessionCookies() {
  const store = await cookies();
  const { path, httpOnly, secure, sameSite } = sessionCookieOptions();
  for (const { name } of store.getAll()) {
    if (name === sessionCookieName || name.startsWith(`${sessionCookieName}.`)) {
      store.set(name, "", { path, httpOnly, secure, sameSite, maxAge: 0 });
    }
  }
}
