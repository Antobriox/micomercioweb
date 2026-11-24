import { normalizedEmail, validNewPassword } from "./credentials";

export const registrationFields = ["givenNames", "familyNames", "nationalId", "mobile", "email", "password", "consent"] as const;
export type RegistrationField = typeof registrationFields[number];
export type RegistrationErrors = Partial<Record<RegistrationField, string>>;

export interface RegistrationData {
  givenNames: string;
  familyNames: string;
  nationalId: string;
  mobile: string;
  email: string;
  password: string;
}

export type RegistrationResult =
  | { ok: true; data: RegistrationData }
  | { ok: false; errors: RegistrationErrors };

export interface RegistrationState {
  status: "idle" | "invalid" | "unavailable" | "pending";
  errors?: RegistrationErrors;
  message?: string;
}

export function isEcuadorianNationalId(value: string) {
  if (!/^\d{10}$/.test(value)) return false;
  const province = Number(value.slice(0, 2));
  if (!(province >= 1 && province <= 24 || province === 30) || Number(value[2]) > 5) return false;
  let sum = 0;
  for (let position = 0; position < 9; position++) {
    const product = Number(value[position]) * (position % 2 === 0 ? 2 : 1);
    sum += product > 9 ? product - 9 : product;
  }
  return (10 - sum % 10) % 10 === Number(value[9]);
}

function readField(form: FormData, field: RegistrationField) {
  const value = form.get(field);
  return typeof value === "string" ? value : "";
}

export function normalizeMobile(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  const normalized = /^09\d{8}$/.test(compact) ? `+593${compact.slice(1)}` : compact;
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}

export function validName(name: string) {
  return name.length > 0 && name.length <= 100 && !/\p{Cc}/u.test(name);
}

export function validateRegistration(form: FormData): RegistrationResult {
  const data: RegistrationData = {
    givenNames: readField(form, "givenNames").trim(),
    familyNames: readField(form, "familyNames").trim(),
    nationalId: readField(form, "nationalId").trim(),
    mobile: normalizeMobile(readField(form, "mobile")) ?? "",
    email: readField(form, "email").trim().toLowerCase(),
    password: readField(form, "password"),
  };
  const errors: RegistrationErrors = {};
  if (!validName(data.givenNames)) errors.givenNames = "Escribe tus nombres con un máximo de 100 caracteres.";
  if (!validName(data.familyNames)) errors.familyNames = "Escribe tus apellidos con un máximo de 100 caracteres.";
  if (!isEcuadorianNationalId(data.nationalId)) errors.nationalId = "Escribe una cédula ecuatoriana válida de 10 dígitos.";
  if (!data.mobile) errors.mobile = "Escribe un número móvil local o incluye el prefijo internacional.";
  if (!normalizedEmail(data.email)) {
    errors.email = "Escribe una dirección de correo válida.";
  }
  if (!validNewPassword(data.password)) {
    errors.password = "Usa al menos 12 caracteres y una contraseña que no supere 72 bytes.";
  }
  if (readField(form, "consent") !== "demo") errors.consent = "Confirma el uso de datos ficticios para continuar.";

  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}
