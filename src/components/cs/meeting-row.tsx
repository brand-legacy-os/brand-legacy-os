"use client";

import { useActionState, useState } from "react";
import { updateCustomerMeetingAction, type ActionState } from "@/lib/actions/cs";
import { formatDate } from "@/lib/format";

const initialState: ActionState = {};

type Meeting = {
  id: string;
  type: "individual" | "coletivo";
  label: string | null;
  date: Date;
  transcript: string | null;
  recordingUrl: string | null;
  notes: string | null;
};

export function MeetingRow({ meeting, canManage }: { meeting: Meeting; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateCustomerMeetingAction, initialState);
  const hasContent = meeting.transcript || meeting.recordingUrl;

  return (
    <div className="rounded-(--radius-s) border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${meeting.type === "individual" ? "bg-gold-tint text-gold-ink" : "bg-surface-muted text-ink-soft"}`}>
            {meeting.type === "individual" ? "Individual" : "Coletivo"}
          </span>
          <span className="text-[13px] font-medium text-ink">{meeting.label ?? "Encontro"}</span>
          <span className="text-[11.5px] text-ink-faint">{formatDate(meeting.date)}</span>
        </div>
        {canManage && (
          <button onClick={() => setOpen((v) => !v)} className="text-[11.5px] font-medium text-brand hover:underline">
            {open ? "Fechar" : hasContent ? "Editar" : "+ Transcrição/gravação"}
          </button>
        )}
      </div>

      {!open && meeting.recordingUrl && (
        <a href={meeting.recordingUrl} target="_blank" rel="noopener noreferrer" className="mt-1.5 inline-block text-[11.5px] font-medium text-brand hover:underline">
          Ver gravação →
        </a>
      )}
      {!open && meeting.transcript && (
        <p className="mt-1.5 line-clamp-2 text-[12px] text-ink-soft">{meeting.transcript}</p>
      )}
      {!open && meeting.notes && (
        <p className="mt-1 text-[11.5px] italic text-ink-faint">{meeting.notes}</p>
      )}

      {open && canManage && (
        <form action={formAction} className="mt-2.5 flex flex-col gap-2">
          <input type="hidden" name="meetingId" value={meeting.id} />
          <textarea
            name="transcript"
            defaultValue={meeting.transcript ?? ""}
            rows={4}
            placeholder="Transcrição da reunião"
            className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none"
          />
          <input
            name="recordingUrl"
            defaultValue={meeting.recordingUrl ?? ""}
            placeholder="Link da gravação — https://…"
            className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
          />
          <textarea
            name="notes"
            defaultValue={meeting.notes ?? ""}
            rows={2}
            placeholder="Observações sobre o encontro"
            className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
              {pending ? "Salvando…" : "Salvar"}
            </button>
            {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
