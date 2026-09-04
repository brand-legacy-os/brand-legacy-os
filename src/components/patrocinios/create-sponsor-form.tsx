"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createSponsorAction, type ActionState } from "@/lib/actions/sponsors";
import { SponsorFormFields } from "./sponsor-form-fields";

const initialState: ActionState = {};

export function CreateSponsorForm({
  events,
}: {
  events: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createSponsorAction, initialState);
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
        className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft"
      >
        + Adicionar patrocinador
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-4 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-medium text-ink">Novo patrocinador</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-ink-faint hover:underline">
          Fechar
        </button>
      </div>

      <SponsorFormFields events={events} />

      <div className="flex items-center gap-2.5 border-t border-border pt-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar patrocinador"}
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
