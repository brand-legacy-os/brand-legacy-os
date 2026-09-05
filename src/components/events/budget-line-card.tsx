"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  toggleBudgetLinePaymentAction,
  addBudgetLinePaymentAction,
  updateBudgetLinePaymentAction,
  deleteBudgetLinePaymentAction,
  updateBudgetLineAction,
  deleteBudgetLineAction,
  type ActionState,
} from "@/lib/actions/events";
import { budgetLineStatusTone, BUDGET_LINE_STATUS_OPTIONS } from "@/lib/events";
import { EVENT_BUDGET_CATEGORY_META } from "@/lib/sponsors";
import { StatusPill } from "@/components/ui/status-pill";
import { formatCompactCurrency, formatDate } from "@/lib/format";

const initialState: ActionState = {};
const inputClass =
  "h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12px] outline-none";

type Line = {
  id: string;
  category: keyof typeof EVENT_BUDGET_CATEGORY_META;
  item: string;
  description: string | null;
  supplier: string | null;
  supplierCnpj: string | null;
  supplierContact: string | null;
  supplierPhone: string | null;
  quantity: number | null;
  unitValue: number | null;
  nfUrl: string | null;
  paymentMethod: string | null;
  status: string | null;
  plannedValue: number | null;
  actualValue: number | null;
  payments: { id: string; dueDate: Date; amount: number; paid: boolean }[];
};

function toDateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function EditPaymentForm({
  payment,
  onDone,
}: {
  payment: { id: string; dueDate: Date; amount: number };
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(updateBudgetLinePaymentAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="paymentId" value={payment.id} />
      <input
        name="dueDate"
        type="date"
        required
        defaultValue={toDateInputValue(payment.dueDate)}
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
      />
      <input
        name="amount"
        inputMode="decimal"
        required
        defaultValue={payment.amount}
        className="h-8 w-28 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
      />
      <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60">
        {pending ? "Salvando…" : "Salvar"}
      </button>
      <button type="button" onClick={onDone} className="text-[11px] text-ink-faint hover:underline">
        Cancelar
      </button>
      {state.error && <span className="w-full text-[11px] text-critical">{state.error}</span>}
    </form>
  );
}

export function BudgetLineCard({ line, canManage }: { line: Line; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(
    addBudgetLinePaymentAction,
    initialState
  );
  const [editState, editFormAction, editPending] = useActionState(updateBudgetLineAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  useEffect(() => {
    if (editState.success) setEditing(false);
  }, [editState.success]);

  const paidTotal = line.payments.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0);
  const scheduledTotal = line.payments.reduce((s, p) => s + p.amount, 0);
  const categoryLabel = EVENT_BUDGET_CATEGORY_META[line.category]?.label ?? line.category;

  return (
    <div className="flex flex-col gap-2 border-t border-border py-2.5 first:border-t-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[12.5px] font-medium text-ink">{line.item}</span>
          <span className="text-[11px] text-ink-faint">
            {categoryLabel}
            {line.supplier ? ` · ${line.supplier}` : ""}
            {line.paymentMethod ? ` · ${line.paymentMethod}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="tnum whitespace-nowrap text-[12.5px] text-ink-soft">
            {formatCompactCurrency(line.actualValue ?? 0)} /{" "}
            {formatCompactCurrency(line.plannedValue ?? 0)}
          </span>
          <button onClick={() => setShowDetails((v) => !v)} className="text-[11px] font-medium text-ink-soft hover:text-ink">
            {showDetails ? "ocultar detalhes" : "ver detalhes"}
          </button>
          {canManage && (
            <>
              <button onClick={() => setEditing((v) => !v)} className="text-[11px] font-medium text-brand hover:underline">
                {editing ? "fechar" : "editar"}
              </button>
              <form
                action={deleteBudgetLineAction}
                onSubmit={(e) => {
                  if (!confirm(`Excluir "${line.item}"? Isso também remove as parcelas e qualquer lançamento de caixa vinculado.`)) {
                    e.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="lineId" value={line.id} />
                <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                  excluir
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {showDetails && (
        <>
      {line.description && (
        <p className="text-[11.5px] text-ink-soft">{line.description}</p>
      )}
      {(line.supplierCnpj || line.supplierContact || line.supplierPhone) && (
        <p className="text-[11px] text-ink-faint">
          {[line.supplierCnpj, line.supplierContact, line.supplierPhone].filter(Boolean).join(" · ")}
        </p>
      )}
      {(line.quantity || line.unitValue) && (
        <p className="text-[11px] text-ink-faint">
          {line.quantity ?? "—"} un./dias × {formatCompactCurrency(line.unitValue ?? 0)}
        </p>
      )}
      {line.nfUrl && (
        <a href={line.nfUrl} target="_blank" rel="noopener noreferrer" className="w-fit text-[11.5px] text-brand hover:underline">
          Ver NF →
        </a>
      )}
      {line.status && (
        <StatusPill label={line.status} tone={budgetLineStatusTone(line.status)} />
      )}

      {line.payments.length > 0 && (
        <div className="flex flex-col gap-1 rounded-(--radius-s) bg-surface-muted p-2">
          <div className="flex items-center justify-between text-[11px] text-ink-faint">
            <span>Parcelas ({line.payments.length})</span>
            <span className="tnum">
              pago {formatCompactCurrency(paidTotal)} / {formatCompactCurrency(scheduledTotal)}
            </span>
          </div>
          {line.payments.map((p) =>
            editingPaymentId === p.id ? (
              <EditPaymentForm key={p.id} payment={p} onDone={() => setEditingPaymentId(null)} />
            ) : (
              <div key={p.id} className="flex items-center gap-2">
                <form action={toggleBudgetLinePaymentAction}>
                  <input type="hidden" name="paymentId" value={p.id} />
                  <button
                    type="submit"
                    disabled={!canManage}
                    className={`h-4 w-4 shrink-0 rounded border ${p.paid ? "border-brand-deep bg-brand-deep" : "border-border-strong"}`}
                    aria-label={p.paid ? "Marcar como não pago" : "Marcar como pago"}
                  />
                </form>
                <span className="text-[12px] text-ink-soft">
                  {formatCompactCurrency(p.amount)} · {p.paid ? "pago" : "vence"}{" "}
                  {formatDate(p.dueDate)}
                </span>
                {canManage && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      onClick={() => setEditingPaymentId(p.id)}
                      className="text-[10.5px] font-medium text-brand hover:underline"
                    >
                      editar
                    </button>
                    <form
                      action={deleteBudgetLinePaymentAction}
                      onSubmit={(e) => {
                        if (!confirm("Excluir esta parcela?")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="paymentId" value={p.id} />
                      <button type="submit" className="text-[10.5px] text-ink-faint hover:text-critical">
                        excluir
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="budgetLineId" value={line.id} />
              <input
                name="dueDate"
                type="date"
                required
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
              <input
                name="amount"
                inputMode="decimal"
                placeholder="Valor da parcela"
                required
                className="h-8 w-32 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
              <button
                type="submit"
                disabled={pending}
                className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60"
              >
                Adicionar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[11.5px] text-ink-faint hover:underline"
              >
                Fechar
              </button>
              {state.error && (
                <span className="w-full text-[11px] text-critical">{state.error}</span>
              )}
            </form>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-fit text-[11.5px] font-medium text-brand hover:underline"
            >
              + Parcela (à vista = 1 parcela, parcelado = várias)
            </button>
          )}
        </>
      )}
        </>
      )}

      {editing && (
        <form action={editFormAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
          <input type="hidden" name="lineId" value={line.id} />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <select name="category" required defaultValue={line.category} className={inputClass}>
              {Object.entries(EVENT_BUDGET_CATEGORY_META).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
            <input name="item" required defaultValue={line.item} className={`${inputClass} sm:col-span-2`} />
            <input name="supplier" defaultValue={line.supplier ?? ""} placeholder="Fornecedor" className={inputClass} />
            <input name="supplierCnpj" defaultValue={line.supplierCnpj ?? ""} placeholder="CNPJ" className={inputClass} />
            <input name="supplierContact" defaultValue={line.supplierContact ?? ""} placeholder="Contato" className={inputClass} />
            <input name="supplierPhone" defaultValue={line.supplierPhone ?? ""} placeholder="Telefone" className={inputClass} />
            <input name="quantity" defaultValue={line.quantity ?? ""} inputMode="decimal" placeholder="Unidades/dias" className={inputClass} />
            <input name="unitValue" defaultValue={line.unitValue ?? ""} inputMode="decimal" placeholder="Valor unidade" className={inputClass} />
            <input name="plannedValue" defaultValue={line.plannedValue ?? ""} inputMode="decimal" placeholder="Previsto" className={inputClass} />
            <input name="actualValue" defaultValue={line.actualValue ?? ""} inputMode="decimal" placeholder="Valor total" className={inputClass} />
            <input name="paymentMethod" defaultValue={line.paymentMethod ?? ""} placeholder="Forma de pagamento" className={inputClass} />
            <select name="status" defaultValue={line.status ?? ""} className={inputClass}>
              <option value="">Status…</option>
              {BUDGET_LINE_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] text-ink-soft">Substituir NF</span>
            <input name="nf" type="file" accept="image/*,application/pdf" className="text-[12px]" />
          </label>
          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={editPending}
              className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft disabled:opacity-60"
            >
              {editPending ? "Salvando…" : "Salvar"}
            </button>
            {editState.error && <span className="text-[11px] text-critical">{editState.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
