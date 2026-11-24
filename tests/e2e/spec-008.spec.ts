import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("el acceso presenta controles accesibles y la recuperación no revela cuentas", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto("/acceso?volver=/carrito");
  const email = page.getByRole("textbox", { name: /Correo electrónico/ });
  await email.fill("cliente@example.test");
  await page.locator("#login-password").fill("una contraseña ficticia");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "no está disponible" })).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: "Recuperar contraseña" }).click();
  await page.getByRole("textbox", { name: /Correo electrónico/ }).fill("desconocido@example.test");
  await page.getByRole("button", { name: "Solicitar enlace" }).click();
  await expect(page.getByText(/Si la cuenta puede recuperarse/)).toBeVisible();
  await page.goto("/restablecer");
  await expect(page).toHaveURL(/recuperar\?enlace=invalido/);
});
