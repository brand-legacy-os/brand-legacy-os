"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  addMediaDeliverableAction,
  updateMediaDeliverableAction,
  deleteMediaDeliverableAction,
  type ActionState,
} from "@/lib/actions/events";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatDate } from "@/lib/format";

const initialState: ActionState = {};
const inputClass = "h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none";

type User = { id: string; name: string };
type Deliverable = {
  id: string;
  title: string;
  objective: string | null;
  trackingOwner: User | null;
  executionOwner: User | null;
  executionOwnerOther: string | null;
  plannedDate: string | Date | null;
  isQuantityDelivery: boolean;
  plannedQuantity: number | null;
  deliveredQuantity: number | null;
  notes: string | null;
  fileLabel: string | null;
  fileUrl: string | null;
  realizations: { id: string; date: string | Date }[];
};

function DeliverableFormFields({ defaults, users }: { defaults?: Deliverable; users: User[] }) {
  const [executionOwner, setExecutionOwner] = useState(
    defaults?.executionOwner?.id ? defaults.executionOwner.id : defaults?.executionOwnerOther ? "outros" : ""
  );
  const [isQuantity, setIsQuantity] = useState(defaults?.isQuantityDelivery ?? false);
  const [realizationDates, setRealizationDates] = useState<string[]>(
    defaults?.realizations.length
      ? defaults.realizations.map((r) => new Date(r.date).toISOString().slice(0, 10))
      : [""]
  );
  const plannedDateValue = defaults?.plannedDate ? new Date(defaults.plannedDate).toISOString().slice(0, 10) : "";

  return (
    <div className="flex flex-col gap-2">
      <input name="title" required defaultValue={defaults?.title} placeholder="O que precisa ser entregue" className={inputClass} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="objective" defaultValue={defaults?.objective ?? ""} placeholder="Objetivo" className={inputClass} />
        <input name="plannedDate" type="date" defaultValue={plannedDateValue} className={inputClass} />
        <select name="trackingOwnerId" defaultValue={defaults?.trackingOwner?.id ?? ""} className={inputClass}>
          <option value="">Responsável pelo acompanhamento…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select
          name="executionOwnerId"
          value={executionOwner}
          onChange={(e) => setExecutionOwner(e.target.value)}
          className={inputClass}
        >
          <option value="">Responsável pela realização…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
          <option value="outros">Outros</option>
        </select>
        {executionOwner === "outros" && (
          <input
            name="executionOwnerOther"
            defaultValue={defaults?.executionOwnerOther ?? ""}
            placeholder="Quem"
            className={`${inputClass} sm:col-span-2`}
          />
        )}
      </div>

      <label className="flex items-center gap-1.5 text-[12px] text-ink-soft">
        <input
          type="checkbox"
          name="isQuantityDelivery"
          checked={isQuantity}
          onChange={(e) => setIsQuantity(e.target.checked)}
          className="accent-brand-deep"
        />
        É uma entrega de quantidade?
      </label>
      {isQuantity && (
        <div className="grid grid-cols-2 gap-2">
          <input
            name="plannedQuantity"
            type="number"
            min="0"
            defaultValue={defaults?.plannedQuantity ?? ""}
            placeholder="Quantidade planejada"
            className={inputClass}
          />
          <input
            name="deliveredQuantity"
            type="number"
            min="0"
            defaultValue={defaults?.deliveredQuantity ?? ""}
            placeholder="Quantidade entregue"
            className={inputClass}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-ink-faint">Data(s) de realização</span>
        {realizationDates.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              name={`realizationDate_${i}`}
              type="date"
              defaultValue={d}
              className={inputClass}
            />
            {realizationDates.length > 1 && (
              <button
                type="button"
                onClick={() => setRealizationDates((prev) => prev.filter((_, idx) => idx !== i))}
                className="text-[11px] text-ink-faint hover:text-critical"
              >
                remover
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => setRealizationDates((prev) => [...prev, ""])}
          className="w-fit text-[11px] font-medium text-brand hover:underline"
        >
          + adicionar outra data
        </button>
      </div>

      <textarea
        name="notes"
        rows={2}
        placeholder="Observações"
        defaultValue={defaults?.notes ?? ""}
        className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12.5px] outline-none"
      />

      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-ink-faint">
          Anexo {defaults?.fileUrl ? `(atual: ${defaults.fileLabel ?? "arquivo"})` : "(opcional)"}
        </span>
        <input type="file" name="file" accept="image/*,.pdf,.ppt,.pptx" className="text-[12px]" />
      </div>
    </div>
  );
}

export function MediaDeliverablesSection({
  eventId,
  deliverables,
  users,
  canManage,
  exportHref,
}: {
  eventId: string;
  deliverables: Deliverable[];
  users: User[];
  canManage: boolean;
  exportHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addMediaDeliverableAction, initialState);
  const [editState, editFormAction, editPending] = useActionState(updateMediaDeliverableAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  useEffect(() => {
    if (editState.success) setEditingId(null);
  }, [editState.success]);

  return (
    <CollapsibleSection
      title={`Entrega de fotos e vídeo (${deliverables.length})`}
      right={
        exportHref ? (
          <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-col">
        {deliverables.map((d) =>
          editingId === d.id ? (
            <form
              key={d.id}
              action={editFormAction}
              className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0"
            >
              <input type="hidden" name="deliverableId" value={d.id} />
              <DeliverableFormFields defaults={d} users={users} />
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
            <div key={d.id} className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <span className="text-ink">{d.title}</span>
                <span className="text-[11px] text-ink-faint">
                  {d.objective ? `${d.objective} · ` : ""}
                  Acompanha: {d.trackingOwner?.name ?? "—"} · Realiza: {d.executionOwner?.name ?? d.executionOwnerOther ?? "—"}
                  {d.plannedDate ? ` · Previsto ${formatDate(new Date(d.plannedDate))}` : ""}
                </span>
                {d.realizations.length > 0 && (
                  <span className="text-[11px] text-ink-faint">
                    Realizado: {d.realizations.map((r) => formatDate(new Date(r.date))).join(", ")}
                  </span>
                )}
                {d.isQuantityDelivery && (
                  <span className="text-[11px] text-ink-faint">
                    Quantidade: {d.deliveredQuantity ?? 0} / {d.plannedQuantity ?? "—"}
                  </span>
                )}
                {d.notes && <span className="text-[11px] text-ink-faint">{d.notes}</span>}
                {d.fileUrl && (
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer" className="w-fit text-[11px] text-brand hover:underline">
                    {d.fileLabel ?? "Ver anexo"}
                  </a>
                )}
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-2.5">
                  <button onClick={() => setEditingId(d.id)} className="text-[11px] font-medium text-brand hover:underline">
                    editar
                  </button>
                  <form
                    action={deleteMediaDeliverableAction}
                    onSubmit={(e) => {
                      if (!confirm(`Remover "${d.title}"?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="deliverableId" value={d.id} />
                    <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                      excluir
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        )}
        {deliverables.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Nenhuma entrega planejada ainda.</p>}
      </div>

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} encType="multipart/form-data" className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <input type="hidden" name="eventId" value={eventId} />
              <DeliverableFormFields users={users} />
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
              + Item planejado
            </button>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
