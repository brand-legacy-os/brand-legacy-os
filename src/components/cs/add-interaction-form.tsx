"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addCustomerInteractionAction, type ActionState } from "@/lib/actions/cs";
import { INTERACTION_KIND_META } from "@/lib/cs";

const initialState: ActionState = {};

export function AddInteractionForm({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addCustomerInteractionAction, initialState);
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
        + Interação / observação
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="customerId" value={customerId} />
      <select
        name="kind"
        required
        defaultValue=""
        className="h-8 w-fit rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
      >
        <option value="" disabled>Tipo…</option>
        {Object.entries(INTERACTION_KIND_META).map(([key, meta]) => (
          <option key={key} value={key}>{meta.label}</option>
        ))}
      </select>
      <textarea
        name="content"
        required
        rows={2}
        placeholder="O que aconteceu?"
        className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[12.5px] outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Registrar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
