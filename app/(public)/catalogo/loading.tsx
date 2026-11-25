import { StorePage } from "../../../components/storefront/layout";
import { LoadingState } from "../../../components/ui/primitives";

export default function LoadingCatalog() {
  return <StorePage title="Catálogo"><LoadingState label="Cargando catálogo" /></StorePage>;
}
