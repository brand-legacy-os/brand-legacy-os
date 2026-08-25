"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addSponsorAction, type ActionState } from "@/lib/actions/events";
import { SPONSOR_STATUS_META } from "@/lib/events";

const initialState: ActionState = {};

export function AddSponsorForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addSponsorAction,
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
        + Patrocinador
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
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input
          name="name"
          required
          placeholder="Nome do patrocinador"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="contractValue"
          inputMode="decimal"
          placeholder="Valor do contrato (R$)"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <select
          name="status"
          defaultValue="negociacao"
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        >
          {Object.entries(SPONSOR_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
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
