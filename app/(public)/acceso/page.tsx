import { redirect } from "next/navigation";

import { StorePage } from "../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../components/ui/primitives";
import { loginDestination } from "../../../lib/account/credentials";
import { getCurrentAccount } from "../../../lib/server/account";
import { LoginForm } from "./login-form";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ volver?: string; restablecida?: string }> }) {
  const { volver, restablecida } = await searchParams;
  const destination = loginDestination(volver);
  if (await getCurrentAccount()) redirect(destination);

  return (
    <StorePage title="Iniciar sesión">
      <Card className="max-w-xl">
        {restablecida === "1" && <div className="mb-4"><Notice tone="success">Contraseña actualizada. Inicia sesión con la nueva contraseña.</Notice></div>}
        <LoginForm destination={destination} />
        <div className="mt-5 flex flex-wrap gap-x-5">
          <TextLink href="/recuperar">Recuperar contraseña</TextLink>
          <TextLink href="/registro">Crear cuenta de prueba</TextLink>
          <TextLink href="/verificar">Verificar correo</TextLink>
        </div>
      </Card>
    </StorePage>
  );
}
