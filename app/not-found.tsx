import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-bold">Página no disponible</h1>
      <p className="mt-3 text-muted">La página solicitada no está disponible en este entorno.</p>
      <Link href="/" className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand underline underline-offset-4">Volver al inicio</Link>
    </main>
  );
}
