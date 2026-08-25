"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  toggleBudgetLinePaymentAction,
  addBudgetLinePaymentAction,
  type ActionState,
} from "@/lib/actions/events";
import { budgetLineStatusTone } from "@/lib/events";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCompactCurrency, formatDate } from "@/lib/format";

const initialState: ActionState = {};

export function BudgetLineCard({
  line,
  canManage,
}: {
  line: {
    id: string;
    category: string;
    item: string;
    description: string | null;
    supplier: string | null;
    paymentMethod: string | null;
    status: string | null;
    plannedValue: number;
    actualValue: number | null;
    payments: { id: string; dueDate: Date; amount: number; paid: boolean }[];
  };
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addBudgetLinePaymentAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  const paidTotal = line.payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
  const scheduledTotal = line.payments.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-2 border-t border-border py-2.5 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[12.5px] font-medium text-ink">{line.item}</span>
          <span className="text-[11px] text-ink-faint">
            {line.category}
            {line.supplier ? ` · ${line.supplier}` : ""}
            {line.paymentMethod ? ` · ${line.paymentMethod}` : ""}
          </span>
        </div>
        <span className="tnum whitespace-nowrap text-[12.5px] text-ink-soft">
          {formatCompactCurrency(line.actualValue ?? 0)} /{" "}
          {formatCompactCurrency(line.plannedValue)}
        </span>
      </div>

      {line.description && (
        <p className="text-[11.5px] text-ink-soft">{line.description}</p>
      )}
      {line.status && (
        <StatusPill label={line.status} tone={budgetLineStatusTone(line.status)} />
      )}

      {line.payments.length > 0 && (
        <div className="flex flex-col gap-1 rounded-(--radius-s) bg-surface-muted p-2">
          <div className="flex items-center justify-between text-[11px] text-ink-faint">
            <span>Parcelas ({line.payments.length})</span>
            <span className="tnum">
              pago {formatCompactCurrency(paidTotal)} / {formatCompactCurrency(scheduledTotal)}
            </span>
          </div>
          {line.payments.map((p) => (
            <form
              key={p.id}
              action={toggleBudgetLinePaymentAction}
              className="flex items-center gap-2"
            >
              <input type="hidden" name="paymentId" value={p.id} />
              <button
                type="submit"
                disabled={!canManage}
                className={`h-4 w-4 shrink-0 rounded border ${p.paid ? "border-brand-deep bg-brand-deep" : "border-border-strong"}`}
                aria-label={p.paid ? "Marcar como não pago" : "Marcar como pago"}
              />
              <span className="text-[12px] text-ink-soft">
                {formatCompactCurrency(p.amount)} · {p.paid ? "pago" : "vence"}{" "}
                {formatDate(p.dueDate)}
              </span>
            </form>
          ))}
        </div>
      )}

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="budgetLineId" value={line.id} />
              <input
                name="dueDate"
                type="date"
                required
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
              <input
                name="amount"
                inputMode="decimal"
                placeholder="Valor da parcela"
                required
                className="h-8 w-32 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
              <button
                type="submit"
                disabled={pending}
                className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11.5px] text-ink-faint hover:underline"
              >
                Fechar
              </button>
              {state.error && (
                <span className="w-full text-[11px] text-critical">{state.error}</span>
              )}
            </form>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-fit text-[11.5px] font-medium text-brand hover:underline"
            >
              + Parcela (à vista = 1 parcela, parcelado = várias)
            </button>
          )}
        </>
      )}
    </div>
  );
}
