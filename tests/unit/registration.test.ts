import assert from "node:assert/strict";
import { test } from "node:test";

import { isEcuadorianNationalId, registrationFields, validateRegistration } from "../../lib/account/registration";

test("registration normalizes email and mobile and preserves the national ID as text", () => {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    givenNames: " Persona ", familyNames: " de Prueba ", nationalId: "0100000009",
    mobile: "09 0000 0000", email: " Prueba@Example.Test ", password: "una contraseña de prueba", consent: "demo",
  })) form.set(name, value);
  const result = validateRegistration(form);
  assert.ok(result.ok);
  assert.equal(result.data.nationalId, "0100000009");
  assert.equal(result.data.email, "prueba@example.test");
  assert.equal(result.data.mobile, "+593900000000");
  assert.equal(result.data.givenNames, "Persona");
});

test("registration catches absent fields, missing consent and malformed national IDs", () => {
  const result = validateRegistration(new FormData());
  assert.ok(!result.ok);
  assert.deepEqual(Object.keys(result.errors), [...registrationFields]);
  for (const value of ["0100000000", "0000000000", "9900000002", "010000000", "abcdefghij"]) {
    assert.equal(isEcuadorianNationalId(value), false, value);
  }
});
