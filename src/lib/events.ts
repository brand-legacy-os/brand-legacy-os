import type { Event, EventAttendee, EventSponsor, EventSponsorPayment } from "@prisma/client";

export const EVENT_TYPES = ["Imersão", "Summit", "Experience", "Jantar"] as const;

/** Target de patrocínio por evento: R$110k para imersões/summits, R$45k para os demais (coquetéis, jantares etc). */
export function sponsorTarget(eventType: string) {
  const t = eventType.toLowerCase();
  return t.includes("imers") || t.includes("summit") ? 110000 : 45000;
}

export const EVENT_STATUS_META: Record<
  "planejamento" | "confirmado" | "em_andamento" | "realizado" | "cancelado",
  { label: string }
> = {
  planejamento: { label: "Em planejamento" },
  confirmado: { label: "Confirmado" },
  em_andamento: { label: "Em andamento" },
  realizado: { label: "Realizado" },
  cancelado: { label: "Cancelado" },
};

export const ATTENDEE_CATEGORY_META: Record<
  | "pagante"
  | "convidado_socio"
  | "convidado_patrocinador"
  | "equipe_interna"
  | "socio"
  | "membro_club"
  | "membro_tracao"
  | "equipe_evento",
  { label: string }
> = {
  pagante: { label: "Pagante" },
  convidado_socio: { label: "Convidado (sócio)" },
  convidado_patrocinador: { label: "Convidado (patrocinador)" },
  equipe_interna: { label: "Equipe interna" },
  socio: { label: "Sócio" },
  membro_club: { label: "Membro Club" },
  membro_tracao: { label: "Membro Tração" },
  equipe_evento: { label: "Equipe do evento" },
};

export const BUDGET_LINE_STATUS_OPTIONS = [
  "A pagar",
  "Aguardando aprovação",
  "Pago",
  "Bonificado",
  "Cancelado",
] as const;

export function budgetLineStatusTone(status: string | null) {
  switch (status) {
    case "Pago":
    case "Apurado":
      return "positive" as const;
    case "Bonificado":
      return "neutral" as const;
    case "Aguardando aprovação":
      return "warning" as const;
    case "Cancelado":
      return "critical" as const;
    default:
      return "neutral" as const;
  }
}

export const SPONSOR_STATUS_META: Record<
  "negociacao" | "assinado" | "pago_parcial" | "pago_total" | "cancelado",
  { label: string }
> = {
  negociacao: { label: "Em negociação" },
  assinado: { label: "Assinado" },
  pago_parcial: { label: "Pago parcialmente" },
  pago_total: { label: "Pago integralmente" },
  cancelado: { label: "Cancelado" },
};

export type EventStats = {
  registeredCount: number | null;
  presentCount: number | null;
  payingCount: number | null;
  mentoradosCount: number | null;
  guestCount: number | null;
  noShowCount: number | null;
  sponsorCount: number | null;
  npsAverage: number | null;
  npsResponses: number | null;
  sponsorRevenuePlanned: number;
  sponsorRevenueRealized: number;
  budgetActual: number;
  source: "historico" | "ao-vivo";
};

/**
 * An event tracked from the start (new events) gets its stats computed live
 * from EventAttendee/EventSponsor rows. An event migrated from the old
 * spreadsheet has no individual attendee records — real names weren't in the
 * summary we imported from — so it falls back to the aggregate snapshot
 * fields on Event, which are themselves real historical numbers.
 */
export function computeEventStats(
  event: Event & {
    attendees: EventAttendee[];
    sponsors: (EventSponsor & { payments: EventSponsorPayment[] })[];
    budgetLines: { actualValue: number | null }[];
  }
): EventStats {
  const budgetActual = event.budgetLines.reduce(
    (sum, b) => sum + (b.actualValue ?? 0),
    0
  );

  if (event.attendees.length === 0) {
    const sponsorRevenuePlanned = event.sponsors.reduce(
      (s, sp) => s + sp.contractValue,
      0
    );
    const sponsorRevenueRealized = event.sponsors.reduce(
      (s, sp) =>
        s + sp.payments.filter((p) => p.paid).reduce((a, p) => a + p.amount, 0),
      0
    );
    return {
      registeredCount: event.registeredCount,
      presentCount: event.presentCount,
      payingCount: event.payingCount,
      mentoradosCount: event.mentoradosCount,
      guestCount: event.guestCount,
      noShowCount: event.noShowCount,
      sponsorCount: event.sponsorCount ?? (event.sponsors.length || null),
      npsAverage: event.npsAverage,
      npsResponses: event.npsResponses,
      sponsorRevenuePlanned,
      sponsorRevenueRealized,
      budgetActual,
      source: "historico",
    };
  }

  const present = event.attendees.filter((a) => a.checkedIn);
  const nps = event.attendees.filter((a) => a.npsScore !== null);
  const sponsorRevenuePlanned = event.sponsors.reduce(
    (s, sp) => s + sp.contractValue,
    0
  );
  const sponsorRevenueRealized = event.sponsors.reduce(
    (s, sp) =>
      s + sp.payments.filter((p) => p.paid).reduce((a, p) => a + p.amount, 0),
    0
  );

  return {
    registeredCount: event.attendees.filter((a) => a.confirmed).length,
    presentCount: present.length,
    payingCount: event.attendees.filter((a) => a.category === "pagante").length,
    mentoradosCount: event.attendees.filter(
      (a) => a.category === "membro_club" || a.category === "membro_tracao"
    ).length,
    guestCount: event.attendees.filter((a) =>
      a.category.startsWith("convidado")
    ).length,
    noShowCount: event.attendees.filter((a) => a.confirmed && !a.checkedIn)
      .length,
    sponsorCount: event.sponsors.length,
    // Se ninguém marcou NPS por confirmado ainda, cai para o valor
    // registrado manualmente no evento (ver EventNpsForm) — assim o eNPS
    // não some da tela só porque alguém adicionou um confirmado.
    npsAverage: nps.length
      ? nps.reduce((s, a) => s + (a.npsScore ?? 0), 0) / nps.length
      : event.npsAverage,
    npsResponses: nps.length || event.npsResponses,
    sponsorRevenuePlanned,
    sponsorRevenueRealized,
    budgetActual,
    source: "ao-vivo",
  };
}
