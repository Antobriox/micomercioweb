import { StorePage, StoreFooter, StoreHeader } from "../../../components/storefront/layout";
import { Button, Card, Notice, TextLink } from "../../../components/ui/primitives";
import { requireAccount } from "../../../lib/server/account";
import { logOut } from "../../(public)/acceso/actions";
import { ContactForm, EmailChangeForm, PasswordChangeForm } from "./profile-forms";

export const metadata = { title: "Mi cuenta" };

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ correo?: string }> }) {
  const account = await requireAccount();
  const { correo } = await searchParams;
  const { data: profile, error } = await account.client.from("profiles")
    .select("given_names,family_names,national_id,mobile,email,updated_at")
    .eq("user_id", account.id).maybeSingle();

  return (
    <>
      <StoreHeader />
      <div id="contenido" tabIndex={-1} className="scroll-mt-32">
        <StorePage title="Mi cuenta">
          {correo === "confirmado" && <div className="mb-4"><Notice tone="success">La confirmación del correo se registró. El perfil muestra la dirección vigente.</Notice></div>}
          {correo === "pendiente" && <div className="mb-4"><Notice>Si el cambio está pendiente, confirma también el segundo enlace recibido.</Notice></div>}
          {correo === "invalido" && <div className="mb-4"><Notice tone="warning">El enlace venció o se abrió desde otro navegador.</Notice></div>}
          {error || !profile ? (
            <Notice tone="error">No pudimos consultar el perfil. Vuelve a cargar la página.</Notice>
          ) : (
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <Card>
                <h2 className="mb-4 text-xl font-bold">Datos de contacto</h2>
                <ContactForm names={profile.given_names} surnames={profile.family_names}
                  mobile={profile.mobile} version={profile.updated_at} />
              </Card>
              <Card>
                <h2 className="mb-4 text-xl font-bold">Seguridad de la cuenta</h2>
                <dl className="space-y-3">
                  <div><dt className="font-semibold">Cédula ecuatoriana</dt><dd>{profile.national_id}</dd></div>
                  <div><dt className="font-semibold">Correo verificado</dt><dd className="break-all">{profile.email}</dd></div>
                </dl>
                <details className="mt-4 border-t border-slate-200">
                  <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-brand underline">Cambiar correo</summary>
                  <EmailChangeForm />
                </details>
                <details className="border-t border-slate-200">
                  <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-brand underline">Cambiar contraseña</summary>
                  <PasswordChangeForm />
                </details>
              </Card>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-x-5">
            <TextLink href="/carrito">Ver carrito</TextLink>
            <TextLink href="/cuenta/favoritos">Favoritos</TextLink>
            <TextLink href="/privacidad">Privacidad</TextLink>
            <form action={logOut}><Button type="submit" tone="secondary">Cerrar sesión</Button></form>
          </div>
        </StorePage>
      </div>
      <StoreFooter />
    </>
  );
}
