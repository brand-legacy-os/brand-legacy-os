"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  addCommercialProductAction,
  updateCommercialProductAction,
  deleteCommercialProductAction,
  type ActionState,
} from "@/lib/actions/events";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatCurrency } from "@/lib/format";

const initialState: ActionState = {};
const inputClass = "h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none";

const PAYMENT_METHOD_META: Record<string, string> = {
  cartao_credito_avista: "Cartão de crédito (à vista, consumindo limite)",
  cartao_credito_recorrencia: "Cartão de crédito (recorrência)",
  boleto: "Boleto",
  pix: "Pix",
  pix_recorrente: "Pix recorrente",
  outro: "Outro",
};

type Product = {
  id: string;
  name: string;
  value: number;
  minPaymentCondition: string | null;
  maxPaymentCondition: string | null;
  paymentMethod: string;
  paymentMethodOther: string | null;
  scope: string | null;
  deckUrl: string | null;
};

function ProductFormFields({ defaults }: { defaults?: Product }) {
  const [paymentMethod, setPaymentMethod] = useState(defaults?.paymentMethod ?? "");

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <input name="name" required defaultValue={defaults?.name} placeholder="Nome do produto" className={inputClass} />
        <input name="value" type="number" step="0.01" min="0" required defaultValue={defaults?.value} placeholder="Valor" className={inputClass} />
        <select
          name="paymentMethod"
          required
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Forma de pagamento…
          </option>
          {Object.entries(PAYMENT_METHOD_META).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        {paymentMethod === "outro" && (
          <input
            name="paymentMethodOther"
            required
            defaultValue={defaults?.paymentMethodOther ?? ""}
            placeholder="Qual forma de pagamento"
            className={inputClass}
          />
        )}
        <input name="minPaymentCondition" defaultValue={defaults?.minPaymentCondition ?? ""} placeholder="Condição mínima de pagamento" className={inputClass} />
        <input name="maxPaymentCondition" defaultValue={defaults?.maxPaymentCondition ?? ""} placeholder="Condição máxima de pagamento" className={inputClass} />
      </div>
      <textarea
        name="scope"
        rows={2}
        defaultValue={defaults?.scope ?? ""}
        placeholder="Resumo das entregas do produto"
        className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12.5px] outline-none"
      />
      <div className="flex flex-col gap-1">
        <span className="text-[11px] text-ink-faint">
          Deck do produto {defaults?.deckUrl ? "(já enviado — envie outro pra substituir)" : "(PDF ou PPT, opcional)"}
        </span>
        <input type="file" name="deck" accept=".pdf,.ppt,.pptx" className="text-[12px]" />
      </div>
    </div>
  );
}

export function CommercialProductsSection({
  eventId,
  products,
  canManage,
  exportHref,
}: {
  eventId: string;
  products: Product[];
  canManage: boolean;
  exportHref?: string;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addCommercialProductAction, initialState);
  const [editState, editFormAction, editPending] = useActionState(updateCommercialProductAction, initialState);
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
      title={`Produtos Comercializados (${products.length})`}
      right={
        exportHref ? (
          <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-col">
        {products.map((p) =>
          editingId === p.id ? (
            <form key={p.id} action={editFormAction} className="flex flex-col gap-2 border-t border-border py-3 first:border-t-0">
              <input type="hidden" name="productId" value={p.id} />
              <ProductFormFields defaults={p} />
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
            <div key={p.id} className="flex items-start justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
              <div className="flex flex-col gap-0.5 text-[12.5px]">
                <span className="text-ink">
                  {p.name} · {formatCurrency(p.value)}
                </span>
                <span className="text-[11px] text-ink-faint">
                  {p.paymentMethod === "outro" ? p.paymentMethodOther || "Outro" : PAYMENT_METHOD_META[p.paymentMethod] ?? p.paymentMethod}
                  {p.minPaymentCondition || p.maxPaymentCondition
                    ? ` · ${[p.minPaymentCondition, p.maxPaymentCondition].filter(Boolean).join(" a ")}`
                    : ""}
                </span>
                {p.scope && <span className="text-[11px] text-ink-faint">{p.scope}</span>}
                {p.deckUrl && (
                  <a href={p.deckUrl} target="_blank" rel="noopener noreferrer" className="w-fit text-[11px] text-brand hover:underline">
                    Ver deck
                  </a>
                )}
              </div>
              {canManage && (
                <div className="flex shrink-0 items-center gap-2.5">
                  <button onClick={() => setEditingId(p.id)} className="text-[11px] font-medium text-brand hover:underline">
                    editar
                  </button>
                  <form
                    action={deleteCommercialProductAction}
                    onSubmit={(e) => {
                      if (!confirm(`Remover "${p.name}"?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="productId" value={p.id} />
                    <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                      excluir
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        )}
        {products.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Nenhum produto cadastrado ainda.</p>}
      </div>

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <input type="hidden" name="eventId" value={eventId} />
              <ProductFormFields />
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
              + Produto
            </button>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}
