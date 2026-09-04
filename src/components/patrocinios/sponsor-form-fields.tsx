"use client";

import { useState } from "react";
import {
  SPONSOR_TIER_META,
  SPONSOR_PAYMENT_METHOD_META,
  SPONSOR_DEAL_STATUS_META,
} from "@/lib/sponsors";

const inputClass =
  "h-9 rounded-(--radius-s) border border-border bg-surface px-3 text-[12.5px] outline-none";
const labelClass = "text-[11px] font-medium text-ink-soft";

export type SponsorDefaults = {
  name?: string;
  cnpj?: string;
  contactName?: string;
  contactPhone?: string;
  totalValue?: number;
  paymentPlan?: string;
  paymentMethod?: string;
  paymentLink?: string | null;
  hasStageTime?: boolean;
  stageTimeMinutes?: number | null;
  eventId?: string | null;
  isAnnual?: boolean;
  tier?: string;
  status?: string;
  statusOther?: string | null;
  presentationUrl?: string | null;
  videoUrl?: string | null;
  activation?: string | null;
  installments?: { amount: number; dueDate: Date }[];
};

/** Campos completos do formulário de patrocinador — compartilhados entre
 * criação e edição (só a Server Action e os defaultValues mudam). */
export function SponsorFormFields({
  defaults,
  events,
}: {
  defaults?: SponsorDefaults;
  events: { id: string; name: string }[];
}) {
  const [paymentPlan, setPaymentPlan] = useState(defaults?.paymentPlan ?? "avista");
  const [hasStageTime, setHasStageTime] = useState(defaults?.hasStageTime ?? false);
  const [status, setStatus] = useState(defaults?.status ?? "em_negociacao");
  const [installmentCount, setInstallmentCount] = useState(
    defaults?.installments?.length ?? 1
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Nome do patrocinador *</span>
          <input name="name" required defaultValue={defaults?.name} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>CNPJ *</span>
          <input name="cnpj" required defaultValue={defaults?.cnpj} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Pessoa de contato *</span>
          <input name="contactName" required defaultValue={defaults?.contactName} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Número da pessoa de contato *</span>
          <input name="contactPhone" required defaultValue={defaults?.contactPhone} className={inputClass} />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Valor total do contrato *</span>
          <input
            name="totalValue"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={defaults?.totalValue}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Cota *</span>
          <select name="tier" required defaultValue={defaults?.tier ?? ""} className={inputClass}>
            <option value="" disabled>
              Selecione…
            </option>
            {Object.entries(SPONSOR_TIER_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
        <span className={labelClass}>À vista ou parcelado *</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-1.5 text-[12.5px] text-ink">
            <input
              type="radio"
              name="paymentPlan"
              value="avista"
              checked={paymentPlan === "avista"}
              onChange={() => setPaymentPlan("avista")}
            />
            À vista
          </label>
          <label className="flex items-center gap-1.5 text-[12.5px] text-ink">
            <input
              type="radio"
              name="paymentPlan"
              value="parcelado"
              checked={paymentPlan === "parcelado"}
              onChange={() => setPaymentPlan("parcelado")}
            />
            Parcelado
          </label>
        </div>

        {paymentPlan === "parcelado" && (
          <div className="flex flex-col gap-2 border-t border-border pt-2.5">
            <label className="flex w-fit flex-col gap-1">
              <span className={labelClass}>Número de parcelas</span>
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
            <div className="flex flex-col gap-2">
              {Array.from({ length: installmentCount }).map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-16 shrink-0 text-[11.5px] text-ink-faint">Parcela {i + 1}</span>
                  <input
                    name={`installmentAmount_${i}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Valor"
                    defaultValue={defaults?.installments?.[i]?.amount}
                    className={`${inputClass} flex-1`}
                  />
                  <input
                    name={`installmentDueDate_${i}`}
                    type="date"
                    defaultValue={
                      defaults?.installments?.[i]?.dueDate
                        ? new Date(defaults.installments[i].dueDate).toISOString().slice(0, 10)
                        : undefined
                    }
                    className={`${inputClass} flex-1`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Meio de pagamento *</span>
          <select name="paymentMethod" required defaultValue={defaults?.paymentMethod ?? ""} className={inputClass}>
            <option value="" disabled>
              Selecione…
            </option>
            {Object.entries(SPONSOR_PAYMENT_METHOD_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Link de pagamento</span>
          <input name="paymentLink" placeholder="https://…" defaultValue={defaults?.paymentLink ?? ""} className={inputClass} />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={labelClass}>Comprovante de pagamento (foto ou arquivo)</span>
        <input name="paymentProof" type="file" accept="image/*,application/pdf" className="text-[12px]" />
      </label>

      <div className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
        <label className="flex items-center gap-2 text-[12.5px] text-ink">
          <input
            type="checkbox"
            name="hasStageTime"
            checked={hasStageTime}
            onChange={(e) => setHasStageTime(e.target.checked)}
          />
          Tem tempo de palco
        </label>
        {hasStageTime && (
          <label className="flex w-fit flex-col gap-1">
            <span className={labelClass}>Quantos minutos</span>
            <input
              name="stageTimeMinutes"
              type="number"
              min="0"
              defaultValue={defaults?.stageTimeMinutes ?? undefined}
              className={`${inputClass} w-24`}
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Evento patrocinado</span>
          <select name="eventId" defaultValue={defaults?.eventId ?? ""} className={inputClass}>
            <option value="">Nenhum vinculado</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-1.5 text-[12.5px] text-ink">
          <input type="checkbox" name="isAnnual" defaultChecked={defaults?.isAnnual} />
          Patrocínio anual/recorrente
        </label>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Status *</span>
          <select
            name="status"
            required
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={inputClass}
          >
            {Object.entries(SPONSOR_DEAL_STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
        {status === "outro" && (
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Qual status</span>
            <input name="statusOther" defaultValue={defaults?.statusOther ?? ""} className={inputClass} />
          </label>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3">
        <span className={labelClass}>Campos de perfil (exibidos aqui e no evento)</span>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>NF (nota fiscal) — arquivo ou foto</span>
            <input name="nf" type="file" accept="image/*,application/pdf" className="text-[12px]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Logo</span>
            <input name="logo" type="file" accept="image/*" className="text-[12px]" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Apresentação (link)</span>
            <input name="presentationUrl" placeholder="https://…" defaultValue={defaults?.presentationUrl ?? ""} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Vídeo (link)</span>
            <input name="videoUrl" placeholder="https://…" defaultValue={defaults?.videoUrl ?? ""} className={inputClass} />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Ativação</span>
          <textarea
            name="activation"
            rows={2}
            defaultValue={defaults?.activation ?? ""}
            className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[12.5px] outline-none"
          />
        </label>
      </div>
    </div>
  );
}
