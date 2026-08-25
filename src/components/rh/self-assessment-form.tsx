"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { submitSelfAssessmentAction, type ActionState } from "@/lib/actions/rh";
import { RH_TYPE_META, RH_CLASSIFICATION_META } from "@/lib/rh";

const initialState: ActionState = {};

export function SelfAssessmentForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitSelfAssessmentAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

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
        className="h-9 w-fit rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft transition-opacity hover:opacity-90"
      >
        + Minha autoavaliação
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <p className="text-[12.5px] font-medium text-ink">
        Autoavaliação — responda primeiro, seu líder formaliza a visão dele depois.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          name="type"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        >
          <option value="" disabled>
            Tipo de encontro…
          </option>
          {Object.entries(RH_TYPE_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <input
          name="date"
          type="date"
          required
          defaultValue={today}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        />
        <select
          name="classification"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        >
          <option value="" disabled>
            Como você se classifica?
          </option>
          {Object.entries(RH_CLASSIFICATION_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-ink">
          Existe equilíbrio entre sua vida pessoal e profissional?
        </label>
        <textarea
          name="workLifeBalance"
          required
          rows={2}
          className="rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-ink">
          De 0 a 10, como você avalia sua contribuição para o time? Por quê?
        </label>
        <div className="flex flex-wrap items-start gap-2">
          <input
            name="contributionScore"
            type="number"
            min={0}
            max={10}
            required
            placeholder="Nota"
            className="h-9 w-20 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
          />
          <textarea
            name="contributionReason"
            required
            rows={2}
            placeholder="Por quê?"
            className="h-9 min-w-[220px] flex-1 rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-ink">
          Deixe um feedback ao seu líder
        </label>
        <textarea
          name="feedbackToLeader"
          rows={2}
          className="rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-ink">
          Seus pontos fortes no período (opcional)
        </label>
        <textarea
          name="selfHighlights"
          rows={2}
          className="rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[12px] font-medium text-ink">
          Onde você quer se desenvolver (opcional)
        </label>
        <textarea
          name="selfImprovements"
          rows={2}
          className="rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar autoavaliação"}
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
