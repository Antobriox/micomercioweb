import "server-only";

export function getDeploymentEnvironment() {
  switch (process.env.VERCEL_ENV) {
    case "preview":
      return { label: "Vista previa", kind: "preview" } as const;
    case "production":
      return { label: "Producción técnica", kind: "production" } as const;
    default:
      return { label: "Local", kind: "local" } as const;
  }
}

export const operation = {
  label: "Modo demostración",
  realOrdersEnabled: false,
} as const;
