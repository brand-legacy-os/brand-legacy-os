"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { submitSelfAssessmentAction, type ActionState } from "@/lib/actions/rh";
import { RH_TYPE_META, RH_CLASSIFICATION_META, RH_CLASSIFICATION_QUADRANTS, RH_QUESTIONS_BY_TYPE } from "@/lib/rh";
import type { RhReviewType } from "@prisma/client";

const initialState: ActionState = {};

function ClassificationHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-fit text-[11px] font-medium text-brand hover:underline"
      >
        {open ? "Ocultar explicação dos quadrantes" : "O que significa cada quadrante?"}
      </button>
      {open && (
        <div className="flex flex-col gap-1 rounded-(--radius-s) bg-surface-muted p-2.5 text-[11.5px] text-ink-soft">
          {Object.entries(RH_CLASSIFICATION_META).map(([key, meta]) => (
            <p key={key}>
              <span className="font-medium text-ink">{meta.label}: </span>
              {RH_CLASSIFICATION_QUADRANTS[key as keyof typeof RH_CLASSIFICATION_QUADRANTS]}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export function SelfAssessmentForm() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RhReviewType | "">("");
  const [state, formAction, pending] = useActionState(
    submitSelfAssessmentAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setType("");
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
        Autoavaliação — responda primeiro, seu líder formaliza a visão dele depois. Todas as perguntas são obrigatórias.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          name="type"
          required
          value={type}
          onChange={(e) => setType(e.target.value as RhReviewType)}
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
      </div>

      {type && (
        <>
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-ink">
              Como você se classifica?
            </label>
            <div className="flex flex-wrap items-start gap-2">
              <select
                name="classification"
                required
                defaultValue=""
                className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
              >
                <option value="" disabled>
                  Selecione…
                </option>
                {Object.entries(RH_CLASSIFICATION_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.label}
                  </option>
                ))}
              </select>
              <textarea
                name="classificationReason"
                required
                rows={1}
                placeholder="Por quê?"
                className="h-9 min-w-[220px] flex-1 rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
              />
            </div>
            <ClassificationHelp />
          </div>

          {RH_QUESTIONS_BY_TYPE[type].map((q) => (
            <div key={q.key} className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-ink">{q.label}</label>
              {q.kind === "number" ? (
                <input
                  name={`answer_${q.key}`}
                  type="number"
                  min={0}
                  max={10}
                  required
                  className="h-9 w-20 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
                />
              ) : (
                <textarea
                  name={`answer_${q.key}`}
                  required
                  rows={2}
                  className="rounded-(--radius-s) border border-border bg-canvas px-3 py-2 text-[13px] outline-none focus:border-brand-deep-2"
                />
              )}
            </div>
          ))}
        </>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending || !type}
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
