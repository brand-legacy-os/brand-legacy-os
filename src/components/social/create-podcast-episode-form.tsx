"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  createPodcastEpisodeAction,
  updatePodcastEpisodeAction,
  type ActionState,
} from "@/lib/actions/social";
import { PODCAST_STATUS_META, PODCAST_SOURCE_META } from "@/lib/social";
import { COMMS_STATUS_META } from "@/lib/sponsors";

const initialState: ActionState = {};

function toDateInput(d: Date | string | null | undefined) {
  return d ? new Date(d).toISOString().slice(0, 10) : "";
}

type EpisodeDefaults = {
  id: string;
  episodeNumber: number;
  guestName: string;
  guestBrand: string | null;
  guestBrandInstagram: string | null;
  guestPersonalInstagram: string | null;
  source: string;
  sourceOther: string | null;
  recordingDate: Date | string | null;
  recordingResponsibleId: string | null;
  materialDeadline: Date | string | null;
  materialResponsibleId: string | null;
  postDate: Date | string | null;
  postResponsibleId: string | null;
  rawMaterialUrl: string | null;
  editedMaterialUrl: string | null;
  status: string;
  transcript: string | null;
  dispatchCopy: string | null;
  dispatchDate: Date | string | null;
  dispatchResponsibleId: string | null;
  dispatchStatus: string | null;
};

export function CreatePodcastEpisodeForm({
  users,
  defaults,
  onDone,
}: {
  users: { id: string; name: string }[];
  defaults?: EpisodeDefaults;
  onDone?: () => void;
}) {
  const isEdit = Boolean(defaults);
  const [open, setOpen] = useState(isEdit);
  const [source, setSource] = useState(defaults?.source ?? "");
  const [state, formAction, pending] = useActionState(
    isEdit ? updatePodcastEpisodeAction : createPodcastEpisodeAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
      onDone?.();
    }
  }, [state.success, onDone]);

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

  const responsibleSelect = (name: string, defaultValue: string | null | undefined, placeholder: string) => (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
    >
      <option value="">{placeholder}</option>
      {users.map((u) => (
        <option key={u.id} value={u.id}>
          {u.name}
        </option>
      ))}
    </select>
  );

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      {isEdit && <input type="hidden" name="episodeId" value={defaults!.id} />}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <input
          name="episodeNumber"
          type="number"
          min={1}
          required
          defaultValue={defaults?.episodeNumber}
          placeholder="Nº episódio"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestName"
          required
          defaultValue={defaults?.guestName}
          placeholder="Convidado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestBrand"
          defaultValue={defaults?.guestBrand ?? ""}
          placeholder="Marca do convidado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestBrandInstagram"
          defaultValue={defaults?.guestBrandInstagram ?? ""}
          placeholder="IG da marca"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="guestPersonalInstagram"
          defaultValue={defaults?.guestPersonalInstagram ?? ""}
          placeholder="IG do convidado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <div className="flex gap-2">
          <select
            name="source"
            required
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-9 flex-1 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
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
        {source === "outro" && (
          <input
            name="sourceOther"
            defaultValue={defaults?.sourceOther ?? ""}
            placeholder="Quem é a fonte?"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none sm:col-span-2"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data de gravação</label>
          <input
            name="recordingDate"
            type="date"
            defaultValue={toDateInput(defaults?.recordingDate)}
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
          {responsibleSelect("recordingResponsibleId", defaults?.recordingResponsibleId, "Responsável…")}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Prazo do material</label>
          <input
            name="materialDeadline"
            type="date"
            defaultValue={toDateInput(defaults?.materialDeadline)}
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
          {responsibleSelect("materialResponsibleId", defaults?.materialResponsibleId, "Responsável…")}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data de postagem</label>
          <input
            name="postDate"
            type="date"
            defaultValue={toDateInput(defaults?.postDate)}
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
          {responsibleSelect("postResponsibleId", defaults?.postResponsibleId, "Responsável…")}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <input
          name="rawMaterialUrl"
          defaultValue={defaults?.rawMaterialUrl ?? ""}
          placeholder="Link material bruto — https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="editedMaterialUrl"
          defaultValue={defaults?.editedMaterialUrl ?? ""}
          placeholder="Link material editado — https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
      </div>

      <select
        name="status"
        defaultValue={defaults?.status ?? "entrevista_marcada"}
        className="h-9 w-fit rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
      >
        {Object.entries(PODCAST_STATUS_META).map(([key, meta]) => (
          <option key={key} value={key}>
            {meta.label}
          </option>
        ))}
      </select>

      <div className="flex flex-col gap-2 border-t border-border pt-2.5">
        <span className="text-[11px] font-medium text-ink-soft">Transcrição e disparo</span>
        <textarea
          name="transcript"
          rows={2}
          defaultValue={defaults?.transcript ?? ""}
          placeholder="Transcrição do episódio (opcional)"
          className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none"
        />
        <textarea
          name="dispatchCopy"
          rows={2}
          defaultValue={defaults?.dispatchCopy ?? ""}
          placeholder="Copy de disparo nos grupos (opcional)"
          className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none"
        />
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <input
            name="dispatchDate"
            type="date"
            defaultValue={toDateInput(defaults?.dispatchDate)}
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
          {responsibleSelect("dispatchResponsibleId", defaults?.dispatchResponsibleId, "Responsável pelo disparo…")}
          <select
            name="dispatchStatus"
            defaultValue={defaults?.dispatchStatus ?? ""}
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          >
            <option value="">Status do disparo…</option>
            {Object.entries(COMMS_STATUS_META).map(([key, meta]) => (
              <option key={key} value={key}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : isEdit ? "Salvar alterações" : "Adicionar episódio"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            onDone?.();
          }}
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
