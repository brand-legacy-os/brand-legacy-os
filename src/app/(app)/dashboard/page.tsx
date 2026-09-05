import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin, visibleAreaSlugs } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { computeKpiSnapshot, averageAtingimento } from "@/lib/kpi";
import { formatCompactCurrency, formatDateFull } from "@/lib/format";
import { buildAttentionPoints } from "@/lib/attention";
import { computeEventStats, sponsorTarget } from "@/lib/events";
import { computeEnps, summarizeRenewals } from "@/lib/cs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { StatTile } from "@/components/dashboard/stat-tile";
import { AreaBar } from "@/components/dashboard/area-bar";
import { StatusPill, projectStatusTone } from "@/components/ui/status-pill";
import { PROJECT_STATUS_META } from "@/lib/format";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import Link from "next/link";

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

  const findKpi = (areaSlug: string, name: string) =>
    allSnapshots.find(
      (s) => s.areaSlug === areaSlug && s.snapshot.kpi.name === name
    )?.snapshot;

  const ticketMedio = findKpi("comercial", "Ticket médio");
  const vendas = findKpi("comercial", "Vendas fechadas");

  const headline = [
    vendas && {
      label: "Vendas fechadas",
      value: `${Math.round(vendas.value)}`,
      deltaPct: vendas.deltaPct,
      targetLabel: vendas.target ? `Meta: ${vendas.target}` : null,
      atingimento: vendas.atingimento,
      status: vendas.status,
    },
    ticketMedio && {
      label: "Ticket médio",
      value: formatCompactCurrency(ticketMedio.value),
      deltaPct: ticketMedio.deltaPct,
      targetLabel: ticketMedio.target
        ? `Meta: ${formatCompactCurrency(ticketMedio.target)}`
        : null,
      atingimento: ticketMedio.atingimento,
      status: ticketMedio.status,
    },
  ].filter(Boolean) as {
    label: string;
    value: string;
    deltaPct: number | null;
    targetLabel: string | null;
    atingimento: number | null;
    status: ReturnType<typeof computeKpiSnapshot>["status"];
  }[];

  // Fallback headline tiles for non-admin users without commercial visibility
  if (headline.length === 0 && allSnapshots.length > 0) {
    for (const s of allSnapshots.slice(0, 4)) {
      headline.push({
        label: s.snapshot.kpi.name,
        value: String(Math.round(s.snapshot.value * 100) / 100),
        deltaPct: s.snapshot.deltaPct,
        targetLabel: s.snapshot.target ? `Meta: ${s.snapshot.target}` : null,
        atingimento: s.snapshot.atingimento,
        status: s.snapshot.status,
      });
    }
  }

  const areaPerformance = areas.map((area) => {
    const snaps = allSnapshots
      .filter((s) => s.areaSlug === area.slug)
      .map((s) => s.snapshot);
    return { name: area.name, slug: area.slug, pct: averageAtingimento(snaps) };
  });

  const allProjects = areas.flatMap((a) =>
    a.projects.map((p) => ({ ...p, areaName: a.name, areaSlug: a.slug }))
  );
  const projectCounts = {
    no_ritmo: allProjects.filter((p) => p.status === "no_ritmo").length,
    risco: allProjects.filter((p) => p.status === "risco").length,
    atrasado: allProjects.filter((p) => p.status === "atrasado").length,
    pausado: allProjects.filter((p) => p.status === "pausado").length,
    concluido: allProjects.filter((p) => p.status === "concluido").length,
  };

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
  const nextEvent = allEvents
    .filter((e) => e.status !== "realizado" && e.status !== "cancelado")
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())[0];
  const eventsBudgetPlanned = allEvents.reduce((s, e) => s + (e.budgetPlanned ?? 0), 0);
  const eventsBudgetActual = allEvents.reduce(
    (s, e) => s + computeEventStats(e).budgetActual,
    0
  );

  // Patrocínios: meta sempre 50% acima do budget planejado do evento;
  // realizado = histórico real de patrocínios (planilha) vinculado ao
  // evento, com fallback para o Sponsor (Patrocínios) quando não há
  // vínculo automático.
  const allSponsorships = await prisma.sponsorship.findMany({ where: { eventId: { not: null } } });
  const sponsorshipByEvent = allEvents.map((e) => {
    const stats = computeEventStats(e);
    const realHistory = allSponsorships.filter((s) => s.eventId === e.id);
    const realizedFromHistory = realHistory.reduce((s, r) => s + (r.paidValue ?? 0), 0);
    return {
      id: e.id,
      name: e.name,
      target: sponsorTarget(e.budgetPlanned),
      realized: realHistory.length > 0 ? realizedFromHistory : stats.sponsorRevenueRealized,
      contracted: stats.sponsorRevenuePlanned,
    };
  });
  const sponsorshipTargetTotal = sponsorshipByEvent.reduce((s, e) => s + e.target, 0);
  const sponsorshipRealizedTotal = sponsorshipByEvent.reduce((s, e) => s + e.realized, 0);

  // Social: panorama planejado x realizado direto dos KPIs reais da área.
  const socialArea = visible === "all" || visible.includes("social")
    ? await prisma.area.findUnique({
        where: { slug: "social" },
        include: { kpis: { include: { entries: true, targets: true } } },
      })
    : null;
  const socialSnapshots = socialArea
    ? socialArea.kpis
        .map((k) => computeKpiSnapshot(k, k.entries, period, k.targets))
        .filter((s) => s.target !== null)
    : [];

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

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Resultado é o que sustenta a autoridade."
        subtitle="Tudo o que importa hoje, em um só lugar — autorresponsabilidade e entrega, todos os dias."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Brand Legacy OS
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Visão Geral da Operação
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

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Comercial — performance geral
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {headline.map((h) => (
            <StatTile key={h.label} {...h} />
          ))}
          {headline.length === 0 && (
            <p className="text-[13px] text-ink-faint">
              Nenhum indicador disponível para este filtro ainda.
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Performance por área
            </h2>
            <span className="text-[11.5px] text-ink-faint">
              média de atingimento das metas
            </span>
          </div>
          <div className="flex flex-col">
            {areaPerformance.map((a) => (
              <AreaBar
                key={a.slug}
                name={a.name}
                href={`/areas/${a.slug}`}
                pct={a.pct}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">Projetos</h2>
          <div className="flex flex-col gap-2.5">
            {(
              [
                ["no_ritmo", projectCounts.no_ritmo],
                ["risco", projectCounts.risco],
                ["atrasado", projectCounts.atrasado],
                ["pausado", projectCounts.pausado],
                ["concluido", projectCounts.concluido],
              ] as const
            ).map(([key, count]) => (
              <div key={key} className="flex items-center justify-between">
                <StatusPill
                  label={PROJECT_STATUS_META[key].label}
                  tone={projectStatusTone(key)}
                />
                <span className="tnum text-[14px] font-medium text-ink">
                  {count}
                </span>
              </div>
            ))}
          </div>
          <Link
            href={
              isAdmin(user) ? "/projetos" : `/projetos`
            }
            className="mt-1 text-[12.5px] font-medium text-brand hover:underline"
          >
            Ver todos os projetos →
          </Link>
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">Eventos</h2>
          <Link
            href="/eventos"
            className="text-[12px] font-medium text-brand hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {nextEvent ? (
            <Link
              href={`/eventos/${nextEvent.id}`}
              className="flex flex-col gap-1 rounded-(--radius-s) bg-surface-muted p-3 hover:bg-border-strong/20"
            >
              <span className="text-[11.5px] text-ink-faint">Próximo evento</span>
              <span className="text-[13.5px] font-medium text-ink">
                {nextEvent.name}
              </span>
              <span className="text-[12px] text-ink-soft">
                {formatDateFull(nextEvent.startDate)}
              </span>
            </Link>
          ) : (
            <div className="flex flex-col gap-1 rounded-(--radius-s) bg-surface-muted p-3">
              <span className="text-[11.5px] text-ink-faint">Próximo evento</span>
              <span className="text-[13px] text-ink-faint">
                Nenhum evento futuro cadastrado.
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1.5 rounded-(--radius-s) bg-surface-muted p-3">
            <span className="text-[11.5px] text-ink-faint">
              Budget de eventos (ano)
            </span>
            <span className="tnum text-[13.5px] font-medium text-ink">
              {formatCompactCurrency(eventsBudgetActual)} /{" "}
              {formatCompactCurrency(eventsBudgetPlanned)}
            </span>
            <div className="h-1.5 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-gold"
                style={{
                  width: `${Math.min(100, Math.max(2, eventsBudgetPlanned ? (eventsBudgetActual / eventsBudgetPlanned) * 100 : 0))}%`,
                }}
              />
            </div>
          </div>
        </div>

        {sponsorshipByEvent.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <Link href="/patrocinios" className="text-[12px] font-medium text-ink-soft hover:text-brand hover:underline">
                Patrocínios (ano) — meta vs. realizado
              </Link>
              <span className="tnum text-[12.5px] text-ink-faint">
                {formatCompactCurrency(sponsorshipRealizedTotal)} / {formatCompactCurrency(sponsorshipTargetTotal)}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {sponsorshipByEvent.map((e) => (
                <Link
                  key={e.id}
                  href={`/eventos/${e.id}`}
                  className="flex items-center justify-between gap-3 rounded-(--radius-s) px-2 py-1.5 text-[12.5px] hover:bg-surface-muted"
                >
                  <span className="text-ink">{e.name}</span>
                  <span className="tnum text-ink-faint">
                    {formatCompactCurrency(e.realized)} / {formatCompactCurrency(e.target)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {socialSnapshots.length > 0 && (
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-ink-soft">Social — planejado x realizado</h2>
            <Link href="/social" className="text-[12px] font-medium text-brand hover:underline">
              Ver área →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {socialSnapshots.map((s) => (
              <div key={s.kpi.id} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
                <span className="text-[11.5px] text-ink-faint">{s.kpi.name}</span>
                <span className="tnum text-[17px] font-medium text-ink">
                  {formatCompactCurrency(s.value)}
                  {s.target ? ` / ${formatCompactCurrency(s.target)}` : ""}
                </span>
                {s.atingimento !== null && (
                  <>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <span
                        className="block h-full rounded-full bg-gold"
                        style={{ width: `${Math.min(100, Math.max(4, s.atingimento))}%` }}
                      />
                    </div>
                    <span className="tnum text-[11.5px] text-ink-faint">{s.atingimento}% da meta</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {csSummary && (
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-ink-soft">Customer Success</h2>
            <Link href="/cs" className="text-[12px] font-medium text-brand hover:underline">
              Ver área →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
              <span className="text-[11.5px] text-ink-faint">Mentorados ativos por carteira</span>
              <div className="flex flex-col gap-1.5">
                {csSummary.byCarteira.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink">{c.name}</span>
                    <span className="tnum font-medium text-ink">{c.count}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-1.5 text-[12.5px] font-medium">
                  <span className="text-ink">Total</span>
                  <span className="tnum text-ink">{csSummary.active}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11.5px] text-ink-faint">eNPS por mês</span>
              <div className="flex items-end gap-2">
                {csSummary.enpsByMonth.map((m) => (
                  <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="tnum text-[12px] font-medium text-ink">
                      {m.score !== null ? m.score : "—"}
                    </span>
                    <span className="text-[10px] text-ink-faint">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[11.5px] text-ink-faint">Renovações — disponível x realizado</span>
              <span className="tnum text-[18px] font-medium text-ink">
                {formatCompactCurrency(csSummary.renewalsRealized)} / {formatCompactCurrency(csSummary.renewalsPlanned)}
              </span>
              <div className="h-1.5 overflow-hidden rounded-full bg-border">
                <span
                  className="block h-full rounded-full bg-gold"
                  style={{
                    width: `${Math.min(100, Math.max(2, csSummary.renewalsPlanned ? (csSummary.renewalsRealized / csSummary.renewalsPlanned) * 100 : 0))}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </section>
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
