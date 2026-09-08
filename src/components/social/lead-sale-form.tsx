"use client";

import { useActionState, useEffect } from "react";
import { updateSocialLeadSaleAction, type ActionState } from "@/lib/actions/social";
import { SOCIAL_SALE_PRODUCTS } from "@/lib/social";

const initialState: ActionState = {};

export function LeadSaleForm({
  leadId,
  defaults,
  onDone,
}: {
  leadId: string;
  defaults: { saleProduct: string | null; saleValue: number | null; saleDate: Date | string | null };
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateSocialLeadSaleAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  const dateValue = defaults.saleDate ? new Date(defaults.saleDate).toISOString().slice(0, 10) : "";

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 rounded-(--radius-s) bg-surface-muted p-2.5">
      <input type="hidden" name="leadId" value={leadId} />
      <select
        name="saleProduct"
        defaultValue={defaults.saleProduct ?? ""}
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
      >
        <option value="">Produto vendido…</option>
        {SOCIAL_SALE_PRODUCTS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        name="saleValue"
        type="number"
        step="0.01"
        min="0"
        placeholder="Valor"
        defaultValue={defaults.saleValue ?? ""}
        className="h-8 w-28 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
      />
      <input
        name="saleDate"
        type="date"
        defaultValue={dateValue}
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
      />
      <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60">
        {pending ? "Salvando…" : "Salvar"}
      </button>
      <button type="button" onClick={onDone} className="text-[11px] text-ink-faint hover:underline">
        cancelar
      </button>
      {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
    </form>
  );
}
