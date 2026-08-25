"use client";

import { useActionState, useRef, useState, useEffect } from "react";
import { createLibraryItemAction, type ActionState } from "@/lib/actions/library";
import { LIBRARY_CATEGORIES, LIBRARY_TYPES } from "@/lib/library";

const initialState: ActionState = {};

export function AddLibraryForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createLibraryItemAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft transition-opacity hover:opacity-90"
      >
        + Adicionar conteúdo
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          name="title"
          required
          placeholder="Título"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <input
          name="url"
          required
          placeholder="https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <select
          name="type"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        >
          <option value="" disabled>
            Tipo…
          </option>
          {LIBRARY_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          name="category"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none"
        >
          <option value="" disabled>
            Categoria…
          </option>
          {LIBRARY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          name="authorLabel"
          placeholder="Autor (opcional)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <input
          name="tags"
          placeholder="Tags, separadas por vírgula"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>
      <textarea
        name="description"
        rows={2}
        placeholder="Descrição curta (opcional)"
        className="rounded-(--radius-s) border border-border bg-canvas p-3 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
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
