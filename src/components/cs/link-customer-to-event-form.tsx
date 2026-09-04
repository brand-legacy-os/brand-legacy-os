"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addAttendeeAction, type ActionState } from "@/lib/actions/events";
import { AttendeeFormFields } from "@/components/events/attendee-form-fields";

const initialState: ActionState = {};

export function LinkCustomerToEventForm({
  customerId,
  customerName,
  customerCompany,
  events,
}: {
  customerId: string;
  customerName: string;
  customerCompany: string | null;
  events: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState("");
  const [state, formAction, pending] = useActionState(addAttendeeAction, initialState);
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
        className="w-fit text-[12px] font-medium text-brand hover:underline"
      >
        + Vincular a evento
      </button>
    );
  }

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="customerId" value={customerId} />
      <select
        name="eventId"
        required
        value={eventId}
        onChange={(e) => setEventId(e.target.value)}
        className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
      >
        <option value="" disabled>
          Selecione o evento…
        </option>
        {events.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>
      <AttendeeFormFields defaults={{ name: customerName, empresa: customerCompany, category: "membro_club" }} />
      <div className="flex items-center gap-2.5">
        <button
          type="submit"
          disabled={pending || !eventId}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Vincular"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
