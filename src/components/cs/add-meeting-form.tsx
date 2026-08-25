"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addCustomerMeetingAction, type ActionState } from "@/lib/actions/cs";

const initialState: ActionState = {};

export function AddMeetingForm({
  customerId,
  labelSuggestions,
}: {
  customerId: string;
  labelSuggestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addCustomerMeetingAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-fit text-[11.5px] font-medium text-brand hover:underline">
        + Registrar encontro (transcrição/gravação)
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select name="type" defaultValue="individual" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none">
          <option value="individual">Individual</option>
          <option value="coletivo">Coletivo</option>
        </select>
        <input
          name="label"
          list="meeting-label-suggestions"
          placeholder="Nome do encontro (ex.: Diagnóstico)"
          className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
        />
        <datalist id="meeting-label-suggestions">
          {labelSuggestions.map((l) => <option key={l} value={l} />)}
        </datalist>
        <input name="date" type="date" required className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
      </div>
      <textarea name="transcript" rows={3} placeholder="Transcrição da reunião" className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none" />
      <input name="recordingUrl" placeholder="Link da gravação — https://…" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
      <textarea name="notes" rows={2} placeholder="Observações sobre o encontro (opcional)" className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Registrar encontro"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
