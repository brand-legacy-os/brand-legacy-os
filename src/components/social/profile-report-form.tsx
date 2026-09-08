"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addProfileReportAction, updateProfileReportAction, type ActionState } from "@/lib/actions/social";

const initialState: ActionState = {};

type ReportDefaults = {
  id: string;
  title: string;
  reportMonth: string;
  dueDate: Date | string | null;
  periodAnalyzed: string | null;
  summary: string | null;
  notes: string | null;
};

export function ProfileReportForm({
  profileId,
  defaults,
  onDone,
}: {
  profileId: string;
  defaults?: ReportDefaults;
  onDone?: () => void;
}) {
  const isEdit = Boolean(defaults);
  const [open, setOpen] = useState(isEdit);
  const [state, formAction, pending] = useActionState(
    isEdit ? updateProfileReportAction : addProfileReportAction,
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
      <button onClick={() => setOpen(true)} className="w-fit text-[12px] font-medium text-brand hover:underline">
        + Novo relatório
      </button>
    );
  }

  const dueDateValue = defaults?.dueDate ? new Date(defaults.dueDate).toISOString().slice(0, 10) : "";

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="profileId" value={profileId} />
      {isEdit && <input type="hidden" name="reportId" value={defaults!.id} />}
      <input
        name="title"
        required
        defaultValue={defaults?.title}
        placeholder="Título (ex.: Relatório mensal — Agosto 2026)"
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-ink-faint">Mês de referência</span>
          <input
            name="reportMonth"
            type="month"
            required
            defaultValue={defaults?.reportMonth}
            className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-ink-faint">Data de entrega</span>
          <input
            name="dueDate"
            type="date"
            defaultValue={dueDateValue}
            className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-ink-faint">Período analisado</span>
          <input
            name="periodAnalyzed"
            defaultValue={defaults?.periodAnalyzed ?? ""}
            placeholder="ex.: 01/08 a 31/08"
            className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-[10.5px] text-ink-faint">
          Análise resumida — traga os principais pontos de atenção, o que funcionou, o que não funcionou e
          sugestões pro próximo período
        </span>
        <textarea
          name="summary"
          rows={3}
          defaultValue={defaults?.summary ?? ""}
          className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12.5px] outline-none"
        />
      </label>
      <textarea
        name="notes"
        rows={2}
        placeholder="Observações (opcional)"
        defaultValue={defaults?.notes ?? ""}
        className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12.5px] outline-none"
      />
      <div className="flex items-center gap-2.5">
        <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Criar relatório"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDone?.();
          }}
          className="text-[11.5px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
