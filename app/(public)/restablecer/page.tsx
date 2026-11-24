import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { StorePage } from "../../../components/storefront/layout";
import { Card, TextLink } from "../../../components/ui/primitives";
import { recoveryCookieName } from "../../../lib/server/auth-cookies";
import { ResetForm } from "./reset-form";

export const metadata = { title: "Nueva contraseña" };

export default async function ResetPage() {
  if (!(await cookies()).has(recoveryCookieName)) redirect("/recuperar?enlace=invalido");
  return (
    <StorePage title="Nueva contraseña">
      <Card className="max-w-xl">
        <ResetForm />
        <TextLink className="mt-4" href="/recuperar">Solicitar otro enlace</TextLink>
      </Card>
    </StorePage>
  );
}
