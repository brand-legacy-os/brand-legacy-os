"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[13px] font-medium text-ink-soft">
          E-mail corporativo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="nome@brandlegacy.com.br"
          className="h-11 rounded-(--radius-s) border border-border bg-surface px-3.5 text-[14.5px] text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-gold-ink/60"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-[13px] font-medium text-ink-soft"
        >
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="h-11 rounded-(--radius-s) border border-border bg-surface px-3.5 text-[14.5px] text-ink outline-none transition-colors focus:border-gold-ink/60"
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
        className="mt-1 h-11 rounded-(--radius-s) bg-gold text-[14.5px] font-semibold text-brand-deep transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
