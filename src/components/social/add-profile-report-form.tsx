"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addProfileReportAction, type ActionState } from "@/lib/actions/social";

const initialState: ActionState = {};

export function AddProfileReportForm({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addProfileReportAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-fit text-[12px] font-medium text-brand hover:underline">
        + Novo relatório
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="profileId" value={profileId} />
      <input
        name="title"
        required
        placeholder="Título (ex.: Relatório mensal — Agosto 2026)"
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-ink-faint">Upload (PDF ou imagem)</span>
          <input name="file" type="file" accept="image/*,application/pdf" className="text-[12px]" />
        </label>
        <input
          name="externalUrl"
          placeholder="ou link externo (opcional)"
          className="h-8 self-end rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
      </div>
      <textarea
        name="notes"
        rows={2}
        placeholder="Observações (opcional)"
        className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12.5px] outline-none"
      />
      <div className="flex items-center gap-2.5">
        <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Adicionar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
