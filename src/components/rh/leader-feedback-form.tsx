"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitLeaderFeedbackAction, type ActionState } from "@/lib/actions/rh";
import { RH_CLASSIFICATION_META, RH_QUESTIONS_BY_TYPE, legacyOneOnOneAnswers } from "@/lib/rh";
import type { RhReview } from "@prisma/client";

const initialState: ActionState = {};

export function LeaderFeedbackForm({ review }: { review: RhReview }) {
  const [state, formAction, pending] = useActionState(
    submitLeaderFeedbackAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  const selfAnswers = (review.selfAnswers as Record<string, string> | null) ?? legacyOneOnOneAnswers(review);
  const questions = RH_QUESTIONS_BY_TYPE[review.type];

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-s) bg-surface-muted p-3"
    >
      <input type="hidden" name="reviewId" value={review.id} />

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            name="classification"
            required
            defaultValue=""
            className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          >
            <option value="" disabled>
              Sua classificação da pessoa…
            </option>
            {Object.entries(RH_CLASSIFICATION_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
          <select
            name="rating"
            defaultValue=""
            className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          >
            <option value="">Nota geral (opcional)</option>
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </div>
        <textarea
          name="classificationComment"
          placeholder="Comentário sobre a classificação"
          rows={1}
          className="rounded-(--radius-s) border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-brand-deep-2"
        />
      </div>

      {questions.map((q) => (
        <div key={q.key} className="flex flex-col gap-1">
          <p className="text-[11.5px] font-medium text-ink-soft">{q.label}</p>
          {selfAnswers[q.key] && (
            <p className="rounded-(--radius-s) bg-surface px-2.5 py-1.5 text-[12px] text-ink-soft">
              {selfAnswers[q.key]}
            </p>
          )}
          <textarea
            name={`comment_${q.key}`}
            placeholder="Seu comentário sobre este ponto"
            rows={1}
            className="rounded-(--radius-s) border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-brand-deep-2"
          />
        </div>
      ))}

      {review.type === "anual" && (
        <div className="flex flex-col gap-2 rounded-(--radius-s) border border-dashed border-border-strong p-2.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">
            Retorno de remuneração (preenchido pelo líder)
          </p>
          <textarea
            name="leaderSalaryHistory"
            placeholder="Histórico de salário nos últimos 3 anos"
            rows={2}
            className="rounded-(--radius-s) border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-brand-deep-2"
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              name="leaderPostReviewSalary"
              type="number"
              step="0.01"
              placeholder="Salário pós retorno (R$)"
              className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            />
            <input
              name="leaderExceptionalBonus"
              type="number"
              step="0.01"
              placeholder="Prêmio excepcional (R$)"
              className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            />
            <select
              name="leaderRoleChanged"
              defaultValue=""
              className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            >
              <option value="">Houve recolocação de cargo?</option>
              <option value="sim">Sim</option>
              <option value="nao">Não</option>
            </select>
            <input
              name="leaderNextYearRole"
              placeholder="Cargo próximo ano"
              className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Formalizar minha visão"}
        </button>
        {state.error && (
          <span className="text-[11.5px] text-critical">{state.error}</span>
        )}
      </div>
    </form>
  );
}
