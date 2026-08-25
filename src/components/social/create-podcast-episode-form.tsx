"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createPodcastEpisodeAction, type ActionState } from "@/lib/actions/social";
import { PODCAST_STATUS_META, PODCAST_SOURCE_META } from "@/lib/social";

const initialState: ActionState = {};

export function CreatePodcastEpisodeForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createPodcastEpisodeAction,
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
        className="h-9 w-fit rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft hover:opacity-90"
      >
        + Novo episódio
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <input
          name="episodeNumber"
          type="number"
          min={1}
          required
          placeholder="Nº episódio"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestName"
          required
          placeholder="Convidado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestBrand"
          placeholder="Marca do convidado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestBrandInstagram"
          placeholder="IG da marca"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestPersonalInstagram"
          placeholder="IG do convidado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <select
          name="source"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="" disabled>
            Fonte…
          </option>
          {Object.entries(PODCAST_SOURCE_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data de gravação</label>
          <input
            name="recordingDate"
            type="date"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Prazo do material</label>
          <input
            name="materialDeadline"
            type="date"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data de postagem</label>
          <input
            name="postDate"
            type="date"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input
          name="rawMaterialUrl"
          placeholder="Link material bruto — https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="editedMaterialUrl"
          placeholder="Link material editado — https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
      </div>
      <select
        name="status"
        defaultValue="agendado"
        className="h-9 w-fit rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
      >
        {Object.entries(PODCAST_STATUS_META).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Adicionar episódio"}
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
