"use client";

import { useActionState, useState } from "react";
import type { ActionState } from "@/lib/actions/tasks";

const initialState: ActionState = {};

type Attachment = { id: string; label: string; url: string; kind: string };

export function TaskAttachmentGroup({
  attachments,
  kind,
  label,
  addAction,
  deleteAction,
  hiddenFieldName,
  hiddenFieldValue,
  canManage,
  allowUpload,
}: {
  attachments: Attachment[];
  kind: "referencia" | "entrega";
  label: string;
  addAction: (prevState: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (formData: FormData) => void;
  hiddenFieldName: string;
  hiddenFieldValue: string;
  canManage: boolean;
  allowUpload: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [state, formAction, pending] = useActionState(addAction, initialState);
  const items = attachments.filter((a) => a.kind === kind);

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10.5px] font-medium uppercase tracking-[0.03em] text-ink-faint">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        {items.map((a) => (
          <span key={a.id} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px]">
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
              🔗 {a.label}
            </a>
            {canManage && (
              <form action={deleteAction}>
                <input type="hidden" name="attachmentId" value={a.id} />
                <button className="text-ink-faint hover:text-critical">×</button>
              </form>
            )}
          </span>
        ))}
        {items.length === 0 && !adding && <span className="text-[11px] text-ink-faint">Nenhum ainda.</span>}
        {canManage && !adding && (
          <button onClick={() => setAdding(true)} className="text-[11px] font-medium text-brand hover:underline">
            + adicionar
          </button>
        )}
      </div>

      {adding && canManage && (
        <form action={formAction} className="mt-0.5 flex flex-wrap items-center gap-2 rounded-(--radius-s) bg-surface-muted p-2">
          <input type="hidden" name={hiddenFieldName} value={hiddenFieldValue} />
          <input type="hidden" name="kind" value={kind} />
          <input name="label" required placeholder="Nome" className="h-7 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none" />
          <input name="url" placeholder="Link…" className="h-7 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none" />
          {allowUpload && (
            <>
              <span className="text-[11px] text-ink-faint">ou</span>
              <input name="file" type="file" accept="image/*,application/pdf,.ppt,.pptx" className="text-[11px]" />
            </>
          )}
          <button type="submit" disabled={pending} className="h-7 rounded-(--radius-s) bg-brand-deep px-2.5 text-[11px] font-medium text-gold-soft disabled:opacity-60">
            {pending ? "…" : "Adicionar"}
          </button>
          <button type="button" onClick={() => setAdding(false)} className="text-[11px] text-ink-faint hover:underline">
            cancelar
          </button>
          {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
        </form>
      )}
    </div>
  );
}
