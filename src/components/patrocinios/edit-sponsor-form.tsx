"use client";

import { useActionState, useState } from "react";
import { updateSponsorAction, type ActionState } from "@/lib/actions/sponsors";
import { SponsorFormFields, type SponsorDefaults } from "./sponsor-form-fields";

const initialState: ActionState = {};

export function EditSponsorForm({
  sponsorId,
  defaults,
  events,
}: {
  sponsorId: string;
  defaults: SponsorDefaults;
  events: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateSponsorAction, initialState);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[12px] font-medium text-brand hover:underline"
      >
        Editar patrocinador
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <input type="hidden" name="sponsorId" value={sponsorId} />
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-medium text-ink">Editar patrocinador</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-ink-faint hover:underline">
          Fechar
        </button>
      </div>

      <SponsorFormFields events={events} defaults={defaults} />

      <div className="flex items-center gap-2.5 border-t border-border pt-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
        {state.success && <span className="text-[12px] text-positive">Salvo.</span>}
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
