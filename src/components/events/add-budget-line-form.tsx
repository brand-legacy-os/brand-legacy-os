"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { addBudgetLineAction, type ActionState } from "@/lib/actions/events";
import { BUDGET_LINE_STATUS_OPTIONS } from "@/lib/events";
import { EVENT_BUDGET_CATEGORY_META } from "@/lib/sponsors";

const initialState: ActionState = {};
const inputClass =
  "h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none";

export function AddBudgetLineForm({ eventId }: { eventId: string }) {
  const [open, setOpen] = useState(false);
  const [paymentPlan, setPaymentPlan] = useState<"avista" | "parcelado">("avista");
  const [installmentCount, setInstallmentCount] = useState(1);
  const [state, formAction, pending] = useActionState(
    addBudgetLineAction,
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
        className="w-fit text-[12.5px] font-medium text-brand hover:underline"
      >
        + Realizado
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-s) bg-surface-muted p-3"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select name="category" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Categoria…
          </option>
          {Object.entries(EVENT_BUDGET_CATEGORY_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <input name="item" required placeholder="Descrição da despesa" className={`${inputClass} sm:col-span-2`} />
        <input name="supplier" placeholder="Fornecedor" className={inputClass} />
        <input name="supplierCnpj" placeholder="CNPJ do fornecedor" className={inputClass} />
        <input name="supplierContact" placeholder="Contato no fornecedor" className={inputClass} />
        <input name="supplierPhone" placeholder="Telefone do fornecedor" className={inputClass} />
        <input name="quantity" inputMode="decimal" placeholder="Unidades/dias" className={inputClass} />
        <input name="unitValue" inputMode="decimal" placeholder="Valor por unidade/dia" className={inputClass} />
        <input name="plannedValue" inputMode="decimal" placeholder="Previsto (R$)" className={inputClass} />
        <input name="actualValue" inputMode="decimal" placeholder="Valor total (R$)" className={inputClass} />
        <input name="paymentMethod" placeholder="Forma de pagamento" className={inputClass} />
        <select name="status" defaultValue="" className={inputClass}>
          <option value="">Status…</option>
          {BUDGET_LINE_STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-[11px] font-medium text-ink-soft">NF — arquivo ou foto</span>
        <input name="nf" type="file" accept="image/*,application/pdf" className="text-[12px]" />
      </label>

      <div className="flex flex-col gap-2 rounded-(--radius-s) bg-surface p-2.5">
        <span className="text-[11px] font-medium text-ink-soft">À vista ou parcelado</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-[12.5px] text-ink">
            <input
              type="radio"
              checked={paymentPlan === "avista"}
              onChange={() => setPaymentPlan("avista")}
            />
            À vista
          </label>
          <label className="flex items-center gap-1.5 text-[12.5px] text-ink">
            <input
              type="radio"
              checked={paymentPlan === "parcelado"}
              onChange={() => setPaymentPlan("parcelado")}
            />
            Parcelado
          </label>
        </div>
        {paymentPlan === "parcelado" && (
          <div className="flex flex-col gap-2 border-t border-border pt-2">
            <label className="flex w-fit flex-col gap-1">
              <span className="text-[11px] text-ink-soft">Número de parcelas</span>
              <input
                name="installmentCount"
                type="number"
                min="1"
                max="24"
                value={installmentCount}
                onChange={(e) => setInstallmentCount(Math.max(1, Number(e.target.value) || 1))}
                className={`${inputClass} w-24`}
              />
            </label>
            {Array.from({ length: installmentCount }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-16 shrink-0 text-[11px] text-ink-faint">Parcela {i + 1}</span>
                <input
                  name={`installmentAmount_${i}`}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Valor"
                  className={`${inputClass} flex-1`}
                />
                <input
                  name={`installmentDueDate_${i}`}
                  type="date"
                  className={`${inputClass} flex-1`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Adicionar"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12px] text-ink-faint hover:underline"
        >
          Fechar
        </button>
        {state.error && (
          <span className="text-[11.5px] text-critical">{state.error}</span>
        )}
      </div>
    </form>
  );
}
