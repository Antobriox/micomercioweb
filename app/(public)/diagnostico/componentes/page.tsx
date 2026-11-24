import { Dialog } from "../../../../components/ui/dialog";
import { Button, Card, EmptyState, Field, LoadingState, Notice, TextLink } from "../../../../components/ui/primitives";

export const metadata = { title: "Componentes de prueba" };

export default function ComponentGallery() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-extrabold sm:text-5xl">Componentes de prueba</h1>
      <p className="my-4 text-muted">Los controles de esta vista muestran estados del sistema de diseño.</p>
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-xl font-bold">Acciones</h2>
          <div className="flex flex-wrap gap-3">
            <Button>Principal</Button>
            <Button tone="secondary">Secundaria</Button>
            <Button tone="danger">Peligro</Button>
            <Button disabled>Deshabilitada</Button>
            <Button loadingLabel="Cargando acción">Procesar</Button>
            <Dialog trigger="Abrir diálogo" title="Diálogo de prueba">
              <p>Esta vista permite comprobar el foco y el cierre con teclado.</p>
            </Dialog>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-bold">Campos</h2>
          <div className="space-y-4">
            <Field id="sample-label" label="Nombre de ejemplo" hint="Escribe un nombre de prueba." required />
            <Field id="sample-error" label="Correo de ejemplo" type="email" defaultValue="prueba"
              error="Escribe un correo con un dominio válido." />
            <Field id="sample-disabled" label="Campo deshabilitado" disabled />
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-bold">Mensajes</h2>
          <div className="space-y-3">
            <Notice>Información de prueba.</Notice>
            <Notice tone="success">Prueba completada.</Notice>
            <Notice tone="warning">Advertencia de prueba.</Notice>
            <Notice tone="error">Error de prueba.</Notice>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-xl font-bold">Carga</h2>
          <LoadingState label="Cargando resultados de prueba" />
        </Card>
        <EmptyState title="Sin resultados de prueba"><p>Prueba una consulta diferente.</p></EmptyState>
      </div>
      <TextLink className="mt-4" href="/diagnostico">Volver al diagnóstico</TextLink>
    </main>
  );
}
