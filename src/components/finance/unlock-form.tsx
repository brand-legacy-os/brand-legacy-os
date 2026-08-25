"use client";

import { useActionState } from "react";
import { unlockFinanceAction, type UnlockState } from "@/lib/actions/finance-unlock";

const initialState: UnlockState = {};

export function UnlockForm() {
  const [state, formAction, pending] = useActionState(
    unlockFinanceAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="passcode" className="text-[13px] font-medium text-ink-soft">
          Senha do módulo Financeiro
        </label>
        <input
          id="passcode"
          name="passcode"
          type="password"
          required
          autoFocus
          className="h-11 rounded-(--radius-s) border border-border bg-surface px-3.5 text-[14.5px] text-ink outline-none focus:border-brand-deep-2"
        />
      </div>
      {state.error && (
        <p className="rounded-(--radius-s) bg-critical-bg px-3.5 py-2.5 text-[13px] text-critical">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-(--radius-s) bg-brand-deep text-[14.5px] font-medium text-gold-soft transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Verificando…" : "Entrar"}
      </button>
    </form>
  );
}
