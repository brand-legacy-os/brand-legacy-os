"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addCashMovementAction, type ActionState } from "@/lib/actions/finance";

const initialState: ActionState = {};

export function CashMovementForm({
  events = [],
}: {
  events?: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addCashMovementAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

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
        className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft transition-opacity hover:opacity-90"
      >
        + Nova movimentação
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-wrap items-end gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Data</label>
        <input
          name="date"
          type="date"
          required
          defaultValue={today}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
      </div>
      <div className="flex min-w-[200px] flex-1 flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Descrição</label>
        <input
          name="description"
          required
          placeholder="Ex.: Reembolso, patrocínio recebido…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Tipo</label>
        <select
          name="kind"
          defaultValue="saida"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="entrada">Entrada</option>
          <option value="saida">Saída</option>
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-ink-faint">Valor</label>
        <input
          name="amount"
          inputMode="decimal"
          required
          placeholder="0"
          className="h-9 w-28 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      {events.length > 0 && (
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Evento (opcional)</label>
          <select
            name="eventId"
            defaultValue=""
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          >
            <option value="">Sem evento vinculado</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Registrar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-[12.5px] text-ink-faint hover:underline"
      >
        Cancelar
      </button>
      {state.error && (
        <p className="w-full text-[12px] text-critical">{state.error}</p>
      )}
    </form>
  );
}
