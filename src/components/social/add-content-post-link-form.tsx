"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createContentPostLinkAction, type ActionState } from "@/lib/actions/social";

const initialState: ActionState = {};

export function AddContentPostLinkForm({ postId }: { postId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createContentPostLinkAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[12px] font-medium text-brand hover:underline"
      >
        + Adicionar link
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-2.5"
    >
      <input type="hidden" name="postId" value={postId} />
      <input
        name="label"
        required
        placeholder="Nome (ex: Roteiro, Briefing, Drive)"
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
      />
      <input
        name="url"
        required
        placeholder="https://…"
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
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
