"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createCsActionAction, updateCsActionAction, type ActionState } from "@/lib/actions/cs";

const initialState: ActionState = {};

type CsActionDefaults = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  link: string | null;
  materialsUrl: string | null;
  date: Date | string;
};

export function CreateCsActionForm({
  defaults,
  onDone,
}: {
  defaults?: CsActionDefaults;
  onDone?: () => void;
} = {}) {
  const isEdit = Boolean(defaults);
  const [open, setOpen] = useState(isEdit);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateCsActionAction : createCsActionAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
      onDone?.();
    }
  }, [state.success, onDone]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft">
        + Adicionar ação com mentorados
      </button>
    );
  }

  const dateValue = defaults?.date ? new Date(defaults.date).toISOString().slice(0, 10) : "";

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4">
      {isEdit && <input type="hidden" name="actionId" value={defaults!.id} />}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input name="title" required defaultValue={defaults?.title} placeholder="O que? (ex.: Live tira-dúvidas)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="date" type="date" required defaultValue={dateValue} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <textarea name="description" rows={2} defaultValue={defaults?.description ?? ""} placeholder="Como? (formato, dinâmica, roteiro)" className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none" />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input name="location" defaultValue={defaults?.location ?? ""} placeholder="Onde? (Zoom, WhatsApp, presencial…)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="link" defaultValue={defaults?.link ?? ""} placeholder="Link — https://…" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <input name="materialsUrl" defaultValue={defaults?.materialsUrl ?? ""} placeholder="Materiais adicionais — https://…" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar ação"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDone?.();
          }}
          className="text-[12.5px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
