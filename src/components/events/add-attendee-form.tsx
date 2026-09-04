"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addAttendeeAction, type ActionState } from "@/lib/actions/events";
import { AttendeeFormFields } from "./attendee-form-fields";

const initialState: ActionState = {};

export function AddAttendeeForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    addAttendeeAction,
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
        + Confirmado
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
      <AttendeeFormFields />
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
