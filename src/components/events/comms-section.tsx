"use client";

import { useActionState, useRef, useEffect, useState, useTransition } from "react";
import {
  addCommsItemAction,
  updateCommsItemAction,
  updateCommsItemStatusAction,
  deleteCommsItemAction,
  type ActionState,
} from "@/lib/actions/events";
import { COMMS_STATUS_META } from "@/lib/sponsors";
import { formatDate } from "@/lib/format";

const initialState: ActionState = {};

type CommsItem = {
  id: string;
  date: Date;
  time: string | null;
  artUrl: string | null;
  artLink: string | null;
  message: string;
  objective: string | null;
  status: keyof typeof COMMS_STATUS_META;
};

function toDateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

/** Select controlado localmente — um <form action> comum reseta campos não
 * controlados pro defaultValue original assim que a Server Action resolve
 * (comportamento do React 19), então o status "voltava" pra planejado depois
 * de salvar "enviado" mesmo o banco já estando correto. */
function StatusSelect({ itemId, status, canManage }: { itemId: string; status: CommsItem["status"]; canManage: boolean }) {
  const [value, setValue] = useState(status);
  const [, startTransition] = useTransition();

  return (
    <select
      value={value}
      disabled={!canManage}
      onChange={(e) => {
        const next = e.target.value as CommsItem["status"];
        setValue(next);
        const fd = new FormData();
        fd.set("itemId", itemId);
        fd.set("status", next);
        startTransition(() => {
          updateCommsItemStatusAction(fd);
        });
      }}
      className="h-7 rounded-full border border-border bg-surface px-2 text-[11px] outline-none"
    >
      {Object.entries(COMMS_STATUS_META).map(([key, meta]) => (
        <option key={key} value={key}>
          {meta.label}
        </option>
      ))}
    </select>
  );
}

function EditCommsForm({ item, onDone }: { item: CommsItem; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateCommsItemAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="itemId" value={item.id} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input name="date" type="date" required defaultValue={toDateInputValue(item.date)} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
        <input name="time" type="time" defaultValue={item.time ?? ""} placeholder="Horário" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
        <input name="objective" defaultValue={item.objective ?? ""} placeholder="Objetivo" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
      </div>
      <textarea name="message" required defaultValue={item.message} rows={2} placeholder="Mensagem" className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[12.5px] outline-none" />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="artLink" defaultValue={item.artLink ?? ""} placeholder="Link da arte (opcional)" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
        <label className="flex flex-col gap-1">
          <span className="text-[10.5px] text-ink-faint">substituir upload da arte</span>
          <input name="art" type="file" accept="image/*" className="text-[12px]" />
        </label>
      </div>
      <div className="flex items-center gap-2.5">
        <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}

export function CommsSection({
  eventId,
  items,
  canManage,
}: {
  eventId: string;
  items: CommsItem[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addCommsItemAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <h2 className="text-[13px] font-medium text-ink-soft">Fluxo de comunicação com o grupo ({items.length})</h2>
      <div className="flex flex-col">
        {items.map((item) =>
          editingId === item.id ? (
            <div key={item.id} className="border-t border-border py-2.5 first:border-t-0">
              <EditCommsForm item={item} onDone={() => setEditingId(null)} />
            </div>
          ) : (
            <div key={item.id} className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
              <div className="flex flex-col gap-1">
                <span className="text-[11.5px] text-ink-faint">
                  {formatDate(item.date)}{item.time ? ` · ${item.time}` : ""}
                  {item.objective ? ` · ${item.objective}` : ""}
                </span>
                <p className="text-[12.5px] text-ink">{item.message}</p>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {item.artUrl && (
                    <a href={item.artUrl} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      Ver arte →
                    </a>
                  )}
                  {item.artLink && (
                    <a href={item.artLink} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                      Link da arte →
                    </a>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <StatusSelect itemId={item.id} status={item.status} canManage={canManage} />
                {canManage && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditingId(item.id)} className="text-[10.5px] font-medium text-brand hover:underline">
                      editar
                    </button>
                    <form
                      action={deleteCommsItemAction}
                      onSubmit={(e) => {
                        if (!confirm("Remover esta comunicação?")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="eventId" value={eventId} />
                      <button type="submit" className="text-[10.5px] text-ink-faint hover:text-critical">
                        remover
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {items.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Nenhuma comunicação planejada ainda.</p>}
      </div>

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <input type="hidden" name="eventId" value={eventId} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <input name="date" type="date" required className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
                <input name="time" type="time" placeholder="Horário" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
                <input name="objective" placeholder="Objetivo" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
              </div>
              <textarea name="message" required rows={2} placeholder="Mensagem" className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[12.5px] outline-none" />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="artLink" placeholder="Link da arte (opcional)" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
                <label className="flex flex-col gap-1">
                  <span className="text-[10.5px] text-ink-faint">ou upload da arte</span>
                  <input name="art" type="file" accept="image/*" className="text-[12px]" />
                </label>
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
              + Comunicação
            </button>
          )}
        </>
      )}
    </section>
  );
}
