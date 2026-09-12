"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addDebriefReportAction, deleteDebriefReportAction, type ActionState } from "@/lib/actions/events";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatDate } from "@/lib/format";

const initialState: ActionState = {};
const inputClass = "h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none";

type Report = { id: string; name: string; deliveryDate: string | Date | null; summary: string | null; fileUrl: string | null };

export function DebriefReportsSection({
  eventId,
  reports,
  canManage,
}: {
  eventId: string;
  reports: Report[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(addDebriefReportAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <CollapsibleSection title={`Relatório para debriefing (${reports.length})`}>
      <div className="flex flex-col">
        {reports.map((r) => (
          <div key={r.id} className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
            <div className="flex flex-col gap-0.5 text-[12.5px]">
              <span className="text-ink">
                {r.name}
                {r.deliveryDate ? ` · entregue em ${formatDate(new Date(r.deliveryDate))}` : ""}
              </span>
              {r.summary && <span className="text-[11px] text-ink-faint">{r.summary}</span>}
              {r.fileUrl && (
                <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="w-fit text-[11px] text-brand hover:underline">
                  Ver relatório
                </a>
              )}
            </div>
            {canManage && (
              <form
                action={deleteDebriefReportAction}
                onSubmit={(e) => {
                  if (!confirm(`Remover "${r.name}"?`)) e.preventDefault();
                }}
              >
                <input type="hidden" name="reportId" value={r.id} />
                <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                  excluir
                </button>
              </form>
            )}
          </div>
        ))}
        {reports.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Nenhum relatório anexado ainda.</p>}
      </div>

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <input type="hidden" name="eventId" value={eventId} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="name" required placeholder="Nome" className={inputClass} />
                <input name="deliveryDate" type="date" className={inputClass} />
              </div>
              <textarea name="summary" rows={2} placeholder="Resumo" className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12.5px] outline-none" />
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-ink-faint">Relatório (opcional)</span>
                <input type="file" name="file" accept="image/*,.pdf,.ppt,.pptx" className="text-[12px]" />
              </div>
              <div className="flex items-center gap-2.5">
                <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
                  {pending ? "Salvando…" : "Adicionar"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
                  Cancelar
                </button>
                {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
              </div>
            </form>
          ) : (
            <button onClick={() => setOpen(true)} className="w-fit text-[12px] font-medium text-brand hover:underline">
              + Relatório
            </button>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
