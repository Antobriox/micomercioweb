"use client";

import { useId, useRef, type ReactNode } from "react";

import { Button } from "./primitives";

export function Dialog({ trigger, title, children }: { trigger: string; title: string; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  return (
    <>
      <Button tone="secondary" aria-haspopup="dialog" onClick={() => dialog.current?.showModal()}>
        {trigger}
      </Button>
      <dialog ref={dialog} aria-labelledby={titleId}
        className="ui-dialog m-auto max-h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl bg-white p-6 text-ink sm:p-8">
        <h2 id={titleId} className="text-2xl font-bold">{title}</h2>
        <div className="my-4 text-muted">{children}</div>
        <form method="dialog">
          <Button type="submit">Cerrar</Button>
        </form>
      </dialog>
    </>
  );
}
