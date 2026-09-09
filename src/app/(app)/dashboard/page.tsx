import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { visibleAreaSlugs } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { computeKpiSnapshot } from "@/lib/kpi";
import { formatCompactCurrency, formatDateFull } from "@/lib/format";
import { buildAttentionPoints } from "@/lib/attention";
import { computeEventStats } from "@/lib/events";
import {
  computeEnps,
  summarizeRenewals,
  computeArpu,
  computeAverageTenureMonths,
  computeLtv,
  computeMonthlyChurn,
  computeAnnualChurn,
  computeMentoriaDeliveryRate,
} from "@/lib/cs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import Link from "next/link";
import { periodKeyLabel, monthKey } from "@/lib/finance";
import { loadTrafficPeriodData, loadTrafficChannelRates, campaignsByCategory, TRAFFIC_CATEGORY_META } from "@/lib/traffic";
import {
  loadOpportunitiesWonInPeriod,
  loadOpportunitiesInPeriod,
  loadMeetingsInPeriod,
  loadComercialMonthlyTrend,
  loadSponsorshipsMonthlyTrend,
  loadSponsorshipsClosedInPeriod,
  loadPipelineSummary,
  loadCustomersByProduct,
  loadChannelBreakdown,
  loadChannelMonthlyRevenue,
  sumWonRevenue,
} from "@/lib/comercial";
import { loadEngagementByMonth, loadFollowerProgression } from "@/lib/social";
import { TrafegoDetailSection } from "@/components/dashboard/trafego-detail-section";
import { ComercialDetailSection } from "@/components/dashboard/comercial-detail-section";
import { EventosDetailSection } from "@/components/dashboard/eventos-detail-section";
import { SocialDetailSection } from "@/components/dashboard/social-detail-section";
import { CsDetailSection } from "@/components/dashboard/cs-detail-section";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await requireUser();
  const sp = await searchParams;

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const visible = visibleAreaSlugs(user);
  const areaFilter = typeof sp.area === "string" ? sp.area : "";
  const respFilter = typeof sp.responsavel === "string" ? sp.responsavel : "";

  const allowedAreaSlugs =
    visible === "all"
      ? areaFilter
        ? [areaFilter]
        : undefined
      : areaFilter && visible.includes(areaFilter)
        ? [areaFilter]
        : visible;

  const areas = await prisma.area.findMany({
    where: allowedAreaSlugs ? { slug: { in: allowedAreaSlugs } } : undefined,
    orderBy: { order: "asc" },
    include: {
      kpis: {
        where: respFilter ? { responsibleId: respFilter } : undefined,
        include: { entries: true, targets: true },
      },
      projects: true,
      tasks: { include: { area: true } },
    },
  });

  const allAreasForFilter = await prisma.area.findMany({
    where:
      visible === "all" ? undefined : { slug: { in: visible } },
    select: { slug: true, name: true },
    orderBy: { order: "asc" },
  });

  const responsibleOptions =
    visible === "all"
      ? await prisma.user.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await prisma.user.findMany({
          where: { memberships: { some: { area: { slug: { in: visible } } } } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });

  const allSnapshots = areas.flatMap((area) =>
    area.kpis.map((kpi) => ({
      snapshot: computeKpiSnapshot(kpi, kpi.entries, period, kpi.targets),
      areaName: area.name,
      areaSlug: area.slug,
    }))
  );

  const allProjects = areas.flatMap((a) =>
    a.projects.map((p) => ({ ...p, areaName: a.name, areaSlug: a.slug }))
  );
  const now = new Date();
  const allTasks = areas.flatMap((a) =>
    a.tasks.map((t) => ({ ...t, areaName: a.name, areaSlug: a.slug }))
  );
  const overdueTasks = allTasks.filter(
    (t) => t.status === "atrasada" || (t.deadline < now && !["concluida", "cancelada"].includes(t.status))
  );
  const riskTasks = allTasks.filter((t) => t.status === "atencao");

  const attentionPoints = buildAttentionPoints({
    overdueTasks: overdueTasks.map((t) => ({
      title: t.title,
      areaName: t.areaName,
      areaSlug: t.areaSlug,
    })),
    riskTasks: riskTasks.map((t) => ({
      title: t.title,
      areaName: t.areaName,
      areaSlug: t.areaSlug,
    })),
    lateProjects: allProjects
      .filter((p) => p.status === "atrasado")
      .map((p) => ({ name: p.name, areaName: p.areaName, areaSlug: p.areaSlug })),
    riskProjects: allProjects
      .filter((p) => p.status === "risco")
      .map((p) => ({ name: p.name, areaName: p.areaName, areaSlug: p.areaSlug })),
    belowTargetKpis: allSnapshots
      .filter((s) => s.snapshot.status === "abaixo")
      .map((s) => ({
        name: s.snapshot.kpi.name,
        areaName: s.areaName,
        areaSlug: s.areaSlug,
      })),
  });

  // Eventos: refletido ao vivo a partir do módulo /eventos, sem exigir
  // preenchimento duplicado de nenhum indicador manual.
  const allEvents = await prisma.event.findMany({
    include: { attendees: true, sponsors: { include: { installments: true } }, budgetLines: true },
  });
  const eventsBudgetPlanned = allEvents.reduce((s, e) => s + (e.budgetPlanned ?? 0), 0);
  const eventsBudgetActual = allEvents.reduce(
    (s, e) => s + computeEventStats(e).budgetActual,
    0
  );

  // Customer Success: mesma fórmula/fonte do módulo /cs — carteira, eNPS e
  // renovações — para que os números batam com o que o time vê lá.
  const canSeeCs = visible === "all" || visible.includes("cs");
  let csSummary: {
    active: number;
    byCarteira: { name: string; count: number }[];
    enpsByMonth: { month: string; score: number | null }[];
    renewalsPlanned: number;
    renewalsRealized: number;
  } | null = null;
  if (canSeeCs) {
    const [customers, csReps, renewals, experiences] = await Promise.all([
      prisma.customer.findMany({ include: { cs: true } }),
      prisma.membership.findMany({ where: { area: { slug: "cs" } }, include: { user: true } }),
      prisma.customerRenewal.findMany(),
      prisma.customerExperience.findMany(),
    ]);
    const active = customers.filter((c) => c.status === "ativo");
    const byCarteira = csReps.map((m) => ({
      name: m.user.name,
      count: active.filter((c) => c.csId === m.userId).length,
    }));
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const enpsByMonth = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const scores = experiences
        .filter((e) => e.score !== null && e.createdAt >= d && e.createdAt <= monthEnd)
        .map((e) => e.score as number);
      const enps = computeEnps(scores);
      return { month: monthNames[d.getMonth()], score: enps?.score ?? null };
    });
    const renewalSummary = summarizeRenewals(renewals);
    csSummary = {
      active: active.length,
      byCarteira,
      enpsByMonth,
      renewalsPlanned: renewalSummary.planned,
      renewalsRealized: renewalSummary.realized,
    };
  }

  // ---------------------------------------------------------------------
  // Tráfego — leads/investimento/SQL/ROI por canal, direto do Windsor.ai.
  // ---------------------------------------------------------------------
  const canViewComercial = visible === "all" || visible.includes("comercial");
  const trafegoData = canViewComercial
    ? await (async () => {
        const [{ campaigns }, channelRates] = await Promise.all([
          loadTrafficPeriodData(period.start, period.end),
          loadTrafficChannelRates(period.start, period.end),
        ]);
        const leadsTotais = campaigns.reduce((s, c) => s + c.leads, 0);
        const investidoGeral = campaigns.reduce((s, c) => s + c.spend, 0);
        const investidoPorFunil = (["aquisicao", "eventos", "distribuicao"] as const).map((category) => ({
          category,
          label: TRAFFIC_CATEGORY_META[category].short,
          spend: campaignsByCategory(campaigns, category).reduce((s, c) => s + c.spend, 0),
        }));
        return { leadsTotais, investidoGeral, investidoPorFunil, channelRates };
      })()
    : null;

  // ---------------------------------------------------------------------
  // Comercial — vendas/faturamento/pipeline/closers/canais, direto do
  // GoHighLevel + Calendly + Sponsor.
  // ---------------------------------------------------------------------
  const comercialDashboardData = canViewComercial
    ? await (async () => {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const [
          wonThisMonth,
          sponsorshipsThisMonth,
          allInPeriod,
          meetingsInPeriod,
          monthlyTrend,
          sponsorshipsMonthly,
          pipeline,
          customersByProduct,
          socialSelling,
          sdr,
          allUsers,
        ] = await Promise.all([
          loadOpportunitiesWonInPeriod(monthStart, now),
          loadSponsorshipsClosedInPeriod(monthStart, now),
          loadOpportunitiesInPeriod(period.start, period.end),
          loadMeetingsInPeriod(period.start, period.end),
          loadComercialMonthlyTrend(),
          loadSponsorshipsMonthlyTrend(),
          loadPipelineSummary(),
          loadCustomersByProduct(),
          loadChannelBreakdown("social_selling", period.start, period.end),
          loadChannelBreakdown("sdr", period.start, period.end),
          prisma.user.findMany({ select: { email: true, name: true } }),
        ]);

        const vendasDoMes = wonThisMonth.length + sponsorshipsThisMonth.count;
        const faturamentoDoMes = sumWonRevenue(wonThisMonth) + sponsorshipsThisMonth.revenue;

        const emailToName = new Map(allUsers.map((u) => [u.email, u.name]));
        const closerEmails = new Set<string>();
        for (const o of allInPeriod) if (o.assignedToEmail) closerEmails.add(o.assignedToEmail);
        for (const m of meetingsInPeriod) if (m.assigneeEmail) closerEmails.add(m.assigneeEmail);
        const closers = [...closerEmails].map((email) => ({
          email,
          name: emailToName.get(email) ?? email,
          opportunities: allInPeriod.filter((o) => o.assignedToEmail === email),
          meetings: meetingsInPeriod.filter((m) => m.assigneeEmail === email),
        }));

        return {
          vendasDoMes,
          faturamentoDoMes,
          monthlyTrend,
          sponsorshipsMonthly,
          pipeline,
          customersByProduct,
          closers,
          socialSelling,
          sdr,
        };
      })()
    : null;

  // ---------------------------------------------------------------------
  // Eventos — budget planejado x realizado, patrocínio x gasto, NPS e
  // participação por evento (reaproveita allEvents já carregado acima).
  // ---------------------------------------------------------------------
  const eventosRows = allEvents.map((e) => {
    const stats = computeEventStats(e);
    return {
      id: e.id,
      name: e.name,
      budgetPlanned: e.budgetPlanned,
      budgetActual: stats.budgetActual,
      sponsorPlanned: stats.sponsorRevenuePlanned,
      sponsorRealized: stats.sponsorRevenueRealized,
      npsAverage: stats.npsAverage,
      registeredCount: stats.registeredCount,
      presentCount: stats.presentCount,
    };
  });

  // ---------------------------------------------------------------------
  // Social — engajamento e seguidores mês a mês (Reportei), faturamento
  // orgânico = faturamento de Social Selling (mesma fonte do Comercial).
  // ---------------------------------------------------------------------
  const canViewSocial = visible === "all" || visible.includes("social");
  const socialDashboardData = canViewSocial
    ? await (async () => {
        const [engagement, followers, organicRevenueByMonth] = await Promise.all([
          loadEngagementByMonth(),
          loadFollowerProgression(),
          loadChannelMonthlyRevenue("social_selling"),
        ]);
        return { engagement, followers, organicRevenueByMonth };
      })()
    : null;

  // ---------------------------------------------------------------------
  // CS — LTV, churn mês a mês/anual, renovação disponível x realizado,
  // carteira ativa e taxa de entrega da mentoria.
  // ---------------------------------------------------------------------
  const csDashboardData = canSeeCs
    ? await (async () => {
        const [allCustomers, allRenewals, meetingCounts] = await Promise.all([
          prisma.customer.findMany(),
          prisma.customerRenewal.findMany(),
          prisma.customerMeeting.groupBy({ by: ["customerId"], _count: { _all: true } }),
        ]);

        const arpu = computeArpu(allCustomers);
        const tenure = computeAverageTenureMonths(allCustomers, now);
        const ltv = computeLtv(arpu, tenure);

        const year = now.getFullYear();
        const monthNames3 = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const churnMonthly = Array.from({ length: 12 }, (_, m) => {
          const monthStart = new Date(year, m, 1);
          const monthEnd = new Date(year, m + 1, 0, 23, 59, 59);
          if (monthStart > now) return { label: monthNames3[m], pct: null, churned: 0, eligible: 0 };
          const result = computeMonthlyChurn(allCustomers, monthStart, monthEnd);
          return { label: monthNames3[m], ...result };
        });
        const churnAnnual = computeAnnualChurn(allCustomers, year);

        const renewalRatePct = summarizeRenewals(allRenewals).pct;
        const renewalMonthly = Array.from({ length: 12 }, (_, m) => {
          const mk = monthKey(new Date(year, m, 1));
          const inMonth = allRenewals.filter((r) => monthKey(r.dueDate) === mk);
          const realized = inMonth.filter((r) => r.status === "renovado");
          return {
            label: periodKeyLabel(mk).slice(0, 3),
            monthKey: mk,
            plannedCount: inMonth.length,
            plannedValue: inMonth.reduce((s, r) => s + r.plannedValue, 0),
            realizedCount: realized.length,
            realizedValue: realized.reduce((s, r) => s + (r.realizedValue ?? r.plannedValue), 0),
          };
        });

        const meetingCountByCustomerId = new Map(meetingCounts.map((m) => [m.customerId, m._count._all]));
        // Exclui cancelados: a meta de entrega mede a carteira atual, não
        // quem já saiu (senão um cliente que cancelou sem completar a
        // trilha derruba a taxa sem refletir performance de entrega real).
        const mentoriaDelivery = computeMentoriaDeliveryRate(
          allCustomers.filter((c) => c.status !== "cancelado"),
          meetingCountByCustomerId
        );

        return {
          ltv,
          churnMonthly,
          churnAnnualPct: churnAnnual.pct,
          renewalRatePct,
          renewalMonthly,
          mentoriaDelivery,
        };
      })()
    : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Brand Legacy OS
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Dashboard
          </h1>
          <p className="text-[13px] text-ink-soft">
            {period.label} · dados até {formatDateFull(now)}
          </p>
        </div>
        <FilterBar
          areaOptions={allAreasForFilter.map((a) => ({
            value: a.slug,
            label: a.name,
          }))}
          responsibleOptions={responsibleOptions.map((r) => ({
            value: r.id,
            label: r.name,
          }))}
        />
      </div>

      <p className="text-[12.5px] text-ink-faint">
        Tabelas com os números reais, sem estimativa gráfica — todo valor abaixo é o dado exato.
      </p>

      {trafegoData && (
        <TrafegoDetailSection
          periodLabel={period.label}
          leadsTotais={trafegoData.leadsTotais}
          investidoGeral={trafegoData.investidoGeral}
          investidoPorFunil={trafegoData.investidoPorFunil}
          channelRates={trafegoData.channelRates}
        />
      )}

      {comercialDashboardData && (
        <ComercialDetailSection
          periodLabel={period.label}
          vendasDoMes={comercialDashboardData.vendasDoMes}
          faturamentoDoMes={comercialDashboardData.faturamentoDoMes}
          monthlyTrend={comercialDashboardData.monthlyTrend}
          sponsorshipsMonthly={comercialDashboardData.sponsorshipsMonthly}
          pipeline={comercialDashboardData.pipeline}
          customersByProduct={comercialDashboardData.customersByProduct}
          closers={comercialDashboardData.closers}
          socialSelling={comercialDashboardData.socialSelling}
          sdr={comercialDashboardData.sdr}
        />
      )}

      {eventosRows.length > 0 && (
        <EventosDetailSection rows={eventosRows} budgetPlannedTotal={eventsBudgetPlanned} budgetActualTotal={eventsBudgetActual} />
      )}

      {socialDashboardData && (
        <SocialDetailSection
          engagement={socialDashboardData.engagement}
          followers={socialDashboardData.followers}
          organicRevenueByMonth={socialDashboardData.organicRevenueByMonth}
        />
      )}

      {csDashboardData && (
        <CsDetailSection
          ltv={csDashboardData.ltv}
          churnMonthly={csDashboardData.churnMonthly}
          churnAnnualPct={csDashboardData.churnAnnualPct}
          renewalRatePct={csDashboardData.renewalRatePct}
          renewalMonthly={csDashboardData.renewalMonthly}
          activeTotal={csSummary?.active ?? 0}
          activeByCarteira={csSummary?.byCarteira ?? []}
          mentoriaDelivery={csDashboardData.mentoriaDelivery}
        />
      )}

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Pontos de atenção
        </h2>
        {attentionPoints.length === 0 ? (
          <p className="text-[13px] text-ink-faint">
            Nada pedindo atenção imediata — operação seguindo o ritmo.
          </p>
        ) : (
          <div className="flex flex-col">
            {attentionPoints.slice(0, 8).map((p, i) => (
              <Link
                key={i}
                href={p.href}
                className="grid grid-cols-[16px_1fr_auto] items-center gap-3 border-t border-border py-2.5 first:border-t-0 hover:bg-surface-muted"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    p.severity === "critical" ? "bg-critical" : "bg-warning"
                  }`}
                />
                <span className="text-[13.5px] text-ink">{p.text}</span>
                <span className="text-[12px] text-ink-faint">{p.areaName}</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
