import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("la demostración identifica modo y entorno y conserva el cierre comercial", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto("/");
  expect(response?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByRole("heading", { name: "Comisariato Mi Comercio" })).toBeVisible();
  await expect(page.getByText("Los pedidos comerciales están deshabilitados.", { exact: false })).toBeVisible();

  const diagnostics = page.getByRole("link", { name: "Consultar entorno de prueba" });
  await diagnostics.focus();
  await expect(diagnostics).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByText("Vista previa", { exact: true })).toBeVisible();
  await expect(page.getByText("Modo demostración", { exact: true })).toBeVisible();
  await expect(page.getByText("Deshabilitados", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("el diagnóstico publica el catálogo simulado sin un servicio comercial externo", async ({ page }) => {
  await page.goto("/diagnostico");
  await expect(page.getByRole("heading", { name: "Catálogo de prueba" })).toBeVisible();
  await expect(page.getByText("Fuente simulada")).toBeVisible();
  await expect(page.getByText("Arroz de prueba")).toBeVisible();
  await expect(page.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T/);
});

test("las respuestas públicas no exponen la configuración privilegiada", async ({ page, request }) => {
  const root = await page.goto("/");
  const document = await root?.text();
  expect(document).not.toContain("fixture-solo-servidor-spec-001");
  const scripts = await page.locator('script[src^="/_next/"]').evaluateAll((nodes) =>
    nodes.map((node) => node.getAttribute("src") ?? ""),
  );
  expect(scripts.length).toBeGreaterThan(0);
  for (const path of scripts) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();
    expect(await response.text()).not.toContain("fixture-solo-servidor-spec-001");
  }
  expect(await (await request.get("/diagnostico")).text()).not.toContain("fixture-solo-servidor-spec-001");
  for (const path of ["/cuenta", "/admin"]) {
    const response = await request.get(path);
    expect(response.status()).toBe(404);
    expect(response.headers()["x-robots-tag"]).toContain("noindex");
  }
});

test("la portada y el diagnóstico son accesibles a 320 píxeles", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 760 });
  for (const path of ["/", "/diagnostico"]) {
    await page.goto(path);
    expect(await page.locator("body").evaluate((body) => body.scrollWidth)).toBeLessThanOrEqual(320);
    expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  }
});
