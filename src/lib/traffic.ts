import { prisma } from "@/lib/db";
import { monthKey, periodKeyLabel } from "@/lib/finance";
import type { TrafficCategory, LeadChannel } from "@prisma/client";

const ALL_CHANNELS: LeadChannel[] = ["trafego", "social_selling", "sdr", "eventos", "outros"];

/**
 * Leads/SQL/faturamento/ROI por canal de origem (GoHighLevel), cruzando
 * GhlOpportunity (canal + faturamento) com TrafficSqlLead (isAdvanced, join
 * por externalId = mesmo opportunity_id do GHL) — os dois modelos vêm do
 * mesmo pull do Windsor, então casam 1:1 por id externo.
 *
 * Só o canal "trafego" tem investimento em mídia atribuível (Facebook Ads) —
 * Social Selling/SDR/Eventos são esforço orgânico/manual, sem verba de
 * anúncio associável a essas oportunidades específicas. Por isso custo por
 * SQL e ROI só existem para "trafego"; os demais ficam null (não é omissão,
 * é ausência real de investimento em mídia rastreável por canal).
 */
export async function loadTrafficChannelRates(start: Date, end: Date) {
  const [opportunities, sqlLeads, spendAgg] = await Promise.all([
    prisma.ghlOpportunity.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { externalId: true, channel: true, monetaryValue: true, status: true },
    }),
    prisma.trafficSqlLead.findMany({
      where: { createdAt: { gte: start, lte: end } },
      select: { externalId: true, isAdvanced: true },
    }),
    prisma.trafficCampaignMetric.aggregate({
      where: { date: { gte: start, lte: end } },
      _sum: { spend: true },
    }),
  ]);

  const sqlByExternalId = new Map(sqlLeads.map((s) => [s.externalId, s.isAdvanced]));
  const trafficSpend = spendAgg._sum.spend ?? 0;

  return ALL_CHANNELS.map((channel) => {
    const rows = opportunities.filter((o) => o.channel === channel);
    const sqlCount = rows.filter((o) => sqlByExternalId.get(o.externalId) === true).length;
    const revenue = rows.filter((o) => o.status === "won").reduce((s, o) => s + o.monetaryValue, 0);
    const spend = channel === "trafego" ? trafficSpend : null;
    return {
      channel,
      leadCount: rows.length,
      sqlCount,
      sqlRate: rows.length > 0 ? (sqlCount / rows.length) * 100 : null,
      spend,
      costPerSql: spend !== null && sqlCount > 0 ? spend / sqlCount : null,
      revenue,
      roi: spend !== null && spend > 0 ? ((revenue - spend) / spend) * 100 : null,
    };
  });
}

/// Única conta do Facebook Ads com investimento real hoje (as outras 4
/// contas conectadas no Windsor — Dom Barros, Carolina Viudes, Brand Legacy
/// (NOVA), Brand Legacy (Read-Only) — não tiveram spend nos últimos 90 dias
/// quando isso foi verificado). Ajustar aqui se uma nova conta entrar em uso.
export const TRAFFIC_FACEBOOK_ACCOUNT_ID = "1120054962776784";

/// Conta do GoHighLevel (CRM do Comercial) conectada no Windsor.
export const TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID = "voa5MLFLfV3pxCM4eJsi";

export const TRAFFIC_CATEGORY_META: Record<TrafficCategory, { label: string; short: string }> = {
  aquisicao: { label: "Aquisição", short: "Aquisição" },
  eventos: {
    label: "Investimento em Captação de Leads para Eventos (Imersões)",
    short: "Captação para Eventos",
  },
  distribuicao: {
    label: "Investimento em Distribuição de Conteúdo (Impulsionamento)",
    short: "Distribuição de Conteúdo",
  },
};

/**
 * Classifica uma campanha automaticamente a partir do nome/objetivo real do
 * Facebook Ads (padrão confirmado nos dados reais da conta):
 * - objetivo OUTCOME_ENGAGEMENT (posts impulsionados, "[Perfil Brand] Post:
 *   ...") → Distribuição de Conteúdo.
 * - nome contém "Imersão" → Captação de Leads para Eventos.
 * - resto (Cadastros, Webinar, Diagnóstico, Quiz...) → Aquisição geral.
 * Pode ser sobrescrita por campanha via TrafficCampaignCategoryOverride.
 */
export function classifyCampaign(campaignName: string, objective: string | null): TrafficCategory {
  if (objective === "OUTCOME_ENGAGEMENT") return "distribuicao";
  if (/imers[ãa]o/i.test(campaignName)) return "eventos";
  return "aquisicao";
}

export type TrafficSummary = {
  leads: number;
  spend: number;
  cpl: number | null;
  mqlCount: number;
  costPerMql: number | null;
};

export function summarizeTraffic(
  rows: { spend: number; leads: number }[],
  mqlCount: number
): TrafficSummary {
  const spend = rows.reduce((s, r) => s + r.spend, 0);
  const leads = rows.reduce((s, r) => s + r.leads, 0);
  return {
    leads,
    spend,
    cpl: leads > 0 ? spend / leads : null,
    mqlCount,
    costPerMql: mqlCount > 0 ? spend / mqlCount : null,
  };
}

/** Não há atribuição de campanha confiável ligando um MQL do CRM a uma
 * campanha específica (ver discussão que criou este módulo) — pra mostrar
 * "MQL" nos dashboards por categoria mesmo assim, o total é rateado
 * proporcionalmente à participação de investimento de cada categoria.
 * Sempre rotulado como estimativa na UI, nunca como número exato. */
export function prorateMql(totalMql: number, categorySpend: number, totalSpend: number): number {
  if (totalSpend <= 0 || totalMql <= 0) return 0;
  return Math.round(totalMql * (categorySpend / totalSpend));
}

/** Carrega as linhas de campanha do período (todas as categorias) + a
 * contagem de MQL do período, usados por Tráfego e por Comercial pra montar
 * seus respectivos recortes (total, Aquisição, Eventos, Distribuição). */
export async function loadTrafficPeriodData(start: Date, end: Date) {
  const [campaigns, mqlCount, sqlCount, lastFetched, latestSpendDate] = await Promise.all([
    prisma.trafficCampaignMetric.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.trafficMqlLead.count({ where: { dateAdded: { gte: start, lte: end } } }),
    prisma.trafficSqlLead.count({ where: { isAdvanced: true, createdAt: { gte: start, lte: end } } }),
    prisma.trafficCampaignMetric.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
    // O Facebook/Meta tem um atraso natural de alguns dias pra fechar os
    // dados de gasto/leads mais recentes (atribuição de conversão) — não é
    // bug nosso, é como a API deles funciona. Sem isso fica parecendo que o
    // investimento "sumiu" quando na verdade só ainda não foi reportado.
    prisma.trafficCampaignMetric.findFirst({ where: { spend: { gt: 0 } }, orderBy: { date: "desc" }, select: { date: true } }),
  ]);
  return {
    campaigns,
    mqlCount,
    sqlCount,
    lastFetched: lastFetched?.fetchedAt ?? null,
    latestSpendDate: latestSpendDate?.date ?? null,
  };
}

export function campaignsByCategory(
  campaigns: { category: TrafficCategory; spend: number; leads: number }[],
  category: TrafficCategory
) {
  return campaigns.filter((c) => c.category === category);
}

export async function loadTrafficLeaderboards(start: Date, end: Date, limit = 5) {
  const campaigns = await prisma.trafficCampaignMetric.groupBy({
    by: ["campaignId", "campaignName"],
    where: { date: { gte: start, lte: end } },
    _sum: { spend: true, leads: true },
  });
  const ads = await prisma.trafficAdMetric.groupBy({
    by: ["adId", "adName"],
    where: { date: { gte: start, lte: end } },
    _sum: { spend: true, leads: true },
  });

  const topCampaigns = campaigns
    .map((c) => ({
      id: c.campaignId,
      name: c.campaignName,
      spend: c._sum.spend ?? 0,
      leads: c._sum.leads ?? 0,
    }))
    .filter((c) => c.leads > 0)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, limit);

  const topAds = ads
    .map((a) => ({
      id: a.adId,
      name: a.adName,
      spend: a._sum.spend ?? 0,
      leads: a._sum.leads ?? 0,
    }))
    .filter((a) => a.leads > 0)
    .sort((a, b) => b.leads - a.leads)
    .slice(0, limit);

  return { topCampaigns, topAds };
}

/** CPL e contagem de MQL mês a mês, desde o início do ano corrente — pra
 * enxergar a evolução ao longo do ano, não só o recorte do período
 * selecionado no FilterBar. */
export async function loadTrafficMonthlyTrend() {
  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [campaigns, mqlLeads] = await Promise.all([
    prisma.trafficCampaignMetric.findMany({
      where: { date: { gte: yearStart, lte: now } },
      select: { date: true, spend: true, leads: true },
    }),
    prisma.trafficMqlLead.findMany({
      where: { dateAdded: { gte: yearStart, lte: now } },
      select: { dateAdded: true },
    }),
  ]);

  const months: string[] = [];
  const cursor = new Date(yearStart);
  while (cursor <= now) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return months.map((mk) => {
    const inMonth = campaigns.filter((c) => monthKey(c.date) === mk);
    const spend = inMonth.reduce((s, c) => s + c.spend, 0);
    const leads = inMonth.reduce((s, c) => s + c.leads, 0);
    const mqlCount = mqlLeads.filter((m) => monthKey(m.dateAdded) === mk).length;
    return {
      label: periodKeyLabel(mk).slice(0, 3),
      spend,
      cpl: leads > 0 ? spend / leads : 0,
      mqlCount,
    };
  });
}
