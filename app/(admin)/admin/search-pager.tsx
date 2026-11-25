import { Button } from "../../../components/ui/primitives";

export function SearchPager({ page, hasNext, pending }: { page: number; hasNext: boolean; pending: boolean }) {
  return <div className="flex flex-wrap items-center gap-3">
    <Button type="submit" loadingLabel={pending ? "Buscando" : undefined}>Buscar</Button>
    {page > 1 && <Button type="submit" tone="secondary" name="page" value="prev" disabled={pending}>Anterior</Button>}
    {hasNext && <Button type="submit" tone="secondary" name="page" value="next" disabled={pending}>Siguiente</Button>}
  </div>;
}
