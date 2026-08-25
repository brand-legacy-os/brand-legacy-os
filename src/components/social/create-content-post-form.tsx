"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createContentPostAction, type ActionState } from "@/lib/actions/social";
import { CONTENT_FORMAT_META, CONTENT_POST_STATUS_META } from "@/lib/social";

const initialState: ActionState = {};

export function CreateContentPostForm({
  profiles,
}: {
  profiles: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createContentPostAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

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
        className="h-9 w-fit rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft hover:opacity-90"
      >
        + Novo post no calendário
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="date"
          type="date"
          required
          defaultValue={today}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <select
          name="profileId"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="" disabled>
            Perfil…
          </option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="format"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="" disabled>
            Formato…
          </option>
          {Object.entries(CONTENT_FORMAT_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue="planejado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          {Object.entries(CONTENT_POST_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
      <input
        name="theme"
        required
        placeholder="Tema / assunto do post"
        className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
      />
      <textarea
        name="notes"
        rows={2}
        placeholder="Observações (opcional)"
        className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Adicionar ao calendário"}
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
