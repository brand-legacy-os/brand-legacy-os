"use client";

import { useState, type ReactNode } from "react";

/** Seção de card com título + toggle "ver mais/ver menos" — usado nas listas
 * longas da página de evento (confirmados, orçamento, patrocínio, jantar,
 * comunicação) pra não ficarem todas sempre abertas. */
export function CollapsibleSection({
  title,
  right,
  defaultOpen = false,
  children,
}: {
  title: ReactNode;
  right?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-left"
        >
          <span className="text-[13px] font-medium text-ink-soft">{title}</span>
          <span className="text-[11px] font-medium text-brand hover:underline">
            {open ? "ver menos" : "ver mais"}
          </span>
        </button>
        {right}
      </div>
      {open && children}
    </section>
  );
}
