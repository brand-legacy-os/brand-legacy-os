"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addBudgetLineAction, type ActionState } from "@/lib/actions/events";
import { BUDGET_LINE_STATUS_OPTIONS } from "@/lib/events";

const initialState: ActionState = {};

export function AddBudgetLineForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addBudgetLineAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[12.5px] font-medium text-brand hover:underline"
      >
        + Item de orçamento
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-s) bg-surface-muted p-3"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input
          name="category"
          placeholder="Categoria"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="item"
          required
          placeholder="O que (item)"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none sm:col-span-2"
        />
        <input
          name="supplier"
          placeholder="Fornecedor"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="description"
          placeholder="Descrição (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none sm:col-span-4"
        />
        <input
          name="plannedValue"
          inputMode="decimal"
          placeholder="Previsto (R$)"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="actualValue"
          inputMode="decimal"
          placeholder="Valor (R$)"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="paymentMethod"
          placeholder="Forma de pagamento"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <select
          name="status"
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        >
          <option value="">Status…</option>
          {BUDGET_LINE_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12px] text-ink-faint hover:underline"
        >
          Fechar
        </button>
        {state.error && (
          <span className="text-[11.5px] text-critical">{state.error}</span>
        )}
      </div>
    </form>
  );
}
