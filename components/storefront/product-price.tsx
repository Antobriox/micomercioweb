import { formatMoney } from "../../lib/commercial/catalog";
import type { Variant } from "../../lib/commercial/contracts";
import { variantPricing } from "../../lib/commercial/pricing";

const date = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium", timeStyle: "short", timeZone: "America/Guayaquil",
});

export function ProductPrice({ variant, details = false, className = "" }: {
  variant?: Variant; details?: boolean; className?: string;
}) {
  const { current, offer } = variantPricing(variant);
  return (
    <div className={className}>
      {offer?.previous && <p className="text-sm text-muted">
        <span>Antes </span><del>{formatMoney(offer.previous)}</del>
      </p>}
      <p className="font-extrabold">{offer ? <span className="sr-only">Oferta </span> : null}{formatMoney(current)}</p>
      {!!offer?.percentage && <p className="text-sm font-semibold text-accent">{offer.percentage} % de descuento</p>}
      {details && offer && <div className="mt-1 space-y-1 text-sm text-muted">
        <p>Desde <time dateTime={offer.startsAt}>{date.format(new Date(offer.startsAt))}</time></p>
        {offer.endsAt && <p>Hasta <time dateTime={offer.endsAt}>{date.format(new Date(offer.endsAt))}</time></p>}
        {offer.conditions && <p>{offer.conditions}</p>}
      </div>}
    </div>
  );
}
