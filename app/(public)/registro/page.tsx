import { StorePage } from "../../../components/storefront/layout";
import { Card } from "../../../components/ui/primitives";
import { RegistrationForm } from "./registration-form";

export const metadata = { title: "Registro" };

export default function RegistrationPage() {
  return (
    <StorePage title="Registro">
      <Card className="max-w-xl"><RegistrationForm /></Card>
    </StorePage>
  );
}
