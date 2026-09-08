"use client";

import { useActionState, useRef, useEffect, useState, useTransition } from "react";
import {
  addMediaTaskAction,
  toggleMediaTaskAction,
  deleteMediaTaskAction,
  type ActionState,
} from "@/lib/actions/events";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

const initialState: ActionState = {};

type MediaTask = { id: string; description: string; done: boolean };

export function MediaTasksSection({
  eventId,
  tasks,
  canManage,
  exportHref,
}: {
  eventId: string;
  tasks: MediaTask[];
  canManage: boolean;
  exportHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [state, formAction, addPending] = useActionState(addMediaTaskAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const done = tasks.filter((t) => t.done).length;

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <CollapsibleSection
      title="Entrega de fotos e vídeo — planejado x realizado"
      right={
        <div className="flex items-center gap-3">
          {exportHref && (
            <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
              Exportar Excel
            </a>
          )}
          {tasks.length > 0 && (
            <span className="text-[11.5px] text-ink-faint">
              {done}/{tasks.length} realizado{tasks.length === 1 ? "" : "s"}
            </span>
          )}
        </div>
      }
    >
      <div className="flex flex-col">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-center justify-between gap-2 border-t border-border py-2 first:border-t-0">
            <label className={`flex items-center gap-2 text-[12.5px] ${canManage ? "cursor-pointer" : ""} ${t.done ? "text-ink-faint line-through" : "text-ink"}`}>
              <input
                type="checkbox"
                defaultChecked={t.done}
                disabled={!canManage || pending}
                onChange={() => {
                  const fd = new FormData();
                  fd.set("taskId", t.id);
                  startTransition(() => {
                    toggleMediaTaskAction(fd);
                  });
                }}
                className="accent-brand-deep"
              />
              {t.description}
            </label>
            {canManage && (
              <form
                action={deleteMediaTaskAction}
                onSubmit={(e) => {
                  if (!confirm("Remover esse item?")) e.preventDefault();
                }}
              >
                <input type="hidden" name="taskId" value={t.id} />
                <input type="hidden" name="eventId" value={eventId} />
                <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                  remover
                </button>
              </form>
            )}
          </div>
        ))}
        {tasks.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Nenhum item planejado ainda.</p>}
      </div>

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <input type="hidden" name="eventId" value={eventId} />
              <input
                name="description"
                required
                placeholder="O que precisa ser entregue (ex.: recap em vídeo do dia 1)"
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
              />
              <div className="flex items-center gap-2.5">
                <button type="submit" disabled={addPending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
                  {addPending ? "Salvando…" : "Adicionar"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
                  Cancelar
                </button>
                {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
              </div>
            </form>
          ) : (
            <button onClick={() => setOpen(true)} className="w-fit text-[12px] font-medium text-brand hover:underline">
              + Item planejado
            </button>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
