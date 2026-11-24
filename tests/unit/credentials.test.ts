import assert from "node:assert/strict";
import { test } from "node:test";

import { allowedPassword, loginDestination, normalizedEmail, validNewPassword } from "../../lib/account/credentials";

test("login returns only to approved local destinations", () => {
  assert.equal(loginDestination("/carrito"), "/carrito");
  for (const value of ["https://example.test", "//example.test", "/%2fexample.test", "/carrito?return=/admin", "/\\example.test", null]) {
    assert.equal(loginDestination(value), "/cuenta");
  }
});

test("credential limits respect Supabase's UTF-8 password bound", () => {
  assert.equal(normalizedEmail(" Prueba@Example.test "), "prueba@example.test");
  assert.equal(normalizedEmail("incorrecto"), null);
  assert.equal(validNewPassword("c".repeat(72)), true);
  assert.equal(validNewPassword("é".repeat(37)), false);
  assert.equal(validNewPassword("x".repeat(11)), false);
  assert.equal(allowedPassword("clave"), true);
});
