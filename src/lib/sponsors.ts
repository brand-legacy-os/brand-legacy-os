import type { Tone } from "@/components/ui/status-pill";

export const SPONSOR_TIER_META: Record<"gold" | "silver", { label: string }> = {
  gold: { label: "Gold" },
  silver: { label: "Silver" },
};

export const SPONSOR_PAYMENT_METHOD_META: Record<
  "pix" | "boleto" | "pagarme",
  { label: string }
> = {
  pix: { label: "Pix" },
  boleto: { label: "Boleto" },
  pagarme: { label: "Pagar.me" },
};

export const SPONSOR_DEAL_STATUS_META: Record<
  | "em_negociacao"
  | "assinado"
  | "pago_integralmente"
  | "pago_parcialmente"
  | "pagamento_atrasado"
  | "cancelado"
  | "outro",
  { label: string; tone: Tone }
> = {
  em_negociacao: { label: "Em negociação", tone: "neutral" },
  assinado: { label: "Assinado", tone: "neutral" },
  pago_integralmente: { label: "Pago integralmente", tone: "positive" },
  pago_parcialmente: { label: "Pago parcialmente", tone: "warning" },
  pagamento_atrasado: { label: "Pagamento atrasado", tone: "critical" },
  cancelado: { label: "Cancelado", tone: "critical" },
  outro: { label: "Outro", tone: "neutral" },
};

export const EVENT_DYNAMIC_META: Record<
  "plano_perfeito" | "shark_tank" | "outro",
  { label: string }
> = {
  plano_perfeito: { label: "Plano Perfeito" },
  shark_tank: { label: "Shark Tank" },
  outro: { label: "Outro" },
};

export const EVENT_BUDGET_CATEGORY_META: Record<
  | "press_kit_gold"
  | "press_kit_vip"
  | "a_e_b"
  | "audiovisual"
  | "cenografia"
  | "staff"
  | "reembolsos"
  | "outro",
  { label: string }
> = {
  press_kit_gold: { label: "Press Kit Gold" },
  press_kit_vip: { label: "Press Kit VIP" },
  a_e_b: { label: "A&B" },
  audiovisual: { label: "Audiovisual" },
  cenografia: { label: "Cenografia" },
  staff: { label: "Staff" },
  reembolsos: { label: "Reembolsos" },
  outro: { label: "Outro" },
};

export const COMMS_STATUS_META: Record<"planejado" | "enviado", { label: string; tone: Tone }> = {
  planejado: { label: "Planejado", tone: "neutral" },
  enviado: { label: "Enviado", tone: "positive" },
};

type SponsorForTotals = {
  totalValue: number;
  paymentPlan: "avista" | "parcelado";
  status: string;
  installments: { amount: number; paid: boolean; paidDate: Date | null }[];
};

/** Valor efetivamente pago de um patrocínio: parcelas pagas, ou o valor
 * total quando à vista e o status indica pagamento (integral ou parcial). */
export function sponsorPaidValue(sponsor: SponsorForTotals): number {
  if (sponsor.paymentPlan === "parcelado") {
    return sponsor.installments
      .filter((i) => i.paid)
      .reduce((s, i) => s + i.amount, 0);
  }
  return sponsor.status === "pago_integralmente" || sponsor.status === "pago_parcialmente"
    ? sponsor.totalValue
    : 0;
}

/** Meta de patrocínio do evento — sempre 50% acima do budget planejado,
 * nunca preenchida manualmente (ver Event.sponsorshipGoal no schema). */
export function sponsorshipGoalFor(budgetPlanned: number | null): number {
  return (budgetPlanned ?? 0) * 1.5;
}
