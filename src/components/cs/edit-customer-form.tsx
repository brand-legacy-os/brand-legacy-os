"use client";

import { useActionState, useState } from "react";
import { updateCustomerAction, type ActionState } from "@/lib/actions/cs";
import { PRODUCTS } from "@/lib/products";

const initialState: ActionState = {};

type CustomerFields = {
  id: string;
  name: string;
  company: string | null;
  product: string;
  csId: string;
  entryDate: string;
  startDate: string;
  endDate: string;
  renewalDate: string;
  mrr: string;
  contractValue: string;
  contractUrl: string;
  otherDocsUrl: string;
  notes: string;
};

export function EditCustomerForm({
  customer,
  csReps,
}: {
  customer: CustomerFields;
  csReps: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateCustomerAction, initialState);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="h-8 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-ink-soft hover:bg-surface-muted">
        Editar dados
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4">
      <input type="hidden" name="customerId" value={customer.id} />
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <input name="name" defaultValue={customer.name} required placeholder="Nome" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="company" defaultValue={customer.company ?? ""} placeholder="Empresa" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="product" list="cs-products-edit" defaultValue={customer.product} required placeholder="Produto" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <datalist id="cs-products-edit">
          {PRODUCTS.map((p) => <option key={p} value={p} />)}
        </datalist>
        <select name="csId" defaultValue={customer.csId} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          {csReps.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Entrada</label>
          <input name="entryDate" type="date" defaultValue={customer.entryDate} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Início</label>
          <input name="startDate" type="date" defaultValue={customer.startDate} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Término</label>
          <input name="endDate" type="date" defaultValue={customer.endDate} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Renovação</label>
          <input name="renewalDate" type="date" defaultValue={customer.renewalDate} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <input name="mrr" inputMode="decimal" defaultValue={customer.mrr} placeholder="MRR (R$)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="contractValue" inputMode="decimal" defaultValue={customer.contractValue} placeholder="Valor contratado (R$)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="contractUrl" defaultValue={customer.contractUrl} placeholder="Link do contrato" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="otherDocsUrl" defaultValue={customer.otherDocsUrl} placeholder="Outros documentos" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <textarea name="notes" defaultValue={customer.notes} rows={2} placeholder="Observações gerais" className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none" />
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
