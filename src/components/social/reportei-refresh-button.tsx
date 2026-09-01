"use client";

import { useActionState } from "react";
import {
  refreshSocialReporteiAction,
  type ReporteiRefreshState,
} from "@/lib/actions/social";

const initialState: ReporteiRefreshState = {};

export function ReporteiRefreshButton({ profileId }: { profileId: string }) {
  const [state, formAction, pending] = useActionState(
    refreshSocialReporteiAction,
    initialState
  );

  return (
    <form action={formAction} className="flex items-center gap-2.5">
      <input type="hidden" name="profileId" value={profileId} />
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
      {state.error && (
        <span className="text-[11.5px] text-critical">{state.error}</span>
      )}
      {state.success && !pending && (
        <span className="text-[11.5px] text-positive">
          {state.count} métricas atualizadas.
        </span>
      )}
    </form>
  );
}
