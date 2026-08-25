"use client";

import { useActionState, useRef, useEffect } from "react";
import { addKpiEntryAction, type AddKpiEntryState } from "@/lib/actions/kpis";

const initialState: AddKpiEntryState = {};

export function KpiEntryForm({ kpiId, unit }: { kpiId: string; unit: string }) {
  const [state, formAction, pending] = useActionState(
    addKpiEntryAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-2.5 rounded-(--radius-s) bg-surface-muted p-3"
    >
      <input type="hidden" name="kpiId" value={kpiId} />
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Valor ({unit})</label>
        <input
          name="value"
          type="text"
          inputMode="decimal"
          required
          placeholder="0"
          className="h-9 w-28 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Data</label>
        <input
          name="date"
          type="date"
          defaultValue={today}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <div className="flex min-w-[160px] flex-1 flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Observação (opcional)</label>
        <input
          name="note"
          type="text"
          placeholder="Contexto do número de hoje…"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Registrar"}
      </button>
      {state.error && (
        <p className="w-full text-[12px] text-critical">{state.error}</p>
      )}
    </form>
  );
}
