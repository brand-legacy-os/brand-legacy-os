"use client";

import { useActionState, useEffect } from "react";
import { updateContentPostAction, type ActionState } from "@/lib/actions/social";
import { CONTENT_FORMAT_META, CONTENT_POST_STATUS_META } from "@/lib/social";

const initialState: ActionState = {};

export function EditContentPostForm({
  post,
  profiles,
  onDone,
}: {
  post: {
    id: string;
    date: Date | string;
    profileId: string;
    format: string;
    theme: string;
    status: string;
    notes: string | null;
  };
  profiles: { id: string; name: string }[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateContentPostAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface-muted p-3.5">
      <input type="hidden" name="postId" value={post.id} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input
          name="date"
          type="date"
          required
          defaultValue={new Date(post.date).toISOString().slice(0, 10)}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
        />
        <select
          name="profileId"
          required
          defaultValue={post.profileId}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
        >
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          name="format"
          required
          defaultValue={post.format}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
        >
          {Object.entries(CONTENT_FORMAT_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={post.status}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
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
        defaultValue={post.theme}
        placeholder="Tema / assunto do post"
        className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
      />
      <textarea
        name="notes"
        rows={2}
        defaultValue={post.notes ?? ""}
        placeholder="Observações (opcional)"
        className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[13px] outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
        <button type="button" onClick={onDone} className="text-[12.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
