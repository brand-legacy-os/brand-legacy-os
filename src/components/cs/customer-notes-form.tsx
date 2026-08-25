"use client";

import { useActionState, useEffect, useState } from "react";
import { updateCustomerNotesAction, type ActionState } from "@/lib/actions/cs";

const initialState: ActionState = {};

export function CustomerNotesForm({ customerId, notes }: { customerId: string; notes: string | null }) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(updateCustomerNotesAction, initialState);

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  if (!editing) {
    return (
      <div className="flex flex-col gap-1.5 rounded-(--radius-l) border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">Observações sobre o mentorado</h2>
          <button onClick={() => setEditing(true)} className="text-[11.5px] font-medium text-brand hover:underline">
            {notes ? "Editar" : "+ Adicionar"}
          </button>
        </div>
        <p className="text-[13px] text-ink-soft whitespace-pre-line">
          {notes || "Nenhuma observação registrada ainda."}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
      <h2 className="text-[13px] font-medium text-ink-soft">Observações sobre o mentorado</h2>
      <input type="hidden" name="customerId" value={customerId} />
      <textarea
        name="notes"
        defaultValue={notes ?? ""}
        rows={4}
        placeholder="Contexto, particularidades, combinados com o mentorado…"
        className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={() => setEditing(false)} className="text-[12px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
