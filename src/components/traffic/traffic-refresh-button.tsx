"use client";

import { useActionState } from "react";
import { refreshTrafficAction, type TrafficRefreshState } from "@/lib/actions/traffic";

const initialState: TrafficRefreshState = {};

export function TrafficRefreshButton({ lastUpdatedLabel }: { lastUpdatedLabel: string | null }) {
  const [state, formAction, pending] = useActionState(refreshTrafficAction, initialState);

  return (
    <form action={formAction} className="flex items-center gap-2.5">
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
            Atualizando…
          </>
        ) : (
          <>↻ Atualizar</>
        )}
      </button>
      {state.error && <span className="text-[11.5px] text-critical">{state.error}</span>}
      {state.success && !pending && (
        <span className="text-[11.5px] text-positive">
          {state.campaigns} campanhas · {state.ads} anúncios · {state.mqlLeads} MQL · {state.sqlLeads} SQL atualizados.
        </span>
      )}
    </form>
  );
}
