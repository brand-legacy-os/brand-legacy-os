"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createCsActionAction, type ActionState } from "@/lib/actions/cs";

const initialState: ActionState = {};

export function CreateCsActionForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCsActionAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft">
        + Adicionar ação com mentorados
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input name="title" required placeholder="O que? (ex.: Live tira-dúvidas)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="date" type="date" required className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <textarea name="description" rows={2} placeholder="Como? (formato, dinâmica, roteiro)" className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input name="location" placeholder="Onde? (Zoom, WhatsApp, presencial…)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="link" placeholder="Link — https://…" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <input name="materialsUrl" placeholder="Materiais adicionais — https://…" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Adicionar ação"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
