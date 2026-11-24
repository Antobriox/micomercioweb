import { StorePage } from "../../../components/storefront/layout";
import { Card, Notice, TextLink } from "../../../components/ui/primitives";
import { RecoveryForm } from "./recovery-form";

export const metadata = { title: "Recuperar contraseña" };

export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ enlace?: string }> }) {
  const { enlace } = await searchParams;
  return (
    <StorePage title="Recuperar contraseña">
      <Card className="max-w-xl space-y-4">
        {enlace === "invalido" && <Notice tone="warning">Este enlace venció o debe abrirse en el navegador donde lo solicitaste.</Notice>}
        <RecoveryForm />
        <TextLink href="/acceso">Volver al acceso</TextLink>
      </Card>
    </StorePage>
  );
}
