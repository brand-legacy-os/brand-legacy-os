"use client";

import { useActionState, useState } from "react";
import { upsertFollowerSnapshotAction, type ActionState } from "@/lib/actions/social";

const initialState: ActionState = {};

export function FollowerSnapshotForm({
  profileId,
  monthKey,
  currentCount,
}: {
  profileId: string;
  monthKey: string;
  currentCount: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const [state, formAction, pending] = useActionState(upsertFollowerSnapshotAction, initialState);

  if (!editing) {
    return (
      <div className="flex items-center gap-2 text-[11.5px]">
        <span className="text-ink-faint">
          Seguidores em {monthKey}: <span className="tnum text-ink">{currentCount ?? "não informado"}</span>
        </span>
        <button onClick={() => setEditing(true)} className="font-medium text-brand hover:underline">
          {currentCount !== null ? "editar" : "informar"}
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="profileId" value={profileId} />
      <input type="hidden" name="monthKey" value={monthKey} />
      <input
        name="count"
        type="number"
        min={0}
        required
        defaultValue={currentCount ?? undefined}
        placeholder="Nº de seguidores"
        className="h-7 w-32 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none"
      />
      <button type="submit" disabled={pending} className="h-7 rounded-(--radius-s) bg-brand-deep px-2.5 text-[11px] font-medium text-gold-soft disabled:opacity-60">
        {pending ? "…" : "Salvar"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-[11px] text-ink-faint hover:underline">
        cancelar
      </button>
      {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
    </form>
  );
}
