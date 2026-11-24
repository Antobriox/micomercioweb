"use client";

import { Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";

import { mainNavigation } from "../../lib/navigation";

export function MobileNavigation() {
  const path = usePathname();
  const details = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);

  function close() {
    if (details.current) details.current.open = false;
    summary.current?.focus();
  }

  return (
    <details ref={details} className="relative lg:hidden"
      onKeyDown={(event) => {
        if (event.key === "Escape" && details.current?.open) {
          event.preventDefault();
          close();
        }
      }}>
      <summary ref={summary} className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-xl text-brand [&::-webkit-details-marker]:hidden">
        <Menu size={22} aria-hidden="true" />
        <span className="sr-only">Menú principal</span>
      </summary>
      <nav aria-label="Menú móvil" className="absolute top-full left-0 w-48 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
        {mainNavigation.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={path === href ? "page" : undefined}
            onClick={close} className="flex min-h-11 items-center rounded-lg px-3 font-semibold text-brand hover:bg-canvas aria-[current=page]:bg-canvas">
            {label}
          </Link>
        ))}
      </nav>
    </details>
  );
}
