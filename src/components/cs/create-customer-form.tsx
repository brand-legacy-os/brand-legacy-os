"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createCustomerAction, type ActionState } from "@/lib/actions/cs";
import { CUSTOMER_STATUS_META } from "@/lib/cs";
import { PRODUCTS } from "@/lib/products";

const initialState: ActionState = {};

export function CreateCustomerForm({
  csReps,
}: {
  csReps: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createCustomerAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-fit rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft hover:opacity-90"
      >
        + Novo mentorado
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="name"
          required
          placeholder="Nome do mentorado"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="company"
          placeholder="Empresa"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="product"
          list="cs-products"
          required
          placeholder="Produto"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <datalist id="cs-products">
          {PRODUCTS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        <select
          name="csId"
          required
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="" disabled>
            CS responsável…
          </option>
          {csReps.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data de entrada</label>
          <input name="entryDate" type="date" required className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data de início</label>
          <input name="startDate" type="date" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data de renovação</label>
          <input name="renewalDate" type="date" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        </div>
        <select
          name="status"
          defaultValue="ativo"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          {Object.entries(CUSTOMER_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="mrr"
          inputMode="decimal"
          placeholder="MRR (R$)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="contractValue"
          inputMode="decimal"
          placeholder="Valor contratado (R$)"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="contractUrl"
          placeholder="Link do contrato — https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="otherDocsUrl"
          placeholder="Outros documentos — https://…"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Adicionar mentorado"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12.5px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
