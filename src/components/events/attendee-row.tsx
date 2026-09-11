"use client";

import { useTransition, useState, useActionState, useEffect } from "react";
import {
  toggleAttendeeCheckedInAction,
  toggleAttendeeWhatsappAction,
  toggleAttendeeDinnerAction,
  setAttendeeNpsAction,
  updateAttendeeAction,
  deleteAttendeeAction,
  addAttendeeSaleAction,
  updateAttendeeSaleAction,
  deleteAttendeeSaleAction,
  type ActionState,
} from "@/lib/actions/events";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";
import { CUSTOMER_STATUS_META } from "@/lib/cs";
import { PRODUCTS } from "@/lib/products";
import { formatCurrency, formatDate } from "@/lib/format";
import { AttendeeFormFields } from "./attendee-form-fields";

const initialState: ActionState = {};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  pix: "Pix",
  boleto: "Boleto",
  cartao: "Cartão",
  outro: "Outro",
};

type Sale = {
  id: string;
  program: string;
  programOther: string | null;
  value: number;
  paymentPlan: string;
  installmentCount: number | null;
  paymentMethod: string;
  paymentMethodOther: string | null;
  notes: string | null;
  saleDate: string | Date;
  seller: { id: string; name: string } | null;
  installments: { number: number; dueDate: string | Date; amount: number | null }[];
};

/** Campos compartilhados entre o form de adicionar e o de editar venda. */
function SaleFormFields({
  defaults,
  users,
}: {
  defaults?: Sale;
  users: { id: string; name: string }[];
}) {
  const [paymentPlan, setPaymentPlan] = useState(defaults?.paymentPlan ?? "avista");
  const [paymentMethod, setPaymentMethod] = useState(defaults?.paymentMethod ?? "");
  const [program, setProgram] = useState(defaults?.program ?? "");
  const [installmentCount, setInstallmentCount] = useState(defaults?.installmentCount ?? 1);
  const dateValue = defaults?.saleDate
    ? new Date(defaults.saleDate).toISOString().slice(0, 10)
    : undefined;

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <select
          name="program"
          required
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
        >
          <option value="" disabled>
            Programa…
          </option>
          {PRODUCTS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value="Outros">Outros</option>
        </select>
        {program === "Outros" && (
          <input
            name="programOther"
            required
            placeholder="Qual programa"
            defaultValue={defaults?.programOther ?? ""}
            className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
          />
        )}
        <input name="value" type="number" step="0.01" min="0" required placeholder="Valor" defaultValue={defaults?.value} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
        <input name="saleDate" type="date" required defaultValue={dateValue} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
        <select
          name="paymentPlan"
          value={paymentPlan}
          onChange={(e) => setPaymentPlan(e.target.value)}
          className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
        >
          <option value="avista">À vista</option>
          <option value="parcelado">Parcelado</option>
        </select>
        {paymentPlan === "parcelado" && (
          <input
            name="installmentCount"
            type="number"
            min="1"
            max="24"
            placeholder="Nº parcelas"
            value={installmentCount}
            onChange={(e) => setInstallmentCount(Math.max(1, Number(e.target.value) || 1))}
            className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
          />
        )}
        <select
          name="paymentMethod"
          required
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
        >
          <option value="" disabled>
            Meio de pagamento…
          </option>
          <option value="pix">Pix</option>
          <option value="boleto">Boleto</option>
          <option value="cartao">Cartão</option>
          <option value="outro">Outro</option>
        </select>
        {paymentMethod === "outro" && (
          <input
            name="paymentMethodOther"
            placeholder="Qual meio de pagamento"
            defaultValue={defaults?.paymentMethodOther ?? ""}
            className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
          />
        )}
        <select name="sellerId" defaultValue={defaults?.seller?.id ?? ""} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none">
          <option value="">Vendedor (opcional)</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {paymentPlan === "parcelado" && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] text-ink-faint">Data e valor acordados por parcela</span>
          {Array.from({ length: installmentCount }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-16 shrink-0 text-[11px] text-ink-faint">Parcela {i + 1}</span>
              <input
                name={`installmentDueDate_${i}`}
                type="date"
                defaultValue={
                  defaults?.installments?.[i]?.dueDate
                    ? new Date(defaults.installments[i].dueDate).toISOString().slice(0, 10)
                    : undefined
                }
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
              <input
                name={`installmentAmount_${i}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="Valor"
                defaultValue={defaults?.installments?.[i]?.amount ?? undefined}
                className="h-8 w-24 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none"
              />
            </div>
          ))}
        </div>
      )}

      <textarea
        name="notes"
        rows={2}
        placeholder="Observação (opcional)"
        defaultValue={defaults?.notes ?? ""}
        className="rounded-(--radius-s) border border-border bg-surface p-2 text-[12px] outline-none"
      />
    </div>
  );
}

export function AttendeeRow({
  attendee,
  canManage,
  users,
}: {
  attendee: {
    id: string;
    name: string;
    empresa: string | null;
    category: keyof typeof ATTENDEE_CATEGORY_META;
    ticketType: string | null;
    email: string | null;
    phone: string | null;
    cpfRg: string | null;
    instagram: string | null;
    instagramPersonal: string | null;
    revenueRange: string | null;
    focalPerson: string | null;
    dynamicChoice: string | null;
    dynamicOther: string | null;
    checkedIn: boolean;
    inWhatsappGroup: boolean;
    inDinner: boolean;
    npsScore: number | null;
    customer: { product: string; status: keyof typeof CUSTOMER_STATUS_META; notes: string | null } | null;
    sales: Sale[];
  };
  canManage: boolean;
  users: { id: string; name: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [showSales, setShowSales] = useState(false);
  const [addingSale, setAddingSale] = useState(false);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [state, formAction, savePending] = useActionState(updateAttendeeAction, initialState);
  const [saleState, saleFormAction, salePending] = useActionState(addAttendeeSaleAction, initialState);
  const [editSaleState, editSaleFormAction, editSalePending] = useActionState(updateAttendeeSaleAction, initialState);

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  useEffect(() => {
    if (saleState.success) setAddingSale(false);
  }, [saleState.success]);

  useEffect(() => {
    if (editSaleState.success) setEditingSaleId(null);
  }, [editSaleState.success]);

  return (
    <div className="border-t border-border py-2 first:border-t-0">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto_auto] items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[13px] text-ink">
            {attendee.name}
            {attendee.empresa && (
              <span className="text-ink-faint"> · {attendee.empresa}</span>
            )}
          </span>
          <span className="text-[11px] text-ink-faint">
            {ATTENDEE_CATEGORY_META[attendee.category].label}
            {attendee.ticketType ? ` · Ingresso ${attendee.ticketType}` : ""}
            {attendee.focalPerson ? ` · Focal: ${attendee.focalPerson}` : ""}
          </span>
        </div>
        <select
          defaultValue={attendee.npsScore ?? ""}
          disabled={!canManage || pending}
          onChange={(e) => {
            const fd = new FormData();
            fd.set("attendeeId", attendee.id);
            fd.set("score", e.target.value);
            startTransition(() => {
              setAttendeeNpsAction(fd);
            });
          }}
          className="h-8 w-16 rounded-(--radius-s) border border-border bg-surface text-[12px] outline-none"
        >
          <option value="">NPS</option>
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <label
          className={`text-[11.5px] ${canManage ? "cursor-pointer" : ""} ${pending ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            defaultChecked={attendee.checkedIn}
            disabled={!canManage || pending}
            onChange={() => {
              const fd = new FormData();
              fd.set("attendeeId", attendee.id);
              startTransition(() => {
                toggleAttendeeCheckedInAction(fd);
              });
            }}
            className="mr-1.5 accent-brand-deep"
          />
          Presente
        </label>
        <label
          className={`text-[11.5px] ${canManage ? "cursor-pointer" : ""} ${pending ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            defaultChecked={attendee.inWhatsappGroup}
            disabled={!canManage || pending}
            onChange={() => {
              const fd = new FormData();
              fd.set("attendeeId", attendee.id);
              startTransition(() => {
                toggleAttendeeWhatsappAction(fd);
              });
            }}
            className="mr-1.5 accent-brand-deep"
          />
          No grupo
        </label>
        <label
          className={`text-[11.5px] ${canManage ? "cursor-pointer" : ""} ${pending ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            defaultChecked={attendee.inDinner}
            disabled={!canManage || pending}
            onChange={() => {
              const fd = new FormData();
              fd.set("attendeeId", attendee.id);
              startTransition(() => {
                toggleAttendeeDinnerAction(fd);
              });
            }}
            className="mr-1.5 accent-brand-deep"
          />
          Jantar
        </label>
        <button
          onClick={() => setShowSales((v) => !v)}
          className="text-[11.5px] font-medium text-brand hover:underline"
        >
          vendas{attendee.sales.length > 0 ? ` (${attendee.sales.length})` : ""}
        </button>
        {canManage && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-[11.5px] font-medium text-brand hover:underline"
            >
              {editing ? "fechar" : "editar"}
            </button>
            <form
              action={deleteAttendeeAction}
              onSubmit={(e) => {
                if (!confirm(`Remover "${attendee.name}" da lista de confirmados?`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="attendeeId" value={attendee.id} />
              <button type="submit" className="text-[11.5px] text-ink-faint hover:text-critical">
                excluir
              </button>
            </form>
          </div>
        )}
      </div>

      {attendee.customer && (
        <div className="mt-2 flex flex-col gap-0.5 rounded-(--radius-s) border border-border bg-surface-muted p-2.5 text-[11.5px]">
          <span className="font-medium text-ink-soft">
            CS · {attendee.customer.product} · {CUSTOMER_STATUS_META[attendee.customer.status].label}
          </span>
          {attendee.customer.notes && <p className="text-ink-faint">{attendee.customer.notes}</p>}
        </div>
      )}

      {editing && (
        <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
          <input type="hidden" name="attendeeId" value={attendee.id} />
          <AttendeeFormFields
            defaults={{
              name: attendee.name,
              empresa: attendee.empresa,
              category: attendee.category,
              ticketType: attendee.ticketType,
              email: attendee.email,
              phone: attendee.phone,
              cpfRg: attendee.cpfRg,
              instagram: attendee.instagram,
              instagramPersonal: attendee.instagramPersonal,
              revenueRange: attendee.revenueRange,
              focalPerson: attendee.focalPerson,
              dynamicChoice: attendee.dynamicChoice,
              dynamicOther: attendee.dynamicOther,
            }}
          />
          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={savePending}
              className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft disabled:opacity-60"
            >
              {savePending ? "Salvando…" : "Salvar"}
            </button>
            {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
          </div>
        </form>
      )}

      {showSales && (
        <div className="mt-2 flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
          {attendee.sales.length === 0 && (
            <p className="text-[11.5px] text-ink-faint">Nenhuma venda registrada.</p>
          )}
          {attendee.sales.map((s) =>
            editingSaleId === s.id ? (
              <form key={s.id} action={editSaleFormAction} className="flex flex-col gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0">
                <input type="hidden" name="saleId" value={s.id} />
                <SaleFormFields defaults={s} users={users} />
                <div className="flex items-center gap-2.5">
                  <button
                    type="submit"
                    disabled={editSalePending}
                    className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft disabled:opacity-60"
                  >
                    {editSalePending ? "Salvando…" : "Salvar venda"}
                  </button>
                  <button type="button" onClick={() => setEditingSaleId(null)} className="text-[11.5px] text-ink-faint hover:underline">
                    cancelar
                  </button>
                  {editSaleState.error && <span className="text-[11px] text-critical">{editSaleState.error}</span>}
                </div>
              </form>
            ) : (
              <div key={s.id} className="flex items-center justify-between gap-2 text-[11.5px]">
                <div className="flex flex-col gap-0.5">
                  <span>
                    {s.program === "Outros" ? s.programOther || "Outros" : s.program} · {formatCurrency(s.value)} ·{" "}
                    {s.paymentPlan === "parcelado" ? `${s.installmentCount}x` : "à vista"} ·{" "}
                    {s.paymentMethod === "outro"
                      ? s.paymentMethodOther || "Outro"
                      : PAYMENT_METHOD_LABEL[s.paymentMethod] ?? s.paymentMethod}{" "}
                    · {formatDate(new Date(s.saleDate))}
                    {s.seller ? ` · ${s.seller.name}` : ""}
                  </span>
                  {s.installments.length > 0 && (
                    <span className="text-ink-faint">
                      Parcelas:{" "}
                      {s.installments
                        .map((i) =>
                          i.amount !== null
                            ? `${formatDate(new Date(i.dueDate))} (${formatCurrency(i.amount)})`
                            : formatDate(new Date(i.dueDate))
                        )
                        .join(", ")}
                    </span>
                  )}
                  {s.notes && <span className="text-ink-faint">{s.notes}</span>}
                </div>
                {canManage && (
                  <div className="flex items-center gap-2.5">
                    <button onClick={() => setEditingSaleId(s.id)} className="text-brand hover:underline">
                      editar
                    </button>
                    <form
                      action={deleteAttendeeSaleAction}
                      onSubmit={(e) => {
                        if (!confirm("Excluir essa venda?")) e.preventDefault();
                      }}
                    >
                      <input type="hidden" name="saleId" value={s.id} />
                      <button type="submit" className="text-ink-faint hover:text-critical">
                        excluir
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )
          )}

          {canManage && !addingSale && (
            <button
              onClick={() => setAddingSale(true)}
              className="w-fit text-[11.5px] font-medium text-brand hover:underline"
            >
              + adicionar venda
            </button>
          )}

          {canManage && addingSale && (
            <form action={saleFormAction} className="flex flex-col gap-2 border-t border-border pt-2">
              <input type="hidden" name="attendeeId" value={attendee.id} />
              <SaleFormFields users={users} />
              <div className="flex items-center gap-2.5">
                <button
                  type="submit"
                  disabled={salePending}
                  className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft disabled:opacity-60"
                >
                  {salePending ? "Salvando…" : "Salvar venda"}
                </button>
                <button type="button" onClick={() => setAddingSale(false)} className="text-[11.5px] text-ink-faint hover:underline">
                  cancelar
                </button>
                {saleState.error && <span className="text-[11px] text-critical">{saleState.error}</span>}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
