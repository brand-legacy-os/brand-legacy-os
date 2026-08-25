"use client";

import { useActionState, useRef, useEffect } from "react";
import { addEventNoteAction, type ActionState } from "@/lib/actions/events";

const initialState: ActionState = {};

export function EventNoteForm({ eventId }: { eventId: string }) {
  const [state, formAction, pending] = useActionState(
    addEventNoteAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <input
        name="content"
        placeholder="Publicar um aviso ou observação sobre o evento…"
        className="h-9 flex-1 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-9 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
      >
        {pending ? "Enviando…" : "Publicar"}
      </button>
      {state.error && (
        <span className="text-[11.5px] text-critical">{state.error}</span>
      )}
    </form>
  );
}
