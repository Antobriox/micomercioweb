import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";

import { chromium, expect, type Page } from "@playwright/test";

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

test("SPEC-010, SPEC-021 to SPEC-029 and SPEC-031 to SPEC-034 cover simulated administration", {
  skip: !nativeAuthBinary || !nativeRestBinary, timeout: 120_000,
}, async (t) => {
  const stack = await startLocalStack(t);
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const person = async (email: string, nationalId: string) => {
    await page.goto(`${stack.nextUrl}/registro`);
    await fillRegistration(page, email, nationalId);
    await expect(page.getByRole("heading", { name: "Registro pendiente de verificación" })).toBeVisible();
    return (await stack.db.query<{ id: string }>(
      "update auth.users set email_confirmed_at=now() where email=$1 returning id", [email],
    )).rows[0].id;
  };
  const email = "cliente-pedidos@example.test";
  const customer = await person(email, "0100000009");
  const other = await person("otra-cuenta@example.test", "0200000008");
  const sentMail = stack.messages.length;
  await page.goto(`${stack.nextUrl}/acceso`);
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill("una contraseña ficticia");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  await page.getByRole("link", { name: "Mis pedidos" }).click();
  await expect(page.getByText("No tienes un pedido activo.")).toBeVisible();
  await expect(page.getByText(/No hay pedidos en esta página/)).toBeVisible();

  const slot = (await stack.db.query<{ id: string }>(
    "insert into public.pickup_slots(service_date,starts_at,capacity) values(current_date-2,'10:45',3) returning id",
  )).rows[0].id;
  const seed = async (user: string) => (await stack.db.query<{ id: string }>(
    "insert into public.orders(user_id,slot_id,request_key,estimated_total_minor,currency) values($1,$2,$3,900,'USD') returning id",
    [user, slot, randomUUID()],
  )).rows[0].id;
  const previous = await seed(customer);
  await stack.db.query("update public.orders set status='cancelled' where id=$1", [previous]);
  const active = await seed(customer);
  const foreign = await seed(other);
  await stack.db.query("insert into public.order_events(order_id,actor_id,next_status) values($1,$2,'pending')", [active, customer]);
  await stack.db.query(`insert into public.order_items(order_id,variant_id,product_name,presentation,unit,quantity,unit_price_minor)
    values($1,'demo-arroz-1-kg','Arroz histórico','Bolsa','bolsa',2,400),($1,'demo-retirado','Línea retirada','Caja','caja',1,100)`, [previous]);
  await stack.db.query("insert into public.cart_items(user_id,variant_id,quantity) values($1,'demo-arroz-caja',1)", [customer]);
  await page.goto(`${stack.nextUrl}/cuenta/pedidos`);
  await expect(page.getByRole("region", { name: "Pedido activo" }).getByText("Pendiente")).toBeVisible();
  await expect(page.getByRole("region", { name: "Historial" }).getByText("Cancelado")).toBeVisible();
  const otherResponse = await page.goto(`${stack.nextUrl}/cuenta/pedidos/${foreign}`);
  assert.equal(otherResponse?.status(), 404);
  await page.goto(`${stack.nextUrl}/cuenta/pedidos/${active}`);
  await expect(page.getByText("Estado · Pendiente")).toBeVisible();
  await stack.db.query("update public.orders set status='confirmed' where id=$1", [active]);
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.getByText("Estado · Confirmado")).toBeVisible();
  await page.goto(`${stack.nextUrl}/cuenta/pedidos/${previous}`);
  await expect(page.getByText("Retiro ·", { exact: false })).toContainText("10:45");
  await page.getByRole("button", { name: "Repetir en el carrito" }).click();
  await expect(page.getByText(/Ya tienes un pedido activo/)).toBeVisible();
  await page.goto(`${stack.nextUrl}/cuenta/pedidos/${active}`);
  await page.locator("summary").filter({ hasText: "Cancelar pedido" }).focus();
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Confirmar cancelación" }).click();
  await expect(page.getByText("Estado · Cancelado")).toBeVisible();
  assert.equal((await stack.db.query("select reserved from public.pickup_slots where id=$1", [slot])).rows[0].reserved, 1);
  await page.goto(`${stack.nextUrl}/cuenta/pedidos/${previous}`);
  await page.getByRole("button", { name: "Repetir en el carrito" }).click();
  await expect(page.getByText(/cantidades anteriores de Línea retirada/)).toBeVisible();
  await page.getByRole("link", { name: "Revisar carrito" }).click();
  await expect(page.getByText("3 artículos en el carrito.")).toBeVisible();
  const rows = await stack.db.query("select variant_id,quantity,quoted_minor from public.cart_items where user_id=$1 order by variant_id", [customer]);
  assert.deepEqual(rows.rows, [
    { variant_id: "demo-arroz-1-kg", quantity: 2, quoted_minor: "210" },
    { variant_id: "demo-arroz-caja", quantity: 1, quoted_minor: null },
  ]);
  assert.equal((await stack.db.query("select 1 from public.orders where user_id=$1", [customer])).rowCount, 2);
  await page.goto(`${stack.nextUrl}/admin/pedidos/${foreign}`);
  await expect(page.getByRole("button", { name: "Confirmar pedido" })).toHaveCount(0);
  await stack.db.query("insert into public.administrators(user_id) values ($1)", [other]);
  const admin = await browser.newPage();
  await admin.goto(`${stack.nextUrl}/acceso?destino=/admin`);
  await admin.locator("#login-email").fill("otra-cuenta@example.test");
  await admin.locator("#login-password").fill("una contraseña ficticia");
  await admin.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(admin.locator("#login-email")).toHaveCount(0);
  await admin.goto(`${stack.nextUrl}/admin/pedidos/${foreign}`);
  for (const [button, state] of [
    ["Confirmar pedido", "Confirmado"],
    ["Iniciar preparación", "En preparación"],
    ["Marcar listo para retirar", "Listo para retirar"],
  ]) {
    await admin.getByRole("button", { name: button }).click();
    await expect(admin.getByText(`Estado · ${state}`, { exact: true })).toBeVisible();
  }
  await admin.getByRole("button", { name: "Registrar entrega de prueba" }).click();
  await expect(admin.getByText("Estado · Listo para retirar", { exact: true })).toBeVisible();
  await admin.getByLabel("Verifiqué el cobro de prueba en caja").check();
  await admin.getByLabel("Verifiqué el retiro de prueba").check();
  await admin.getByRole("button", { name: "Registrar entrega de prueba" }).click();
  await expect(admin.getByText("Estado · Entregado", { exact: true })).toBeVisible();
  await expect(admin.getByText("Cobro y retiro simulados verificados manualmente")).toBeVisible();

  await page.goto(`${stack.nextUrl}/cuenta`);
  await page.getByRole("link", { name: /Notificaciones/ }).click();
  await expect(page.getByRole("heading", { name: "Notificaciones" })).toBeVisible();
  await expect(page.getByText("2 sin leer", { exact: true })).toBeVisible();
  await expect(page.getByText("Entregado · Sin leer")).toHaveCount(0);
  const cancelled = page.getByRole("listitem").filter({ hasText: "Cancelado · Sin leer" });
  await cancelled.getByRole("button", { name: "Marcar como leída" }).click();
  await expect(page.getByText("Cancelado · Leída")).toBeVisible();
  await expect(page.getByText("1 sin leer", { exact: true })).toBeVisible();
  await page.context().setOffline(true);
  const next = await seed(customer);
  await stack.db.query("insert into public.order_events(order_id,actor_id,next_status) values($1,$2,'pending')", [next, customer]);
  await page.context().setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(page.getByText("2 sin leer", { exact: true })).toBeVisible();
  assert.equal(stack.messages.length, sentMail);

  await admin.addInitScript(() => {
    const oscillator = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () {
      const html = document.documentElement;
      html.dataset.tones = String(Number(html.dataset.tones ?? "0") + 1);
      return oscillator.call(this);
    };
  });
  await admin.goto(`${stack.nextUrl}/admin`);
  await expect(admin.getByText("1 pendiente de confirmación", { exact: true })).toBeVisible();
  await expect(admin.getByRole("link", { name: "Pendiente · 0", exact: true })).toBeVisible();
  const sound = admin.getByRole("button", { name: "Sonido de pedidos nuevos" });
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  const today = (await stack.db.query<{ id: string }>(
    "insert into public.pickup_slots(service_date,starts_at,capacity) values((now() at time zone 'America/Guayaquil')::date,'23:45',1) returning id",
  )).rows[0].id;
  const todayOrder = (await stack.db.query<{ id: string }>(
    "insert into public.orders(user_id,slot_id,request_key,estimated_total_minor,currency) values($1,$2,$3,900,'USD') returning id",
    [other, today, randomUUID()],
  )).rows[0].id;
  await admin.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(admin.getByText("2 pendientes de confirmación", { exact: true })).toBeVisible();
  await expect(admin.locator("html")).toHaveAttribute("data-tones", "1");
  await admin.evaluate(() => window.dispatchEvent(new Event("online")));
  await expect(admin.getByRole("link", { name: `Pedido ${todayOrder.slice(0, 8).toUpperCase()}`, exact: true })).toHaveCount(1);
  const restrictedAudio = await browser.newContext({ storageState: await admin.context().storageState() });
  try {
    const silent = await restrictedAudio.newPage();
    await silent.goto(`${stack.nextUrl}/admin`);
    await silent.evaluate(() => {
      AudioContext.prototype.resume = () => Promise.reject(new DOMException("Audio unavailable in this fixture", "NotAllowedError"));
    });
    await silent.getByRole("button", { name: "Sonido de pedidos nuevos" }).click();
    await expect(silent.getByText("El navegador no habilitó el sonido.")).toBeVisible();
    await expect(silent.getByText("2 pendientes de confirmación", { exact: true })).toBeVisible();
  } finally { await restrictedAudio.close(); }
  await admin.getByRole("link", { name: "Pendiente · 1", exact: true }).click();
  await expect(admin.getByRole("link", { name: /Ver pedido/ })).toHaveCount(1);
  await expect(admin.getByRole("link", { name: `Ver pedido ${todayOrder.slice(0, 8).toUpperCase()}` })).toBeVisible();
  await admin.getByLabel("Pedido, cliente, cédula o correo").fill("cuenta-ausente@example.test");
  await admin.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(admin.getByText("Sin pedidos para esta búsqueda.")).toBeVisible();
  await admin.goto(`${stack.nextUrl}/admin/clientes`);
  await admin.getByLabel("Nombre, cédula o correo").fill("0100000009");
  await admin.getByRole("button", { name: "Buscar", exact: true }).click();
  const result = admin.getByRole("region", { name: "Resultados de clientes" });
  const customerLink = result.locator(`a[href="/admin/clientes/${customer}"]`);
  await expect(result.getByRole("link")).toHaveCount(1);
  assert.ok(!admin.url().includes("0100000009"));
  await customerLink.click();
  await expect(admin.getByText("••••••0009")).toBeVisible();
  await admin.locator("summary").filter({ hasText: "Suspender cuenta" }).click();
  await admin.getByRole("button", { name: "Confirmar suspensión" }).click();
  await expect(admin.getByText("Cuenta suspendida", { exact: true })).toBeVisible();
  await page.goto(`${stack.nextUrl}/cuenta`);
  await expect(page.locator("#login-email")).toBeVisible();
  await admin.locator("summary").filter({ hasText: "Reactivar cuenta" }).click();
  await admin.getByRole("button", { name: "Confirmar reactivación" }).click();
  await expect(admin.getByText("Cuenta verificada", { exact: true })).toBeVisible();
  await page.goto(`${stack.nextUrl}/cuenta`);
  await expect(page.locator("#login-email")).toBeVisible();

  await admin.goto(`${stack.nextUrl}/admin/catalogo/demo-arroz`);
  await admin.getByLabel("Descripción").fill("Descripción editorial de prueba.");
  await admin.getByLabel("Destacado en inicio").check();
  await admin.getByRole("button", { name: "Guardar ficha editorial" }).click();
  await expect(admin.getByText("Ficha editorial guardada.")).toBeVisible();
  await page.goto(`${stack.nextUrl}/producto/arroz-de-prueba`);
  await expect(page.getByText("Descripción editorial de prueba.")).toBeVisible();
  await page.goto(stack.nextUrl);
  await expect(page.getByRole("heading", { name: "Productos destacados" })).toBeVisible();
  await admin.getByLabel("Visible en el catálogo").uncheck();
  await admin.getByRole("button", { name: "Guardar ficha editorial" }).click();
  await expect.poll(async () => (await stack.db.query("select visible from public.product_editorial where product_id='demo-arroz'")).rows[0].visible).toBe(false);
  assert.equal((await page.goto(`${stack.nextUrl}/producto/arroz-de-prueba`))?.status(), 404);
  await page.goto(`${stack.nextUrl}/catalogo`);
  await expect(page.getByRole("link", { name: "Arroz de prueba" })).toHaveCount(0);
  await admin.locator("input[name=images]").setInputFiles([
    { name: "prueba.svg", mimeType: "image/svg+xml", buffer: Buffer.from("<svg></svg>") },
    { name: "prueba-falsa.png", mimeType: "image/png", buffer: Buffer.from("contenido de prueba") },
  ]);
  await admin.getByLabel("Texto alternativo · prueba.svg").fill("Foto no admitida");
  await admin.getByLabel("Texto alternativo · prueba-falsa.png").fill("Foto dañada");
  await admin.getByRole("button", { name: "Subir fotos" }).click();
  await expect(admin.getByText(/Imagen 1.*Usa un archivo/)).toBeVisible();
  await expect(admin.getByText(/Imagen 2.*contenido del archivo/)).toBeVisible();
  const bannerId = (await stack.db.query<{ id: string }>(`insert into public.banners(
    location,title,desktop_path,mobile_path,alt_text,destination,starts_at,ends_at,enabled)
    values('home','Campaña simulada',$1,$2,'Pieza editorial de prueba','/producto/arroz-de-prueba',now()-interval '1 hour',now()+interval '1 hour',true) returning id`,
    [`${randomUUID()}.webp`, `${randomUUID()}.webp`])).rows[0].id;
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(stack.nextUrl);
  const campaign = page.getByRole("article").filter({ hasText: "Campaña simulada" });
  await expect(campaign.getByText("Campaña simulada")).toBeVisible();
  await expect(campaign.getByRole("link")).toHaveCount(0);
  const mobile = await campaign.locator("source").getAttribute("srcset");
  await expect.poll(() => campaign.locator("img").evaluate((element: HTMLImageElement) => element.currentSrc)).toContain(mobile);
  await admin.goto(`${stack.nextUrl}/admin/banners`);
  await admin.locator("summary").filter({ hasText: "Campaña simulada" }).click();
  const existingBanner = admin.locator("details").filter({ hasText: "Campaña simulada" });
  await expect(existingBanner.getByRole("region", { name: "Vista previa de la pieza" })).toBeVisible();
  await existingBanner.getByLabel("Activar publicación durante la vigencia").uncheck();
  await existingBanner.getByRole("button", { name: "Guardar pieza" }).click();
  await expect.poll(async () => (await stack.db.query("select enabled from public.banners where id=$1", [bannerId])).rows[0].enabled).toBe(false);
  await page.reload();
  await expect(campaign).toHaveCount(0);

  await admin.goto(`${stack.nextUrl}/admin/contenido/preguntas-frecuentes`);
  await admin.locator("#cms-title").fill("FAQ de demostración");
  await admin.getByLabel("Contenido", { exact: true }).fill("<script>fixture de prueba</script>");
  await admin.locator("textarea[name=pairs]").fill("¿Es un pedido real? | Es un pedido de prueba.");
  await admin.getByLabel("Título para buscadores").fill("SEO de demostración");
  await admin.getByRole("button", { name: "Guardar borrador" }).click();
  const preview = admin.getByRole("region", { name: "Vista previa del borrador" });
  await expect(preview.getByText("¿Es un pedido real?")).toBeVisible();
  await page.goto(`${stack.nextUrl}/preguntas-frecuentes`);
  await expect(page.getByText("¿Es un pedido real?")).toHaveCount(0);
  await admin.getByRole("button", { name: "Publicar", exact: true }).click();
  await expect(admin.getByText("Página publicada.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "FAQ de demostración" })).toBeVisible();
  await expect(page.getByText("<script>fixture de prueba</script>", { exact: true })).toBeVisible();
  await expect(page.locator("script").filter({ hasText: /^fixture de prueba$/ })).toHaveCount(0);
  await expect(page).toHaveTitle(/SEO de demostración/);

  await admin.goto(`${stack.nextUrl}/admin/analitica`);
  await admin.getByLabel("Período").selectOption("anio");
  await admin.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(admin.getByText("Ventas netas", { exact: true })).toBeVisible();
  await expect(admin.getByText("Presentaciones más vendidas", { exact: true })).toBeVisible();
  await expect(admin.getByText("demo-arroz-1-kg · 1 unidades")).toBeVisible();
  await expect(admin.getByText("Cancelado", { exact: true })).toBeVisible();
  await expect(admin.getByText("Conversión de envío", { exact: true })).toBeVisible();
  await page.goto(`${stack.nextUrl}/admin/analitica`);
  await expect(page.getByRole("heading", { name: "Ventas de caja" })).toHaveCount(0);
  await admin.goto(`${stack.nextUrl}/admin/inventario`);
  await expect(admin.getByText("Inventario simulado de demostración.")).toBeVisible();
  await expect(admin.getByText(/Valoración total.*No disponible/)).toBeVisible();
  await expect(admin.getByText("Existencia · 0 · Agotado")).toBeVisible();
  await expect(admin.getByText("Existencia · No confirmada", { exact: true })).toBeVisible();
  await admin.getByLabel("Existencia", { exact: false }).selectOption("bajo");
  await admin.getByLabel("Límite para stock bajo").fill("4");
  await admin.getByRole("button", { name: "Aplicar", exact: true }).click();
  await expect(admin.getByText("Existencia · 3 · Bajo")).toBeVisible();
  await expect(admin.getByText("Existencia · 0 · Agotado")).toHaveCount(0);
  await page.goto(`${stack.nextUrl}/admin/inventario`);
  await expect(page.getByRole("heading", { name: "Inventario", exact: true })).toHaveCount(0);
});

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

test("SPEC-008, SPEC-016 to SPEC-020 and SPEC-030 validate checkout and operating configuration", {
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
  await client.goto(`${stack.nextUrl}/producto/arroz-de-prueba`);
  await client.getByRole("combobox", { name: /Presentación/ }).selectOption("demo-arroz-1-kg");
  await client.getByRole("spinbutton", { name: /Cantidad/ }).fill("2");
  await client.getByRole("button", { name: /Agregar al carrito/ }).click();
  await expect(client.getByText("Producto agregado al carrito de prueba.")).toBeVisible();
  await submitLogin(client, email, previousPassword, "?volver=/carrito");
  try {
    await expect(client).toHaveURL(`${stack.nextUrl}/carrito`);
  } catch (error) {
    throw new Error(`Inicio local: ${JSON.stringify(stack.requests.slice(-6))}.`, { cause: error });
  }
  await expect(client.getByText("2 artículos en el carrito.")).toBeVisible();
  await expect.poll(async () => (
    await stack.db.query("select quantity from public.cart_items where variant_id = 'demo-arroz-1-kg'")
  ).rows[0]?.quantity).toBe(2);
  await client.reload();
  await expect(client.getByText("2 artículos en el carrito.")).toBeVisible();
  await client.getByRole("link", { name: "Revisar pedido de prueba" }).click();
  await expect(client).toHaveURL(/\/pedido\/confirmar$/);
  await expect(client.getByText("No hay franjas de retiro disponibles hoy.")).toBeVisible();
  await expect(client.getByText(/Total estimado.*4,20/)).toBeVisible();
  await stack.db.query("update public.cart_items set quantity = 3 where variant_id = 'demo-arroz-1-kg'");
  await client.getByRole("button", { name: "Aceptar total estimado" }).click();
  await expect(client.getByText("Cambió el precio, la cantidad o la disponibilidad.", { exact: false })).toBeVisible();
  await expect(client.getByText(/Total estimado.*6,30/)).toBeVisible();
  await client.getByRole("button", { name: "Aceptar total estimado" }).click();
  await expect(client.getByText("El total estimado actual está revisado.")).toBeVisible();
  assert.equal((await stack.db.query("select snapshot->>'totalMinor' as total from public.order_reviews")).rows[0].total, "630");
  assert.ok((await client.context().cookies()).some(({ name, httpOnly, sameSite }) =>
    name.startsWith("mi-comercio-session") && httpOnly && sameSite === "Lax"));
  await client.goto(`${stack.nextUrl}/cuenta`);
  await expect(client.getByRole("heading", { name: "Mi cuenta" })).toBeVisible();
  assert.equal((await client.goto(`${stack.nextUrl}/admin`))?.status(), 404);
  const user = (await stack.db.query<{ user_id: string }>("select user_id from public.profiles where email = $1", [email])).rows[0].user_id;
  await stack.db.query("insert into public.administrators(user_id) values ($1)", [user]);
  await client.goto(`${stack.nextUrl}/admin`);
  await expect(client.getByRole("heading", { name: "Administración" })).toBeVisible();
  await client.getByRole("link", { name: "Calendario y horarios" }).click();
  await expect(client.getByRole("heading", { name: "Calendario y horarios" })).toBeVisible();
  const pause = client.getByRole("form", { name: "Pausa de pedidos" });
  await pause.getByRole("checkbox").check();
  await pause.getByLabel("Aviso al cliente").fill("Pausa temporal de demostración.");
  await pause.getByRole("button", { name: "Guardar" }).click();
  await expect(pause.getByText("Calendario actualizado.")).toBeVisible();
  await expect(client.getByText("Configuración general", { exact: false }).first()).toBeVisible();
  const weekday = client.locator("details").filter({ hasText: "Domingo" });
  await weekday.locator("summary").click();
  await weekday.locator('input[name="web_close"]').fill("12:45");
  await weekday.getByRole("button", { name: /Guardar/ }).click();
  await expect(weekday.getByText("Calendario actualizado.")).toBeVisible();
  await recovery.goto(`${stack.nextUrl}/horarios`);
  await expect(recovery.getByText("Recepción web · 07:00–12:45")).toBeVisible();
  await recovery.goto(`${stack.nextUrl}/horarios`);
  await expect(recovery.getByText("Pausa temporal de demostración.")).toBeVisible();
  const capacity = client.getByRole("form", { name: "Capacidad de retiro" });
  await capacity.getByLabel("Cupos por franja nueva").fill("2");
  await capacity.getByRole("button", { name: "Guardar" }).click();
  await expect(capacity.getByText("Calendario actualizado.")).toBeVisible();
  assert.equal((await stack.db.query("select default_capacity from public.operating_switch")).rows[0].default_capacity, 2);
  const { local_time: localTime } = (await stack.db.query("select local_time::text from public.operating_at()")).rows[0];
  if (typeof localTime === "string" && localTime < "23:00:00") {
    await stack.db.query("update public.operating_switch set paused=false, notice=null, default_capacity=1");
    await stack.db.query(`insert into public.operating_exceptions(day, closed, notice, store_open, store_close, web_open, web_close)
      values ((now() at time zone 'America/Guayaquil')::date, false, 'Horario ampliado de prueba', '00:00', '23:59', '00:00', '23:20')`);
    await client.goto(`${stack.nextUrl}/pedido/confirmar`);
    const pickup = client.getByRole("combobox", { name: "Franja de retiro de hoy" });
    await expect(pickup).toBeVisible();
    await pickup.selectOption({ index: 1 });
    await client.route("**/api/pedidos/demo", async (route) => {
      await route.fetch();
      await route.abort();
    }, { times: 1 });
    await client.getByRole("button", { name: "Enviar pedido de prueba" }).click();
    await expect(client.getByText(/La conexión se interrumpió/)).toBeVisible();
    await client.getByRole("button", { name: "Enviar pedido de prueba" }).click();
    await expect(client.getByText("Pedido de prueba registrado.")).toBeVisible();
    const { rows } = await stack.db.query("select id,status,estimated_total_minor,demo from public.orders");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].status, "pending");
    assert.equal(rows[0].estimated_total_minor, "630");
    assert.equal(rows[0].demo, true);
    assert.equal((await stack.db.query("select 1 from public.cart_items")).rowCount, 0);
    await client.reload();
    await expect(client.getByText("Pedido de prueba registrado.")).toBeVisible();
    const visit = await client.evaluate(() => sessionStorage.getItem("mi-comercio:visita-demo"));
    assert.ok(visit);
    await expect.poll(async () => (await stack.db.query(
      "select kind from public.demo_funnel_events where visitor=md5($1) order by kind", [visit],
    )).rows.map(({ kind }) => kind)).toEqual(expect.arrayContaining(["visit", "product", "add", "signin", "slot", "submit", "accepted"]));
    assert.equal((await stack.db.query("select 1 from public.demo_submission_intents")).rowCount, 1);
  } else {
    t.diagnostic("La prueba SQL cubre pedidos con horario fijo. La hora local no deja una franja de prueba en esta ejecución.");
  }
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

test("SPEC-009 and SPEC-010 keep profile and favorites scoped to the customer", {
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
  await page.goto(`${stack.nextUrl}/producto/arroz-de-prueba`);
  await page.getByRole("button", { name: "Guardar en favoritos" }).click();
  await expect(page.getByRole("button", { name: "Quitar de favoritos" })).toBeVisible();
  await page.goto(`${stack.nextUrl}/cuenta/favoritos`);
  await expect(page.getByRole("link", { name: "Arroz de prueba" })).toBeVisible();
  await page.getByRole("button", { name: "Quitar de favoritos" }).click();
  await expect(page.getByText("Aún no tienes productos guardados.")).toBeVisible();
  await page.goto(`${stack.nextUrl}/cuenta`);
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
  await page.locator("summary").filter({ hasText: /^Cambiar contraseña$/ }).click();
  await page.locator("#profile-current-password").fill(password);
  await page.locator("#profile-new-password").fill("otra contraseña ficticia");
  await page.locator("#profile-repeat-password").fill("otra contraseña ficticia");
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
  await expect(page.getByText(/Contraseña actualizada/)).toBeVisible();
});
