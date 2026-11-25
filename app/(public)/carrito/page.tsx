import { CartView } from "../../../components/storefront/cart-view";
import { StorePage } from "../../../components/storefront/layout";

export const metadata = { title: "Carrito" };

export default function CartPage() {
  return <StorePage title="Carrito"><CartView /></StorePage>;
}
