import type { Event, EventAttendee, Sponsor, SponsorInstallment } from "@prisma/client";
import { sponsorPaidValue, sponsorshipGoalFor } from "@/lib/sponsors";
import { prisma } from "@/lib/db";

export const EVENT_TYPES = ["Imersão", "Summit", "Experience", "Jantar"] as const;

/** Meta de patrocínio do evento — sempre 50% acima do budget planejado, nunca
 * digitada manualmente. Mantido aqui por compat (usa o mesmo helper de
 * lib/sponsors.ts) já que boa parte do código já importa de events.ts. */
export function sponsorTarget(budgetPlanned: number | null) {
  return sponsorshipGoalFor(budgetPlanned);
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
  | "equipe_evento"
  | "patrocinador",
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
  patrocinador: { label: "Patrocinador" },
};

function dateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Upsert idempotente de um EventDay por dia corrido entre startDate e
 * endDate (inclusive) — chamado no carregamento da página do evento, pode
 * rodar quantas vezes for preciso sem duplicar linhas. */
export async function ensureEventDays(eventId: string, startDate: Date, endDate: Date) {
  const days: Date[] = [];
  const cursor = dateOnly(startDate);
  const last = dateOnly(endDate);
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  await Promise.all(
    days.map((date) =>
      prisma.eventDay.upsert({
        where: { eventId_date: { eventId, date } },
        update: {},
        create: { eventId, date },
      })
    )
  );

  return prisma.eventDay.findMany({
    where: { eventId },
    orderBy: { date: "asc" },
    include: { agenda: { orderBy: { order: "asc" } } },
  });
}

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
 * from EventAttendee/Sponsor rows. An event migrated from the old
 * spreadsheet has no individual attendee records — real names weren't in the
 * summary we imported from — so it falls back to the aggregate snapshot
 * fields on Event, which are themselves real historical numbers.
 */
export function computeEventStats(
  event: Event & {
    attendees: (EventAttendee & { checkins?: { present: boolean }[] })[];
    sponsors: (Sponsor & { installments: SponsorInstallment[] })[];
    budgetLines: { actualValue: number | null }[];
  }
): EventStats {
  const budgetActual = event.budgetLines.reduce(
    (sum, b) => sum + (b.actualValue ?? 0),
    0
  );

  const sponsorRevenuePlanned = event.sponsors.reduce((s, sp) => s + sp.totalValue, 0);
  const sponsorRevenueRealized = event.sponsors.reduce(
    (s, sp) => s + sponsorPaidValue(sp),
    0
  );

  if (event.attendees.length === 0) {
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

  // Taxa de participação = presente em pelo menos 1 dia (EventAttendeeCheckin)
  // — quando esse dado não foi incluído na query (telas que listam vários
  // eventos de uma vez), cai pro flag geral `checkedIn` de antes.
  const present = event.attendees.filter((a) =>
    a.checkins && a.checkins.length > 0 ? a.checkins.some((c) => c.present) : a.checkedIn
  );
  const nps = event.attendees.filter((a) => a.npsScore !== null);

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
