import { prisma } from "@/lib/db";
import { monthKey, periodKeyLabel } from "@/lib/finance";
import type { LeadChannel } from "@prisma/client";

/// Produtos reconhecidos — mesmo vocabulário usado em Social Selling
/// (src/lib/social.ts SOCIAL_SALE_PRODUCTS), restrito aos 4 citados no
/// resumo do Comercial (Tração, Club, Master, Evento).
export const COMERCIAL_PRODUCTS = ["Tração", "Club", "Master", "Evento"] as const;
export type ComercialProduct = (typeof COMERCIAL_PRODUCTS)[number];

export const LEAD_CHANNEL_META: Record<LeadChannel, { label: string }> = {
  trafego: { label: "Tráfego" },
  social_selling: { label: "Social Selling" },
  sdr: { label: "SDR" },
  eventos: { label: "Eventos" },
  outros: { label: "Outros" },
};

/**
 * Canal de origem derivado do pipeline do GoHighLevel — não há campo de
 * atribuição confiável no CRM (ver comentário no schema). Mapeamento
 * confirmado com os pipelines reais da conta.
 */
export function classifyChannel(pipelineName: string): LeadChannel {
  const n = pipelineName.toLowerCase();
  if (n.includes("social seller")) return "social_selling";
  if (n.includes("sdr")) return "sdr";
  if (n.includes("sessão estratégica") || n.includes("sessao estrategica")) return "trafego";
  if (n.includes("imersão") || n.includes("imersao") || n.includes("scale") || n.includes("club")) return "eventos";
  return "outros";
}

/**
 * Produto parseado do nome da oportunidade — muitos negócios fechados têm
 * um sufixo real "- CLUB" / "- TRAÇÃO" / "- MASTER" (confirmado nos dados
 * reais da conta); "Evento"/"Imersão" também aparece no nome ou é inferido
 * do pipeline. Nem toda oportunidade tem o sufixo — fica null nesse caso,
 * não inventamos produto pra quem não informou.
 */
export function parseProduct(name: string, pipelineName: string): ComercialProduct | null {
  const upper = name.toUpperCase();
  if (/\bCLUB\b/.test(upper)) return "Club";
  if (/\bTRA[ÇC][ÃA]O\b/.test(upper)) return "Tração";
  if (/\bMASTER\b/.test(upper)) return "Master";
  if (/\bIMERS[ÃA]O\b/.test(upper)) return "Evento";
  const p = pipelineName.toLowerCase();
  if (p.includes("imersão") || p.includes("imersao") || p.includes("scale")) return "Evento";
  if (p.includes("aplicação club") || p.includes("aplicacao club")) return "Club";
  return null;
}

export type OpportunityRow = {
  monetaryValue: number;
  status: string;
  createdAt: Date;
  wonAt: Date | null;
  channel: LeadChannel;
  product: string | null;
  assignedToEmail: string | null;
};

export function sumWonRevenue(rows: OpportunityRow[]) {
  return rows.filter((r) => r.status === "won").reduce((s, r) => s + r.monetaryValue, 0);
}

export function countWon(rows: OpportunityRow[]) {
  return rows.filter((r) => r.status === "won").length;
}

export function averageTicket(rows: OpportunityRow[]) {
  const won = rows.filter((r) => r.status === "won");
  if (won.length === 0) return 0;
  return sumWonRevenue(won) / won.length;
}

/** Data usada pra bucketizar uma oportunidade ganha por mês — wonAt quando
 * disponível, senão createdAt (nunca deixa a venda sem mês). */
export function closeDate(row: { wonAt: Date | null; createdAt: Date }) {
  return row.wonAt ?? row.createdAt;
}

export async function loadOpportunitiesInPeriod(start: Date, end: Date) {
  // "No período" considera tanto criação quanto fechamento — uma venda
  // fechada neste mês conta aqui mesmo se criada antes.
  return prisma.ghlOpportunity.findMany({
    where: {
      OR: [
        { createdAt: { gte: start, lte: end } },
        { wonAt: { gte: start, lte: end } },
      ],
    },
  });
}

export async function loadOpportunitiesWonInPeriod(start: Date, end: Date) {
  const rows = await prisma.ghlOpportunity.findMany({ where: { status: "won" } });
  return rows.filter((r) => {
    const d = closeDate(r);
    return d >= start && d <= end;
  });
}

/** Faturamento e ticket médio mês a mês, desde o início do ano corrente. */
export async function loadComercialMonthlyTrend() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const won = await prisma.ghlOpportunity.findMany({
    where: { status: "won" },
    select: { monetaryValue: true, createdAt: true, wonAt: true, product: true },
  });

  const months: string[] = [];
  const cursor = new Date(yearStart);
  while (cursor <= now) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months.map((mk) => {
    const inMonth = won.filter((r) => monthKey(closeDate(r)) === mk);
    const revenue = inMonth.reduce((s, r) => s + r.monetaryValue, 0);
    return {
      label: periodKeyLabel(mk).slice(0, 3),
      revenue,
      avgTicket: inMonth.length > 0 ? revenue / inMonth.length : 0,
      byProduct: COMERCIAL_PRODUCTS.map((p) => ({
        product: p,
        revenue: inMonth.filter((r) => r.product === p).reduce((s, r) => s + r.monetaryValue, 0),
      })),
    };
  });
}

export type MeetingRow = { assigneeEmail: string | null; status: string; noShow: boolean; startTime: Date };

export function countScheduled(meetings: MeetingRow[]) {
  return meetings.length;
}
export function countRealized(meetings: MeetingRow[]) {
  return meetings.filter((m) => m.status === "active" && !m.noShow).length;
}
export function showRate(meetings: MeetingRow[]) {
  const scheduled = countScheduled(meetings);
  if (scheduled === 0) return null;
  return (countRealized(meetings) / scheduled) * 100;
}

export async function loadMeetingsInPeriod(start: Date, end: Date) {
  return prisma.calendlyMeeting.findMany({ where: { startTime: { gte: start, lte: end } } });
}

export function productSummary(rows: OpportunityRow[]) {
  const won = rows.filter((r) => r.status === "won");
  return COMERCIAL_PRODUCTS.map((p) => ({
    product: p,
    count: won.filter((r) => r.product === p).length,
    revenue: won.filter((r) => r.product === p).reduce((s, r) => s + r.monetaryValue, 0),
  }));
}

export function weeklyMeetings(meetings: MeetingRow[]) {
  const byWeek = new Map<number, { scheduled: number; realized: number }>();
  for (const m of meetings) {
    const week = Math.ceil(m.startTime.getDate() / 7);
    const entry = byWeek.get(week) ?? { scheduled: 0, realized: 0 };
    entry.scheduled += 1;
    if (m.status === "active" && !m.noShow) entry.realized += 1;
    byWeek.set(week, entry);
  }
  return [...byWeek.entries()].sort(([a], [b]) => a - b);
}

export function channelBreakdown(rows: OpportunityRow[]) {
  const channels: LeadChannel[] = ["trafego", "social_selling", "sdr", "eventos", "outros"];
  const total = rows.length;
  return {
    total,
    byChannel: channels.map((c) => ({ channel: c, count: rows.filter((r) => r.channel === c).length })),
  };
}

export function leadsByProduct(rows: OpportunityRow[]) {
  return COMERCIAL_PRODUCTS.map((p) => ({ product: p, count: rows.filter((r) => r.product === p).length }));
}

/** Patrocínios fechados no período — sempre a mesma fonte de verdade da
 * área de Patrocínios (model Sponsor), nunca um valor recalculado à parte,
 * pra não divergir do que aparece lá. "Fechado" = status além de em
 * negociação/cancelado (assinado, pago integral/parcial, atrasado). Usa
 * updatedAt como proxy de data de fechamento — não há campo dedicado de
 * "assinado em" no modelo hoje. */
export async function loadSponsorshipsClosedInPeriod(start: Date, end: Date) {
  const rows = await prisma.sponsor.findMany({
    where: {
      status: { notIn: ["em_negociacao", "cancelado"] },
      updatedAt: { gte: start, lte: end },
    },
    select: { id: true, name: true, totalValue: true, status: true },
  });
  return { count: rows.length, revenue: rows.reduce((s, r) => s + r.totalValue, 0), rows };
}
