"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { updateSocialProfileAction, type ActionState } from "@/lib/actions/social";

const initialState: ActionState = {};

export function UpdateProfileScopeForm({
  profile,
}: {
  profile: { id: string; contentScope: string | null; reporteiUrl: string | null };
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateSocialProfileAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) setOpen(false);
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[11.5px] font-medium text-brand hover:underline"
      >
        Editar escopo / Reportei
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-2.5"
    >
      <input type="hidden" name="profileId" value={profile.id} />
      <input
        name="reporteiUrl"
        defaultValue={profile.reporteiUrl ?? ""}
        placeholder="Link do Reportei — https://…"
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12px] outline-none"
      />
      <textarea
        name="contentScope"
        defaultValue={profile.contentScope ?? ""}
        rows={2}
        placeholder="Escopo de postagem combinado (o que, com que frequência)…"
        className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[12px] outline-none"
      />
      <div className="flex items-center gap-2.5">
        <button
          type="submit"
          disabled={pending}
          className="h-7 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && (
          <span className="text-[11px] text-critical">{state.error}</span>
        )}
      </div>
    </form>
  );
}
