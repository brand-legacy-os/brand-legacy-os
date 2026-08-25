"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addCustomerRenewalAction, updateCustomerRenewalAction, type ActionState } from "@/lib/actions/cs";
import { RENEWAL_STATUS_META } from "@/lib/cs";
import { formatCompactCurrency, formatDate } from "@/lib/format";

const initialState: ActionState = {};

type Renewal = {
  id: string;
  dueDate: Date;
  plannedValue: number;
  realizedValue: number | null;
  status: "disponivel" | "renovado" | "perdido" | "renegociando";
};

export function RenewalSection({ customerId, renewals }: { customerId: string; renewals: Renewal[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addCustomerRenewalAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <div className="flex flex-col gap-2.5">
      {renewals.map((r) => (
        <RenewalRow key={r.id} renewal={r} />
      ))}
      {renewals.length === 0 && (
        <p className="text-[12.5px] text-ink-faint">Nenhuma renovação registrada ainda.</p>
      )}

      {open ? (
        <form ref={ref} action={formAction} className="flex flex-wrap items-end gap-2 rounded-(--radius-s) bg-surface-muted p-3">
          <input type="hidden" name="customerId" value={customerId} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">Data prevista</label>
            <input name="dueDate" type="date" required className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">Valor disponível</label>
            <input name="plannedValue" inputMode="decimal" required placeholder="R$" className="h-8 w-32 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
          </div>
          <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
            {pending ? "Salvando…" : "Adicionar"}
          </button>
          <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
            Cancelar
          </button>
          {state.error && <span className="w-full text-[11px] text-critical">{state.error}</span>}
        </form>
      ) : (
        <button onClick={() => setOpen(true)} className="w-fit text-[11.5px] font-medium text-brand hover:underline">
          + Registrar renovação
        </button>
      )}
    </div>
  );
}

function RenewalRow({ renewal }: { renewal: Renewal }) {
  const [state, formAction, pending] = useActionState(updateCustomerRenewalAction, initialState);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 rounded-(--radius-s) border border-border p-2.5">
      <input type="hidden" name="renewalId" value={renewal.id} />
      <span className="text-[12.5px] text-ink">{formatDate(renewal.dueDate)}</span>
      <span className="tnum text-[12.5px] text-ink-soft">
        {formatCompactCurrency(renewal.realizedValue ?? 0)} / {formatCompactCurrency(renewal.plannedValue)}
      </span>
      <select
        name="status"
        defaultValue={renewal.status}
        className="h-7 rounded-full border border-border bg-surface px-2 text-[11.5px] outline-none"
      >
        {Object.entries(RENEWAL_STATUS_META).map(([key, meta]) => (
          <option key={key} value={key}>{meta.label}</option>
        ))}
      </select>
      <input
        name="realizedValue"
        inputMode="decimal"
        defaultValue={renewal.realizedValue ?? ""}
        placeholder="Valor realizado"
        className="h-7 w-28 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none"
      />
      <button type="submit" disabled={pending} className="h-7 rounded-(--radius-s) bg-surface-muted px-2.5 text-[11px] font-medium text-ink-soft hover:bg-border-strong/30">
        {pending ? "…" : "Salvar"}
      </button>
      {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
    </form>
  );
}
