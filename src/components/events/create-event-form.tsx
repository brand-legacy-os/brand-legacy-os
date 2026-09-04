"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createEventAction, type ActionState } from "@/lib/actions/events";
import { EVENT_TYPES } from "@/lib/events";
import { EVENT_BUDGET_CATEGORY_META } from "@/lib/sponsors";

const initialState: ActionState = {};

export function CreateEventForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createEventAction,
    initialState
  );
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
        className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft transition-opacity hover:opacity-90"
      >
        + Novo evento
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex w-full flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="name"
          required
          placeholder="Nome do evento"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <select
          name="type"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        >
          <option value="" disabled>
            Tipo…
          </option>
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
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        />
        <input
          name="endDate"
          type="date"
          required
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        />
        <input
          name="location"
          placeholder="Local (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <input
          name="budgetPlanned"
          inputMode="decimal"
          placeholder="Budget previsto total (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-[11px] font-medium text-ink-soft">Local do evento</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <input
            name="venueAddress"
            placeholder="Endereço"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
          />
          <input
            name="venueCost"
            inputMode="decimal"
            placeholder="Valor do local"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-[11px] font-medium text-ink-soft">
          Orçamento previsto por categoria (opcional — pode completar depois)
        </span>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(EVENT_BUDGET_CATEGORY_META).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-2">
              <input type="hidden" name="plannedCategory" value={key} />
              <span className="w-32 shrink-0 text-[12px] text-ink-soft">{meta.label}</span>
              <input
                name="plannedValue"
                inputMode="decimal"
                placeholder="R$"
                className="h-8 flex-1 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[12.5px] outline-none focus:border-brand-deep-2"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar evento"}
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
