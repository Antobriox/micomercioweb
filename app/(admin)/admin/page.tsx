import { StorePage } from "../../../components/storefront/layout";
import { Button, Card, Notice } from "../../../components/ui/primitives";
import { logOut } from "../../(public)/acceso/actions";

export default function AdminPage() {
  return (
    <StorePage title="Administración">
      <Card className="max-w-xl space-y-4">
        <Notice>Sesión de administración de prueba.</Notice>
        <form action={logOut}><Button type="submit" tone="secondary">Cerrar sesión</Button></form>
      </Card>
    </StorePage>
  );
}
