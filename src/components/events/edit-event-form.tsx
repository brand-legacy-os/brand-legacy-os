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
  venueAddress,
  venueCost,
  venueNotes,
  enpsDay1Url,
  enpsDay2Url,
  enpsDay3Url,
}: {
  eventId: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  budgetPlanned: string;
  venueAddress?: string;
  venueCost?: string;
  venueNotes?: string;
  enpsDay1Url?: string;
  enpsDay2Url?: string;
  enpsDay3Url?: string;
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

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-[11px] font-medium text-ink-soft">Local do evento</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="venueAddress"
            defaultValue={venueAddress}
            placeholder="Endereço"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
          />
          <input
            name="venueCost"
            inputMode="decimal"
            defaultValue={venueCost}
            placeholder="Valor do local"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
          />
        </div>
        <textarea
          name="venueNotes"
          defaultValue={venueNotes}
          placeholder="Observações do local (opcional)"
          rows={2}
          className="rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-[11px] font-medium text-ink-soft">Links de eNPS diário (3 dias)</span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            name="enpsDay1Url"
            defaultValue={enpsDay1Url}
            placeholder="Dia 1 — link"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[12.5px] outline-none focus:border-brand-deep-2"
          />
          <input
            name="enpsDay2Url"
            defaultValue={enpsDay2Url}
            placeholder="Dia 2 — link"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[12.5px] outline-none focus:border-brand-deep-2"
          />
          <input
            name="enpsDay3Url"
            defaultValue={enpsDay3Url}
            placeholder="Dia 3 — link"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[12.5px] outline-none focus:border-brand-deep-2"
          />
        </div>
      </div>

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
