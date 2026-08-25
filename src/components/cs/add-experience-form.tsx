"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addCustomerExperienceAction, type ActionState } from "@/lib/actions/cs";

const initialState: ActionState = {};

export function AddExperienceForm({
  customerId,
  events,
  users,
}: {
  customerId: string;
  events: { id: string; name: string }[];
  users: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addCustomerExperienceAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (events.length === 0) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[11.5px] font-medium text-brand hover:underline"
      >
        + Registrar experiência
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="customerId" value={customerId} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select name="eventId" required defaultValue="" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none">
          <option value="" disabled>Evento…</option>
          {events.map((e) => (
            <option key={e.id} value={e.id}>{e.name}</option>
          ))}
        </select>
        <input name="score" type="number" min={0} max={10} placeholder="Nota (0-10)" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
      </div>
      <textarea name="feedback" rows={2} placeholder="Feedback" className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <textarea name="positives" rows={2} placeholder="Pontos positivos" className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none" />
        <textarea name="negatives" rows={2} placeholder="Pontos negativos" className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none" />
      </div>
      <textarea name="opportunities" rows={2} placeholder="Oportunidades" className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none" />
      <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
        <input type="checkbox" name="needsFollowUp" className="accent-brand-deep" />
        Precisa de follow-up
      </label>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <select name="followUpOwnerId" defaultValue="" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none">
          <option value="">Responsável pelo follow-up…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        <input name="followUpDate" type="date" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar experiência"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
