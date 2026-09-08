"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addReportAttachmentAction, deleteReportAttachmentAction, type ActionState } from "@/lib/actions/social";

const initialState: ActionState = {};

type Attachment = { id: string; label: string; url: string };

export function ReportAttachments({
  reportId,
  attachments,
  canEdit,
}: {
  reportId: string;
  attachments: Attachment[];
  canEdit: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addReportAttachmentAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-2">
        {attachments.map((a) => (
          <span key={a.id} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11.5px]">
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
              🔗 {a.label}
            </a>
            {canEdit && (
              <form action={deleteReportAttachmentAction}>
                <input type="hidden" name="attachmentId" value={a.id} />
                <button className="text-ink-faint hover:text-critical">×</button>
              </form>
            )}
          </span>
        ))}
        {attachments.length === 0 && <span className="text-[11.5px] text-ink-faint">Nenhum anexo ainda.</span>}
      </div>
      {canEdit && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="reportId" value={reportId} />
              <input
                name="label"
                required
                placeholder="Nome do anexo"
                className="h-7 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none"
              />
              <input
                name="externalUrl"
                placeholder="Link externo…"
                className="h-7 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none"
              />
              <span className="text-[11px] text-ink-faint">ou</span>
              <input name="file" type="file" accept="image/*,application/pdf" className="text-[11px]" />
              <button type="submit" disabled={pending} className="h-7 rounded-(--radius-s) bg-brand-deep px-2.5 text-[11px] font-medium text-gold-soft disabled:opacity-60">
                {pending ? "…" : "Adicionar"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="text-[11px] text-ink-faint hover:underline">
                cancelar
              </button>
              {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
            </form>
          ) : (
            <button onClick={() => setOpen(true)} className="w-fit text-[11px] font-medium text-brand hover:underline">
              + anexo
            </button>
          )}
        </>
      )}
    </div>
  );
}
