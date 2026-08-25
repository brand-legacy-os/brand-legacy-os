"use client";

import { useActionState, useRef, useEffect } from "react";
import { submitLeaderFeedbackAction, type ActionState } from "@/lib/actions/rh";
import { RH_CLASSIFICATION_META } from "@/lib/rh";

const initialState: ActionState = {};

export function LeaderFeedbackForm({ reviewId }: { reviewId: string }) {
  const [state, formAction, pending] = useActionState(
    submitLeaderFeedbackAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-s) bg-surface-muted p-3"
    >
      <input type="hidden" name="reviewId" value={reviewId} />
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
        name="highlights"
        placeholder="Pontos fortes / conquistas"
        rows={2}
        className="rounded-(--radius-s) border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-brand-deep-2"
      />
      <textarea
        name="improvements"
        placeholder="Pontos de desenvolvimento"
        rows={2}
        className="rounded-(--radius-s) border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-brand-deep-2"
      />
      <textarea
        name="actionItems"
        placeholder="Combinados / próximos passos"
        rows={2}
        className="rounded-(--radius-s) border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-brand-deep-2"
      />
      <textarea
        name="notes"
        placeholder="Observações livres (opcional)"
        rows={2}
        className="rounded-(--radius-s) border border-border bg-surface px-2.5 py-2 text-[12.5px] outline-none focus:border-brand-deep-2"
      />
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
