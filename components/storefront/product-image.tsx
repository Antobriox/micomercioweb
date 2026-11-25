import { Package } from "lucide-react";
import Image from "next/image";

import type { CatalogPhoto } from "../../lib/commercial/demo-editorial";

export function ProductImage({ photo, sizes }: { photo?: CatalogPhoto; sizes: string }) {
  return (
    <div className="relative grid aspect-square place-items-center overflow-hidden rounded-xl bg-canvas">
      {photo ? <Image src={photo.src} alt={photo.alt} fill sizes={sizes} className="object-contain" /> :
        <div className="grid gap-2 p-4 text-center text-sm text-muted">
          <Package className="mx-auto" aria-hidden="true" />
          <span>Sin foto disponible</span>
        </div>}
    </div>
  );
}
