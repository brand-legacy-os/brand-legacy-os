"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { updateEventAction, type ActionState } from "@/lib/actions/events";
import { EVENT_TYPES } from "@/lib/events";

const initialState: ActionState = {};

export function EditEventForm({
  eventId,
  name,
  type,
  startDate,
  endDate,
  location,
  description,
  budgetPlanned,
}: {
  eventId: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  budgetPlanned: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateEventAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[12px] font-medium text-ink-soft hover:text-brand-deep hover:underline"
      >
        Editar detalhes do evento
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex w-full flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          defaultValue={name}
          placeholder="Nome do evento"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <select
          name="type"
          required
          defaultValue={type}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        >
          {EVENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          name="startDate"
          type="date"
          required
          defaultValue={startDate}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        />
        <input
          name="endDate"
          type="date"
          required
          defaultValue={endDate}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        />
        <input
          name="location"
          defaultValue={location}
          placeholder="Local (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <input
          name="budgetPlanned"
          inputMode="decimal"
          defaultValue={budgetPlanned}
          placeholder="Budget previsto (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <textarea
        name="description"
        defaultValue={description}
        placeholder="Descrição (opcional)"
        rows={2}
        className="rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12.5px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && (
          <span className="text-[12px] text-critical">{state.error}</span>
        )}
      </div>
    </form>
  );
}
