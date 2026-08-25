"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createPayableAction, type ActionState } from "@/lib/actions/finance";

const initialState: ActionState = {};

export function CreatePayableForm() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createPayableAction,
    initialState
  );
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
        className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft hover:opacity-90"
      >
        + Conta a pagar
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex w-full flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input name="fornecedor" required placeholder="Fornecedor" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none" />
        <input name="descricao" required placeholder="Descrição" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none sm:col-span-2" />
        <input name="categoria" placeholder="Categoria" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none" />
        <input name="centroCusto" placeholder="Centro de custo" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none" />
        <input name="competencia" placeholder="Competência (AAAA-MM)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none" />
        <input name="vencimento" type="date" required className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none" />
        <input name="valorPrevisto" inputMode="decimal" required placeholder="Valor previsto (R$)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none" />
        <input name="formaPagamento" placeholder="Forma de pagamento" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none" />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Adicionar"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
