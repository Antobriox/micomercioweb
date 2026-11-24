import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("el formulario de código muestra errores por campo y funciona con teclado", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/verificar");
  const email = page.getByRole("textbox", { name: /Correo electrónico/ });
  const code = page.getByRole("textbox", { name: /Código de seis dígitos/ });
  await expect(code).toHaveAttribute("autocomplete", "one-time-code");
  await email.fill("prueba@example.test");
  await code.fill("018");
  await page.getByRole("button", { name: "Verificar correo" }).click();
  await expect(code).toBeFocused();
  await expect(code).toHaveAccessibleDescription(/Escribe el código de seis dígitos/);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze()).violations).toEqual([]);
});
