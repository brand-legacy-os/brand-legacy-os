"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  toggleSponsorPaymentAction,
  addSponsorPaymentAction,
  type ActionState,
} from "@/lib/actions/events";
import { SPONSOR_STATUS_META } from "@/lib/events";
import { formatCompactCurrency, formatDate } from "@/lib/format";

const initialState: ActionState = {};

export function SponsorCard({
  sponsor,
  canManage,
}: {
  sponsor: {
    id: string;
    name: string;
    contractValue: number;
    status: keyof typeof SPONSOR_STATUS_META;
    payments: { id: string; dueDate: Date; amount: number; paid: boolean }[];
  };
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addSponsorPaymentAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  const paidTotal = sponsor.payments
    .filter((p) => p.paid)
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-2.5 rounded-(--radius-s) border border-border p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-ink">{sponsor.name}</span>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] text-ink-soft">
          {SPONSOR_STATUS_META[sponsor.status].label}
        </span>
      </div>
      <div className="flex items-center justify-between text-[12px] text-ink-faint">
        <span>Contrato: {formatCompactCurrency(sponsor.contractValue)}</span>
        <span>Recebido: {formatCompactCurrency(paidTotal)}</span>
      </div>

      {sponsor.payments.length > 0 && (
        <div className="flex flex-col gap-1">
          {sponsor.payments.map((p) => (
            <form key={p.id} action={toggleSponsorPaymentAction} className="flex items-center gap-2">
              <input type="hidden" name="paymentId" value={p.id} />
              <button
                type="submit"
                disabled={!canManage}
                className={`h-4 w-4 shrink-0 rounded border ${p.paid ? "border-brand-deep bg-brand-deep" : "border-border-strong"}`}
                aria-label={p.paid ? "Marcar como não pago" : "Marcar como pago"}
              />
              <span className="text-[12px] text-ink-soft">
                {formatCompactCurrency(p.amount)} · vence {formatDate(p.dueDate)}
              </span>
            </form>
          ))}
        </div>
      )}

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="sponsorId" value={sponsor.id} />
              <input
                name="dueDate"
                type="date"
                required
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
              <input
                name="amount"
                inputMode="decimal"
                placeholder="Valor"
                className="h-8 w-28 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
              <button
                type="submit"
                disabled={pending}
                className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60"
              >
                Adicionar
              </button>
              {state.error && (
                <span className="text-[11px] text-critical">{state.error}</span>
              )}
            </form>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-fit text-[11.5px] font-medium text-brand hover:underline"
            >
              + Parcela de pagamento
            </button>
          )}
        </>
      )}
    </div>
  );
}
