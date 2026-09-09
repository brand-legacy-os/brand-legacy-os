"use client";

import { useActionState } from "react";
import { refreshComercialAction, type ComercialRefreshState } from "@/lib/actions/comercial";

const initialState: ComercialRefreshState = {};

export function ComercialRefreshButton({ lastUpdatedLabel }: { lastUpdatedLabel: string | null }) {
  const [state, formAction, pending] = useActionState(refreshComercialAction, initialState);

  return (
    <form action={formAction} className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2.5">
        {lastUpdatedLabel && !state.success && (
          <span className="text-[11.5px] text-ink-faint">Atualizado em: {lastUpdatedLabel}</span>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex h-8 items-center gap-1.5 rounded-full bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft transition-opacity disabled:opacity-60"
        >
          {pending ? (
            <>
              <span className="h-2.5 w-2.5 animate-spin rounded-full border-[1.5px] border-gold-soft/40 border-t-gold-soft" />
              Atualizando… (pode levar alguns minutos)
            </>
          ) : (
            <>↻ Atualizar</>
          )}
        </button>
      </div>
      {state.error && <span className="text-[11.5px] text-critical">{state.error}</span>}
      {state.success && !pending && (
        <span className="text-[11.5px] text-positive">
          {state.opportunities} oportunidades
          {state.calendlySkipped
            ? " · Calendly não configurado ainda"
            : ` · ${state.meetings} reuniões`}{" "}
          atualizadas.
        </span>
      )}
    </form>
  );
}
