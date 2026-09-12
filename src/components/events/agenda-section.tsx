"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  addAgendaItemAction,
  updateAgendaItemAction,
  deleteAgendaItemAction,
  type ActionState,
} from "@/lib/actions/events";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatDate } from "@/lib/format";

const initialState: ActionState = {};
const inputClass = "h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none";

type AgendaItem = {
  id: string;
  title: string;
  who: string | null;
  startTime: string | null;
  endTime: string | null;
  objective: string | null;
  notes: string | null;
};
type Day = { id: string; date: string | Date; agenda: AgendaItem[] };

function AgendaItemFields({ defaults }: { defaults?: AgendaItem }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <input name="title" required defaultValue={defaults?.title} placeholder="O que" className={`${inputClass} sm:col-span-2`} />
      <input name="who" defaultValue={defaults?.who ?? ""} placeholder="Quem" className={inputClass} />
      <input name="startTime" defaultValue={defaults?.startTime ?? ""} placeholder="Início (ex.: 09:00)" className={inputClass} />
      <input name="endTime" defaultValue={defaults?.endTime ?? ""} placeholder="Término (ex.: 10:00)" className={inputClass} />
      <input name="objective" defaultValue={defaults?.objective ?? ""} placeholder="Objetivo" className={inputClass} />
      <textarea
        name="notes"
        rows={2}
        defaultValue={defaults?.notes ?? ""}
        placeholder="Observação"
        className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12.5px] outline-none sm:col-span-3"
      />
    </div>
  );
}

function DayAgenda({ day, eventId, canManage }: { day: Day; eventId: string; canManage: boolean }) {
  const [addingOpen, setAddingOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addAgendaItemAction, initialState);
  const [editState, editFormAction, editPending] = useActionState(updateAgendaItemAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setAddingOpen(false);
    }
  }, [state.success]);

  useEffect(() => {
    if (editState.success) setEditingId(null);
  }, [editState.success]);

  return (
    <div className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
      <span className="text-[12.5px] font-medium text-ink-soft">{formatDate(new Date(day.date))}</span>
      <div className="flex flex-col">
        {day.agenda.map((item) =>
          editingId === item.id ? (
            <form key={item.id} action={editFormAction} className="flex flex-col gap-2 border-t border-border py-2 first:border-t-0">
              <input type="hidden" name="itemId" value={item.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <AgendaItemFields defaults={item} />
              <div className="flex items-center gap-2.5">
                <button type="submit" disabled={editPending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
                  {editPending ? "Salvando…" : "Salvar"}
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="text-[11.5px] text-ink-faint hover:underline">
                  cancelar
                </button>
                {editState.error && <span className="text-[11px] text-critical">{editState.error}</span>}
              </div>
            </form>
          ) : (
            <div key={item.id} className="flex items-center justify-between gap-2 border-t border-border py-2 text-[12.5px] first:border-t-0">
              <div className="flex flex-col">
                <span className="text-ink">
                  {item.startTime ? `${item.startTime}${item.endTime ? `–${item.endTime}` : ""} · ` : ""}
                  {item.title}
                  {item.who ? ` · ${item.who}` : ""}
                </span>
                {(item.objective || item.notes) && (
                  <span className="text-[11px] text-ink-faint">
                    {[item.objective, item.notes].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-2.5">
                  <button onClick={() => setEditingId(item.id)} className="text-[11px] font-medium text-brand hover:underline">
                    editar
                  </button>
                  <form
                    action={deleteAgendaItemAction}
                    onSubmit={(e) => {
                      if (!confirm(`Remover "${item.title}"?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="itemId" value={item.id} />
                    <input type="hidden" name="eventId" value={eventId} />
                    <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                      excluir
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        )}
        {day.agenda.length === 0 && <p className="py-1.5 text-[11.5px] text-ink-faint">Nada na agenda desse dia ainda.</p>}
      </div>

      {canManage && (
        <>
          {addingOpen ? (
            <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <input type="hidden" name="eventDayId" value={day.id} />
              <input type="hidden" name="eventId" value={eventId} />
              <AgendaItemFields />
              <div className="flex items-center gap-2.5">
                <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
                  {pending ? "Salvando…" : "Adicionar"}
                </button>
                <button type="button" onClick={() => setAddingOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
                  Cancelar
                </button>
                {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
              </div>
            </form>
          ) : (
            <button onClick={() => setAddingOpen(true)} className="w-fit text-[11.5px] font-medium text-brand hover:underline">
              + Item na agenda
            </button>
          )}
        </>
      )}
    </div>
  );
}

export function AgendaSection({
  eventId,
  days,
  canManage,
  exportHref,
}: {
  eventId: string;
  days: Day[];
  canManage: boolean;
  exportHref?: string;
}) {
  return (
    <CollapsibleSection
      title="Ordem do dia"
      right={
        exportHref ? (
          <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-col">
        {days.map((day) => (
          <DayAgenda key={day.id} day={day} eventId={eventId} canManage={canManage} />
        ))}
        {days.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Defina as datas do evento pra montar a agenda.</p>}
      </div>
    </CollapsibleSection>
  );
}
