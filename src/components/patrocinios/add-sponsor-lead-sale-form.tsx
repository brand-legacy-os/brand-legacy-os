"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addSponsorLeadSaleAction, type ActionState } from "@/lib/actions/sponsors";

const initialState: ActionState = {};

export function AddSponsorLeadSaleForm({ sponsorId }: { sponsorId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addSponsorLeadSaleAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-8 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-ink-soft hover:bg-surface-muted"
      >
        + Venda originada deste patrocinador
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="sponsorId" value={sponsorId} />
      <div className="flex flex-wrap gap-2">
        <input
          name="description"
          placeholder="Descrição (opcional)"
          className="h-8 flex-1 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="value"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="Valor"
          className="h-8 w-32 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="saleDate"
          type="date"
          className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Registrar venda"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
