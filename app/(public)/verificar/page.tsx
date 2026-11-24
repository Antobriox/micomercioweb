import { StorePage } from "../../../components/storefront/layout";
import { Card } from "../../../components/ui/primitives";
import { VerificationForm } from "./verification-form";

export const metadata = { title: "Verificar correo" };

export default function VerificationPage() {
  return (
    <StorePage title="Verificar correo">
      <Card className="max-w-xl"><VerificationForm /></Card>
    </StorePage>
  );
}
