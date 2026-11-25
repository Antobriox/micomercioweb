"use client";

import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

interface Suggestion {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: string;
  photo?: string;
}

export function SearchBox() {
  const router = useRouter();
  const id = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [result, setResult] = useState<{ term: string; options: Suggestion[] } | null>(null);
  const term = value.trim();
  const suggestions = result?.term === term ? result.options : [];
  const expanded = open && suggestions.length > 0;

  useEffect(() => {
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/catalogo/sugerencias?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const options: Suggestion[] = response.ok ? await response.json() : [];
        if (!controller.signal.aborted) setResult({ term, options });
      } catch {
        if (!controller.signal.aborted) setResult({ term, options: [] });
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [term]);

  function choose(suggestion: Suggestion) {
    setOpen(false);
    setActive(-1);
    router.push(`/producto/${encodeURIComponent(suggestion.slug)}`);
  }

  return (
    <form action="/buscar" role="search" aria-label="Catálogo" className="relative col-span-3 flex items-center gap-1 rounded-xl border border-border bg-white px-2 lg:col-span-1 lg:col-start-2 lg:row-start-1"
      onSubmit={(event) => {
        if (expanded && suggestions[active]) {
          event.preventDefault();
          choose(suggestions[active]);
        }
        setOpen(false);
      }}>
      <label htmlFor={id} className="sr-only">Buscar productos</label>
      <input id={id} role="combobox" type="search" name="q" placeholder="Buscar productos" maxLength={100} autoComplete="off"
        aria-autocomplete="list" aria-expanded={expanded} aria-controls={expanded ? `${id}-options` : undefined}
        aria-activedescendant={expanded && suggestions[active] ? `${id}-option-${active}` : undefined}
        className="min-h-11 min-w-0 flex-1 rounded-lg bg-transparent px-2"
        value={value}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); setActive(-1); }}
        onChange={(event) => { setValue(event.target.value); setActive(-1); setOpen(true); }}
        onKeyDown={(event) => {
          if (event.key === "Escape" && expanded) {
            event.preventDefault();
            setOpen(false);
            setActive(-1);
          }
          if (suggestions.length && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            setOpen(true);
            setActive((current) => event.key === "ArrowDown"
              ? (current + 1) % suggestions.length
              : (current <= 0 ? suggestions.length - 1 : current - 1));
          }
        }} />
      <button type="submit" aria-label="Buscar" className="grid min-h-11 min-w-11 place-items-center rounded-lg text-brand hover:bg-canvas"
        onPointerDown={() => setActive(-1)}>
        <Search size={20} aria-hidden="true" />
      </button>
      {expanded && <ul id={`${id}-options`} role="listbox" aria-label="Sugerencias"
        className="absolute inset-x-0 top-full z-50 mt-2 grid gap-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
        {suggestions.map((suggestion, index) => (
          <li key={suggestion.id} role="presentation">
            <button type="button" id={`${id}-option-${index}`} role="option" tabIndex={-1} aria-selected={active === index}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-canvas aria-selected:bg-canvas"
              onPointerDown={(event) => event.preventDefault()} onClick={() => choose(suggestion)}>
              {suggestion.photo ? <Image src={suggestion.photo} width={40} height={40} alt="" className="size-10 rounded-md object-cover" /> :
                <span className="size-10 shrink-0 rounded-md bg-canvas" aria-hidden="true" />}
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{suggestion.name}</span>
                <span className="block text-xs text-muted">{suggestion.brand}</span>
              </span>
              <span className="text-sm font-semibold">{suggestion.price}</span>
            </button>
          </li>
        ))}
      </ul>}
    </form>
  );
}
