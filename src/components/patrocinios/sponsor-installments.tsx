"use client";

import { useActionState, useEffect, useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  toggleSponsorInstallmentPaidAction,
  addSponsorInstallmentAction,
  updateSponsorInstallmentAction,
  deleteSponsorInstallmentAction,
  type ActionState,
} from "@/lib/actions/sponsors";

const initialState: ActionState = {};

type Installment = { id: string; number: number; amount: number; dueDate: Date; paid: boolean; paidDate: Date | null };

function toDateInputValue(d: Date) {
  return new Date(d).toISOString().slice(0, 10);
}

function EditInstallmentForm({ installment, onDone }: { installment: Installment; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateSponsorInstallmentAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 rounded-(--radius-s) bg-surface-muted px-3 py-2">
      <input type="hidden" name="installmentId" value={installment.id} />
      <input
        name="dueDate"
        type="date"
        required
        defaultValue={toDateInputValue(installment.dueDate)}
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
      />
      <input
        name="amount"
        inputMode="decimal"
        required
        defaultValue={installment.amount}
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

function AddInstallmentForm({ sponsorId, onDone }: { sponsorId: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(addSponsorInstallmentAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2 rounded-(--radius-s) bg-surface-muted px-3 py-2">
      <input type="hidden" name="sponsorId" value={sponsorId} />
      <input name="dueDate" type="date" required className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
      <input name="amount" inputMode="decimal" placeholder="Valor" required className="h-8 w-28 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
      <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60">
        {pending ? "Salvando…" : "Adicionar"}
      </button>
      <button type="button" onClick={onDone} className="text-[11px] text-ink-faint hover:underline">
        Cancelar
      </button>
      {state.error && <span className="w-full text-[11px] text-critical">{state.error}</span>}
    </form>
  );
}

export function SponsorInstallments({
  sponsorId,
  installments,
  canManage,
}: {
  sponsorId: string;
  installments: Installment[];
  canManage: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {installments.length === 0 && (
        <p className="text-[12.5px] text-ink-faint">Nenhuma parcela lançada ainda.</p>
      )}

      {installments.map((i) =>
        editingId === i.id ? (
          <EditInstallmentForm key={i.id} installment={i} onDone={() => setEditingId(null)} />
        ) : (
          <div key={i.id} className="flex items-center justify-between rounded-(--radius-s) bg-surface-muted px-3 py-2">
            <div className="flex flex-col">
              <span className="text-[12.5px] font-medium text-ink">Parcela {i.number}</span>
              <span className="text-[11px] text-ink-faint">
                Vence {formatDate(i.dueDate)}
                {i.paid && i.paidDate ? ` · pago em ${formatDate(i.paidDate)}` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="tnum text-[13px] font-medium text-ink">{formatCurrency(i.amount)}</span>
              {canManage ? (
                <form action={toggleSponsorInstallmentPaidAction}>
                  <input type="hidden" name="installmentId" value={i.id} />
                  <input type="hidden" name="sponsorId" value={sponsorId} />
                  <button
                    type="submit"
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      i.paid ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"
                    }`}
                  >
                    {i.paid ? "Pago" : "Marcar como pago"}
                  </button>
                </form>
              ) : (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${i.paid ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"}`}>
                  {i.paid ? "Pago" : "Em aberto"}
                </span>
              )}
              {canManage && (
                <>
                  <button onClick={() => setEditingId(i.id)} className="text-[11px] font-medium text-brand hover:underline">
                    editar
                  </button>
                  <form
                    action={deleteSponsorInstallmentAction}
                    onSubmit={(e) => {
                      if (!confirm(`Excluir a parcela ${i.number}?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="installmentId" value={i.id} />
                    <input type="hidden" name="sponsorId" value={sponsorId} />
                    <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                      excluir
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        )
      )}

      {canManage && (
        <>
          {adding ? (
            <AddInstallmentForm sponsorId={sponsorId} onDone={() => setAdding(false)} />
          ) : (
            <button onClick={() => setAdding(true)} className="w-fit text-[11.5px] font-medium text-brand hover:underline">
              + Parcela
            </button>
          )}
        </>
      )}
    </div>
  );
}
