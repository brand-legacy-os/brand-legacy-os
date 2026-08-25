"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { saveFinanceEntryAction, type ActionState } from "@/lib/actions/finance";

const initialState: ActionState = {};

export function FinanceEntryForm({
  categories,
  defaultPeriodKey,
}: {
  categories: { id: string; name: string; kind: string }[];
  defaultPeriodKey: string;
}) {
  const [open, setOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [state, formAction, pending] = useActionState(
    saveFinanceEntryAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setCategoryId("");
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft transition-opacity hover:opacity-90"
      >
        + Lançar valor
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          name="categoryId"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        >
          <option value="">+ Nova categoria…</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.kind === "receita" ? "receita" : "despesa"})
            </option>
          ))}
        </select>
        <input
          name="periodKey"
          type="month"
          required
          defaultValue={defaultPeriodKey}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        />
        {!categoryId && (
          <>
            <input
              name="newCategoryName"
              placeholder="Nome da nova categoria"
              className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
            />
            <select
              name="newCategoryKind"
              defaultValue=""
              className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
            >
              <option value="" disabled>
                Receita ou despesa…
              </option>
              <option value="receita">Receita</option>
              <option value="despesa">Despesa</option>
            </select>
          </>
        )}
        <input
          name="realizado"
          inputMode="decimal"
          placeholder="Realizado (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <input
          name="previsto"
          inputMode="decimal"
          placeholder="Previsto (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar lançamento"}
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
