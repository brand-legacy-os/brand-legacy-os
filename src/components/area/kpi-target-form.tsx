"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { setKpiTargetAction, type SetKpiTargetState } from "@/lib/actions/kpis";

const initialState: SetKpiTargetState = {};

export function KpiTargetForm({ kpiId }: { kpiId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    setKpiTargetAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const currentMonth = new Date().toISOString().slice(0, 7);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[11.5px] font-medium text-brand hover:underline"
      >
        + Definir meta do mês
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-2.5 rounded-(--radius-s) border border-dashed border-border-strong bg-canvas p-3"
    >
      <input type="hidden" name="kpiId" value={kpiId} />
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Mês</label>
        <input
          name="periodKey"
          type="month"
          required
          defaultValue={currentMonth}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Meta</label>
        <input
          name="target"
          type="text"
          inputMode="decimal"
          required
          placeholder="0"
          className="h-9 w-32 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Salvar meta"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-[12px] text-ink-faint hover:underline"
      >
        Cancelar
      </button>
      {state.error && (
        <p className="w-full text-[12px] text-critical">{state.error}</p>
      )}
    </form>
  );
}
