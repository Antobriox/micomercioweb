import assert from "node:assert/strict";
import { test } from "node:test";

import { chromium, expect, type Page } from "@playwright/test";

import { guestCartKey } from "../../lib/cart/guest";
import { nativeAuthBinary, nativeRestBinary, startLocalStack } from "../support/local-stack";

async function fillRegistration(page: Page, email: string, nationalId: string) {
  await page.locator("#givenNames").fill("Persona");
  await page.locator("#familyNames").fill("De Prueba");
  await page.locator("#nationalId").fill(nationalId);
  await page.locator("#mobile").fill("0900000000");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("una contraseña ficticia");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Crear cuenta de prueba" }).click();
}

test("SPEC-006 registration creates one pending account with Supabase Auth and PostgreSQL", {
  skip: !nativeAuthBinary || !nativeRestBinary, timeout: 90_000,
}, async (t) => {
  const stack = await startLocalStack(t);
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
  t.after(() => browser.close());
  const first = await browser.newPage();
  const second = await browser.newPage();
  const email = "registro@example.test";
  await Promise.all([first.goto(`${stack.nextUrl}/registro`), second.goto(`${stack.nextUrl}/registro`)]);
  await fillRegistration(first, email, "0100000009");
  try {
    await expect(first.getByRole("heading", { name: "Registro pendiente de verificación" })).toBeVisible();
  } catch (error) {
    const counters = await stack.db.query("select (select count(*) from auth.users) as accounts, (select count(*) from public.profiles) as profiles");
    throw new Error(`Alta local: ${JSON.stringify(stack.requests)}, ${JSON.stringify(counters.rows)}. ${stack.authLogs()}`, { cause: error });
  }
  await fillRegistration(second, "duplicado@example.test", "0100000009");
  await expect(second.getByText("No pudimos completar el registro", { exact: false })).toBeVisible();
  await second.goto(`${stack.nextUrl}/registro`);
  await fillRegistration(second, email, "0200000008");
  await expect(second.getByText("No pudimos completar el registro", { exact: false })).toBeVisible();

  const result = await stack.db.query("select email, national_id, verified_at from public.profiles");
  assert.deepEqual(result.rows, [{ email, national_id: "0100000009", verified_at: null }]);
  assert.equal((await stack.db.query("select 1 from auth.users where raw_user_meta_data ? 'web_registration'")).rowCount, 0);
  assert.equal((await stack.db.query("select 1 from auth.identities where identity_data ? 'web_registration'")).rowCount, 0);
  assert.ok(stack.messages.some((mail) => mail.addresses.includes(email)));
});

test("SPEC-008 login, authorization, expiry and isolated password recovery work with real local providers", {
  skip: !nativeAuthBinary || !nativeRestBinary, timeout: 90_000,
}, async (t) => {
  const stack = await startLocalStack(t, { resendSeconds: 0 });
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
  t.after(() => browser.close());
  const client = await browser.newPage();
  const recovery = await browser.newPage();
  const email = "sesion@example.test";
  const previousPassword = "una contraseña ficticia";
  const newPassword = "otra contraseña de prueba";
  const denial = "No pudimos iniciar sesión. Revisa tus datos o verifica tu correo.";

  await client.goto(`${stack.nextUrl}/registro`);
  await fillRegistration(client, email, "0100000009");
  await client.getByRole("link", { name: "Verificar correo" }).click();
  const code = stack.messages.find(({ addresses }) => addresses.includes(email))?.source.match(/<strong>([0-9]{6})<\/strong>/)?.[1];
  assert.ok(code);

  async function submitLogin(page: Page, address: string, password: string, query = "") {
    await page.goto(`${stack.nextUrl}/acceso${query}`);
    await page.locator("#login-email").fill(address);
    await page.locator("#login-password").fill(password);
    await page.getByRole("button", { name: "Iniciar sesión" }).click();
  }
  await submitLogin(client, email, previousPassword);
  await expect(client.getByText(denial)).toBeVisible();
  await client.goto(`${stack.nextUrl}/verificar`);
  await client.locator("#verification-email").fill(email);
  await client.locator("#verification-code").fill(code);
  await client.getByRole("button", { name: "Verificar correo", exact: true }).click();
  await expect(client.getByRole("heading", { name: "Correo verificado" })).toBeVisible();

  await submitLogin(client, "desconocido@example.test", previousPassword);
  await expect(client.getByText(denial)).toBeVisible();
  await submitLogin(client, email, "contraseña incorrecta");
  await expect(client.getByText(denial)).toBeVisible();
  await client.evaluate((key) => localStorage.setItem(key, JSON.stringify([{ variantId: "demo-arroz-1-kg", quantity: 2 }])), guestCartKey);
  await submitLogin(client, email, previousPassword, "?volver=/carrito");
  try {
    await expect(client).toHaveURL(`${stack.nextUrl}/carrito`);
  } catch (error) {
    throw new Error(`Inicio local: ${JSON.stringify(stack.requests.slice(-6))}.`, { cause: error });
  }
  await expect(client.getByText("2 artículos en el carrito.")).toBeVisible();
  assert.ok((await client.context().cookies()).some(({ name, httpOnly, sameSite }) =>
    name.startsWith("mi-comercio-session") && httpOnly && sameSite === "Lax"));
  await client.goto(`${stack.nextUrl}/cuenta`);
  await expect(client.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  assert.equal((await client.goto(`${stack.nextUrl}/admin`))?.status(), 404);
  const user = (await stack.db.query<{ user_id: string }>("select user_id from public.profiles where email = $1", [email])).rows[0].user_id;
  await stack.db.query("insert into public.administrators(user_id) values ($1)", [user]);
  await client.goto(`${stack.nextUrl}/admin`);
  await expect(client.getByRole("heading", { name: "Administración" })).toBeVisible();
  await stack.db.query("update public.administrators set revoked_at = now() where user_id = $1", [user]);
  assert.equal((await client.goto(`${stack.nextUrl}/admin`))?.status(), 404);
  await stack.db.query("update auth.sessions set not_after = now() - interval '1 minute' where user_id = $1", [user]);
  await client.goto(`${stack.nextUrl}/cuenta`);
  await expect(client).toHaveURL(/\/acceso\?volver=/);

  await submitLogin(client, email, previousPassword);
  await expect(client.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  await recovery.goto(`${stack.nextUrl}/recuperar`);
  await recovery.locator("#recovery-email").fill(email);
  await recovery.getByRole("button", { name: "Solicitar enlace" }).click();
  await expect(recovery.getByText(/Si la cuenta puede recuperarse/)).toBeVisible();
  const message = stack.messages.filter(({ addresses }) => addresses.includes(email)).at(-1)?.source;
  const link = message?.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16))).match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
  assert.ok(link, "Recovery email contains the local link");
  const destination = new URL(link);
  assert.equal(destination.origin, new URL(stack.supabaseUrl).origin);
  try {
    await recovery.goto(destination.href);
  } catch {
    throw new Error(`El enlace local no pudo abrirse. ${JSON.stringify(stack.requests.slice(-4))}`);
  }
  await expect(recovery).toHaveURL(/\/restablecer$/);
  assert.equal((await recovery.context().cookies()).some(({ name }) => name === "mi-comercio-session"), false);
  await recovery.goto(`${stack.nextUrl}/cuenta`);
  await expect(recovery).toHaveURL(/\/acceso\?volver=/);
  await recovery.goto(`${stack.nextUrl}/restablecer`);
  await recovery.locator("#reset-password").fill(newPassword);
  await recovery.locator("#reset-repeat").fill(newPassword);
  await recovery.getByRole("button", { name: "Guardar contraseña" }).click();
  await expect(recovery.getByText(/Contraseña actualizada/)).toBeVisible();
  await client.goto(`${stack.nextUrl}/cuenta`);
  await expect(client).toHaveURL(/\/acceso\?volver=/);
  await submitLogin(recovery, email, previousPassword);
  await expect(recovery.getByText(denial)).toBeVisible();
  await submitLogin(recovery, email, newPassword);
  await expect(recovery.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  await recovery.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(recovery).toHaveURL(/\/acceso$/);
  await recovery.goto(`${stack.nextUrl}/cuenta`);
  await expect(recovery).toHaveURL(/\/acceso\?volver=/);
});

test("SPEC-007 codes expire, are bound to the recipient, and can be used only once", {
  skip: !nativeAuthBinary || !nativeRestBinary, timeout: 90_000,
}, async (t) => {
  const stack = await startLocalStack(t, { verifyLimit: 6 });
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const email = "verificacion@example.test";
  const invalidMessage = /El código no es válido o ya venció/;
  await page.goto(`${stack.nextUrl}/registro`);
  await fillRegistration(page, email, "0100000009");
  await page.getByRole("link", { name: "Verificar correo" }).click();
  const emailField = page.locator("#verification-email");
  const codeField = page.locator("#verification-code");
  const verify = page.getByRole("button", { name: "Verificar correo", exact: true });
  const resend = page.getByRole("button", { name: "Reenviar código" });
  const mailCode = () => {
    const latest = stack.messages.filter((mail) => mail.addresses.includes(email)).at(-1);
    const code = latest?.source.match(/<strong>([0-9]{6})<\/strong>/)?.[1];
    assert.ok(code, "A six-digit code must be delivered in the synthetic email");
    return code;
  };
  const submit = async (button: typeof verify) => {
    await Promise.all([
      page.waitForResponse((response) => response.url().endsWith("/verificar") && response.request().method() === "POST"),
      button.click(),
    ]);
  };
  const initialCode = mailCode();
  await emailField.fill("otra-cuenta@example.test");
  await codeField.fill(initialCode);
  await submit(verify);
  await expect(codeField).toHaveAccessibleDescription(invalidMessage);

  await emailField.fill(email);
  await submit(resend);
  await expect(page.getByText("Espera antes de solicitar otro código.")).toBeVisible();
  await stack.db.query("update auth.users set confirmation_sent_at = now() - interval '11 minutes' where email = $1", [email]);
  await submit(verify);
  await expect(codeField).toHaveAccessibleDescription(invalidMessage);
  await submit(resend);
  await expect(page.getByText("Si el correo tiene una verificación pendiente", { exact: false })).toBeVisible();
  const currentCode = mailCode();
  await codeField.fill(currentCode);
  await submit(verify);
  await expect(page.getByRole("heading", { name: "Correo verificado" })).toBeVisible();
  assert.ok((await stack.db.query("select verified_at from public.profiles where email = $1", [email])).rows[0].verified_at);
  assert.equal((await page.context().cookies()).some((cookie) => cookie.name.startsWith("mi-comercio-session")), false);

  await page.goto(`${stack.nextUrl}/verificar`);
  await emailField.fill(email);
  await codeField.fill(currentCode);
  await submit(verify);
  await expect(codeField).toHaveAccessibleDescription(invalidMessage);
  // Auth permits an initial burst of 30 requests and refills at the configured rate.
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await fetch(`${stack.supabaseUrl}/auth/v1/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: stack.publishableKey },
      body: JSON.stringify({ email, token: "000000", type: "signup" }),
    });
    if (response.status === 429) break;
  }
  await codeField.fill("000000");
  await submit(verify);
  await expect(page.getByText("Se alcanzó el límite temporal de intentos.", { exact: false })).toBeVisible();
  assert.ok(stack.requests.some(({ path, status }) => path === "/auth/v1/verify" && status === 429));
});

test("SPEC-009 contact, verified email change and password changes remain scoped to the customer", {
  skip: !nativeAuthBinary || !nativeRestBinary, timeout: 90_000,
}, async (t) => {
  const stack = await startLocalStack(t, { resendSeconds: 0 });
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const second = await browser.newPage();
  const email = "perfil@example.test";
  const newEmail = "perfil-actualizado@example.test";
  const otherEmail = "segundo@example.test";
  const password = "una contraseña ficticia";
  await page.goto(`${stack.nextUrl}/registro`);
  await fillRegistration(page, email, "0100000009");
  await page.getByRole("link", { name: "Verificar correo" }).click();
  const code = stack.messages.find(({ addresses }) => addresses.includes(email))?.source.match(/<strong>([0-9]{6})<\/strong>/)?.[1];
  assert.ok(code);
  await page.locator("#verification-email").fill(email);
  await page.locator("#verification-code").fill(code);
  await page.getByRole("button", { name: "Verificar correo", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Correo verificado" })).toBeVisible();
  await page.getByRole("link", { name: "Ir al acceso" }).click();
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  await expect(page.getByText("0100000009", { exact: true })).toBeVisible();
  await expect(page.locator('input[name="nationalId"]')).toHaveCount(0);
  await page.locator("#profile-names").fill("Nombre actualizado");
  await page.getByRole("button", { name: "Guardar contacto" }).click();
  await expect(page.getByText("Datos de contacto actualizados.")).toBeVisible();
  assert.equal((await stack.db.query("select given_names from public.profiles where email = $1", [email])).rows[0].given_names, "Nombre actualizado");

  await second.goto(`${stack.nextUrl}/registro`);
  await fillRegistration(second, otherEmail, "0200000008");
  await expect(second.getByRole("heading", { name: "Registro pendiente de verificación" })).toBeVisible();
  await page.getByText("Cambiar correo", { exact: true }).click();
  async function requestEmail(address: string) {
    await page.locator("#profile-email").fill(address);
    await page.locator("#profile-email-password").fill(password);
    await page.getByRole("button", { name: "Solicitar cambio de correo" }).click();
  }
  await requestEmail(otherEmail);
  await expect(page.getByText("No se pudo solicitar el cambio.", { exact: false })).toBeVisible();
  await requestEmail(newEmail);
  await expect(page.getByText(/Confirma el cambio mediante los enlaces/)).toBeVisible();

  for (const address of [email, newEmail]) {
    const source = stack.messages.filter(({ addresses }) => addresses.includes(address)).at(-1)?.source;
    const link = source?.replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/g, (_, hex: string) =>
      String.fromCharCode(Number.parseInt(hex, 16))).match(/href="([^"]+)"/)?.[1]?.replaceAll("&amp;", "&");
    assert.ok(link, "Email verification contains an authorized local link");
    assert.equal(new URL(link).origin, new URL(stack.supabaseUrl).origin);
    try { await page.goto(link); } catch { throw new Error("Email change link could not be opened"); }
  }
  await page.goto(`${stack.nextUrl}/cuenta`);
  await expect(page.getByText(newEmail, { exact: true })).toBeVisible();
  await page.getByText("Cambiar contraseña", { exact: true }).click();
  await page.locator("#profile-current-password").fill(password);
  await page.locator("#profile-new-password").fill("otra contraseña ficticia");
  await page.locator("#profile-repeat-password").fill("otra contraseña ficticia");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText(/Contraseña actualizada/)).toBeVisible();
});
