"use client";

import { useState } from "react";
import {
  toggleTrainingRsvpAction,
  addTrainingMaterialAction,
  deleteTrainingMaterialAction,
  updateTrainingDetailsAction,
  type ActionState,
} from "@/lib/actions/training";
import { useActionState, useRef, useEffect } from "react";
import { LIBRARY_TYPES, libraryTypeIcon, libraryTypeLabel } from "@/lib/library";
import { formatDateFull } from "@/lib/format";

const initialState: ActionState = {};

type Training = {
  id: string;
  theme: string;
  description: string;
  date: Date;
  meetLink: string | null;
  nps: number | null;
  npsResponses: number | null;
  attendees: { userId: string; user: { name: string; avatarInitials: string } }[];
  materials: { id: string; title: string; type: string; url: string }[];
};

export function TrainingCard({
  training,
  currentUserId,
  isAdmin,
}: {
  training: Training;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const confirmed = training.attendees.some((a) => a.userId === currentUserId);
  const now = new Date();
  const isPast = training.date < now;

  const [matState, matAction, matPending] = useActionState(
    addTrainingMaterialAction,
    initialState
  );
  const matRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (matState.success) {
      matRef.current?.reset();
      setShowMaterialForm(false);
    }
  }, [matState.success]);

  const [detState, detAction, detPending] = useActionState(
    updateTrainingDetailsAction,
    initialState
  );
  useEffect(() => {
    if (detState.success) setShowEditDetails(false);
  }, [detState.success]);

  return (
    <div className="flex flex-col gap-4 rounded-(--radius-l) border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <span className="w-fit rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-medium text-gold-ink">
            {formatDateFull(training.date)}
          </span>
          <h3 className="font-(family-name:--font-display) text-[20px] text-ink">
            {training.theme}
          </h3>
          <p className="max-w-[56ch] text-[13px] text-ink-soft">
            {training.description}
          </p>
        </div>
        {isPast && training.nps !== null ? (
          <div className="flex flex-col items-end">
            <span className="tnum font-(family-name:--font-display) text-[22px] text-ink">
              {training.nps}
            </span>
            <span className="text-[11px] text-ink-faint">
              NPS · {training.npsResponses ?? 0} respostas
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2.5 border-t border-border pt-3">
        <form action={toggleTrainingRsvpAction}>
          <input type="hidden" name="trainingId" value={training.id} />
          <button
            type="submit"
            className={`h-9 rounded-full px-4 text-[12.5px] font-medium transition-colors ${
              confirmed
                ? "bg-brand-deep text-gold-soft"
                : "border border-border bg-surface text-ink-soft hover:bg-surface-muted"
            }`}
          >
            {confirmed ? "✓ Presença confirmada" : "Confirmar presença"}
          </button>
        </form>
        <span className="text-[12px] text-ink-faint">
          {training.attendees.length} confirmado
          {training.attendees.length === 1 ? "" : "s"}
        </span>
        {training.meetLink && (
          <a
            href={training.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto h-9 rounded-full border border-border px-4 text-[12.5px] font-medium text-brand hover:bg-surface-muted"
          >
            Entrar no Meet →
          </a>
        )}
      </div>

      {training.materials.length > 0 && (
        <div className="flex flex-col gap-1.5 border-t border-border pt-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
            Materiais complementares
          </p>
          {training.materials.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2">
              <a
                href={m.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12.5px] text-ink hover:text-brand-deep hover:underline"
              >
                <span>{libraryTypeIcon(m.type)}</span>
                {m.title}
                <span className="text-ink-faint">· {libraryTypeLabel(m.type)}</span>
              </a>
              {isAdmin && (
                <form action={deleteTrainingMaterialAction}>
                  <input type="hidden" name="materialId" value={m.id} />
                  <button className="text-[11px] text-critical hover:underline">
                    Excluir
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      )}

      {isAdmin && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <button
            onClick={() => setShowMaterialForm((v) => !v)}
            className="text-[12px] font-medium text-brand hover:underline"
          >
            + Material complementar
          </button>
          <button
            onClick={() => setShowEditDetails((v) => !v)}
            className="text-[12px] font-medium text-brand hover:underline"
          >
            Editar NPS / link do Meet
          </button>
        </div>
      )}

      {isAdmin && showMaterialForm && (
        <form
          ref={matRef}
          action={matAction}
          className="flex flex-wrap items-end gap-2 rounded-(--radius-s) bg-surface-muted p-3"
        >
          <input type="hidden" name="trainingId" value={training.id} />
          <input
            name="title"
            required
            placeholder="Título"
            className="h-9 min-w-[160px] flex-1 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          />
          <select
            name="type"
            required
            defaultValue=""
            className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
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
          <input
            name="url"
            required
            placeholder="https://…"
            className="h-9 min-w-[180px] flex-1 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          />
          <button
            type="submit"
            disabled={matPending}
            className="h-9 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
          >
            {matPending ? "Salvando…" : "Adicionar"}
          </button>
          {matState.error && (
            <span className="w-full text-[11.5px] text-critical">{matState.error}</span>
          )}
        </form>
      )}

      {isAdmin && showEditDetails && (
        <form
          action={detAction}
          className="flex flex-wrap items-end gap-2 rounded-(--radius-s) bg-surface-muted p-3"
        >
          <input type="hidden" name="trainingId" value={training.id} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">Link do Meet</label>
            <input
              name="meetLink"
              defaultValue={training.meetLink ?? ""}
              placeholder="https://meet.google.com/…"
              className="h-9 min-w-[220px] rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">NPS</label>
            <input
              name="nps"
              type="number"
              min={0}
              max={100}
              defaultValue={training.nps ?? ""}
              className="h-9 w-20 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">Respostas</label>
            <input
              name="npsResponses"
              type="number"
              min={0}
              defaultValue={training.npsResponses ?? ""}
              className="h-9 w-20 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={detPending}
            className="h-9 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
          >
            {detPending ? "Salvando…" : "Salvar"}
          </button>
          {detState.error && (
            <span className="w-full text-[11.5px] text-critical">{detState.error}</span>
          )}
        </form>
      )}

      {training.attendees.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
          {training.attendees.slice(0, 10).map((a) => (
            <span
              key={a.userId}
              title={a.user.name}
              className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-[9.5px] font-medium text-ink-soft"
            >
              {a.user.avatarInitials}
            </span>
          ))}
          {training.attendees.length > 10 && (
            <span className="text-[11px] text-ink-faint">
              +{training.attendees.length - 10}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
