import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewArea, canEditAreaKpis, isAdmin } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { computeKpiSnapshot } from "@/lib/kpi";
import { computeOperationsStats } from "@/lib/operations";
import { formatDateTime } from "@/lib/format";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KpiCard } from "@/components/area/kpi-card";
import { ProjectCard } from "@/components/area/project-card";
import { TaskRow } from "@/components/area/task-row";
import { CreateTaskForm } from "@/components/area/create-task-form";
import { CreateProjectForm } from "@/components/area/create-project-form";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { TrafficStatGroup } from "@/components/traffic/traffic-stat-group";
import { summarizeTraffic, campaignsByCategory, loadTrafficPeriodData, prorateMql, TRAFFIC_CATEGORY_META } from "@/lib/traffic";
import { ComercialRefreshButton } from "@/components/comercial/comercial-refresh-button";
import { FaturamentoDashboard } from "@/components/comercial/faturamento-dashboard";
import { CloserBreakdown } from "@/components/comercial/closer-breakdown";
import {
  loadOpportunitiesWonInPeriod,
  loadOpportunitiesInPeriod,
  loadComercialMonthlyTrend,
  loadMeetingsInPeriod,
  loadSponsorshipsClosedInPeriod,
  loadChannelBreakdown,
} from "@/lib/comercial";

const AREA_CULTURE: Record<string, { title: string; subtitle: string }> = {
  operacoes: {
    title: "Execução impecável é a base de tudo.",
    subtitle: "Prazo combinado é prazo entregue — sem depender de cobrança.",
  },
  comercial: {
    title: "Resultado é o que sustenta a autoridade.",
    subtitle: "Autorresponsabilidade, entrega e dados reais guiando cada decisão comercial — sem atalho, sem desculpa.",
  },
  juridico: {
    title: "Rigor que protege o que construímos.",
    subtitle: "Cada contrato, cada cláusula — feito com o mesmo padrão de excelência da entrega.",
  },
  financeiro: {
    title: "Clareza numérica é liberdade de decisão.",
    subtitle: "Sem número inventado, sem planilha paralela — a verdade financeira é uma só.",
  },
};

export default async function AreaPage({
  params,
  searchParams,
}: PageProps<"/areas/[slug]">) {
  const user = await requireUser();
  const { slug } = await params;
  const sp = await searchParams;

  // Operações não tem mais página própria — a área continua existindo no
  // banco (tarefas, KPIs, liderança), mas a função dela agora é coberta
  // pelo hub "Operações" (ex-Projetos e Tarefas, em /projetos).
  if (slug === "operacoes") redirect("/projetos");

  const area = await prisma.area.findUnique({
    where: { slug },
    include: {
      kpis: { include: { entries: true, targets: true, responsible: true } },
      projects: { include: { owner: true }, orderBy: { deadline: "asc" } },
      tasks: {
        include: { assignee: true, project: true },
        orderBy: { deadline: "asc" },
      },
      memberships: { include: { user: true } },
    },
  });

  if (!area) notFound();
  if (!canViewArea(user, slug)) notFound();

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);
  const respFilter = typeof sp.responsavel === "string" ? sp.responsavel : "";

  const canEdit = canEditAreaKpis(user, slug);

  const kpis = area.kpis.filter(
    (k) => !respFilter || k.responsibleId === respFilter
  );
  const snapshots = kpis.map((k) =>
    computeKpiSnapshot(k, k.entries, period, k.targets)
  );

  const operationsStats =
    slug === "operacoes"
      ? computeOperationsStats(await prisma.task.findMany(), period)
      : null;

  // Faturamento/pipeline/reuniões reais (GoHighLevel + Calendly) — substitui
  // os antigos closerSections/resumoGeral da planilha estática.
  const comercialData =
    slug === "comercial"
      ? await (async () => {
          const now = new Date();
          const yearStart = new Date(now.getFullYear(), 0, 1);
          const [
            wonInPeriod,
            allInPeriod,
            monthlyTrend,
            meetingsInPeriod,
            yearWon,
            lastFetched,
            sponsorships,
            socialSelling,
            sdr,
          ] = await Promise.all([
            loadOpportunitiesWonInPeriod(period.start, period.end),
            loadOpportunitiesInPeriod(period.start, period.end),
            loadComercialMonthlyTrend(),
            loadMeetingsInPeriod(period.start, period.end),
            prisma.ghlOpportunity.findMany({ where: { status: "won" } }).then((rows) =>
              rows.filter((r) => (r.wonAt ?? r.createdAt) >= yearStart && (r.wonAt ?? r.createdAt) <= now)
            ),
            prisma.ghlOpportunity.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
            loadSponsorshipsClosedInPeriod(period.start, period.end),
            loadChannelBreakdown("social_selling", period.start, period.end),
            loadChannelBreakdown("sdr", period.start, period.end),
          ]);

          const emailToName = new Map(area.memberships.map((m) => [m.user.email, m.user.name]));
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
            wonInPeriod,
            yearRevenue: yearWon.reduce((s, r) => s + r.monetaryValue, 0),
            monthlyTrend,
            meetingsInPeriod,
            closers,
            lastFetched: lastFetched?.fetchedAt ?? null,
            sponsorships,
            socialSelling,
            sdr,
          };
        })()
      : null;

  // Investimento em Captação de Leads para Eventos e em Distribuição de
  // Conteúdo — as outras duas categorias do Windsor.ai além de Aquisição,
  // que fica em Tráfego (ver src/lib/traffic.ts).
  const trafficByCategory =
    slug === "comercial"
      ? await (async () => {
          const { campaigns, mqlCount } = await loadTrafficPeriodData(period.start, period.end);
          const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
          const build = (category: "eventos" | "distribuicao") => {
            const rows = campaignsByCategory(campaigns, category);
            const spend = rows.reduce((s, r) => s + r.spend, 0);
            return summarizeTraffic(rows, prorateMql(mqlCount, spend, totalSpend));
          };
          return { eventos: build("eventos"), distribuicao: build("distribuicao") };
        })()
      : null;

  const recentEntries = area.kpis
    .flatMap((k) =>
      k.entries
        .filter((e) => e.note)
        .map((e) => ({
          at: e.createdAt,
          text: `${k.name}: registrado ${e.value} — "${e.note}"`,
        }))
    )
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  const auditEntries = await prisma.auditLog.findMany({
    where: { entityId: { in: area.tasks.map((t) => t.id) } },
    include: { user: true },
    orderBy: { at: "desc" },
    take: 6,
  });

  const updates = [
    ...recentEntries.map((e) => ({ at: e.at, text: e.text })),
    ...auditEntries.map((a) => ({
      at: a.at,
      text: `${a.user.name} alterou ${a.field} de uma tarefa: "${a.oldValue ?? "—"}" → "${a.newValue ?? "—"}"`,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const culture = AREA_CULTURE[slug];

  return (
    <>
      {culture && (
        <CultureBanner eyebrow="Cultura Brand Legacy" title={culture.title} subtitle={culture.subtitle} />
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            {area.name}
          </h1>
          <p className="max-w-[52ch] text-[13px] text-ink-soft">
            {area.description}
          </p>
          {area.slug === "eventos" && (
            <Link
              href="/eventos"
              className="mt-1 w-fit text-[12.5px] font-medium text-brand hover:underline"
            >
              Ver budget, confirmados e patrocínios de cada evento →
            </Link>
          )}
          {area.slug === "comercial" && (
            <Link
              href="/trafego"
              className="mt-1 w-fit text-[12.5px] font-medium text-brand hover:underline"
            >
              Ver Tráfego e funis comerciais (aquisição, social selling, SDR, closers) →
            </Link>
          )}
        </div>
        <FilterBar
          areaOptions={[]}
          responsibleOptions={area.memberships.map((m) => ({
            value: m.user.id,
            label: m.user.name,
          }))}
        />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Indicadores · {period.label.toLowerCase()}
        </h2>
        {operationsStats ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-(--radius-l) border border-border bg-surface p-5">
              <p className="text-[12px] text-ink-soft">Pontualidade de entregas</p>
              <p className="tnum font-(family-name:--font-display) text-[26px] text-ink">
                {operationsStats.pontualidadePct !== null
                  ? `${operationsStats.pontualidadePct}%`
                  : "—"}
              </p>
              <p className="text-[11px] text-ink-faint">
                {operationsStats.completedCount > 0
                  ? `${operationsStats.completedCount} tarefa${operationsStats.completedCount === 1 ? "" : "s"} concluída${operationsStats.completedCount === 1 ? "" : "s"} no período · calculado do Workflow`
                  : "Nenhuma tarefa concluída no período · calculado do Workflow"}
              </p>
            </div>
            <div className="rounded-(--radius-l) border border-border bg-surface p-5">
              <p className="text-[12px] text-ink-soft">Tarefas atrasadas (todas as áreas)</p>
              <p className="tnum font-(family-name:--font-display) text-[26px] text-ink">
                {operationsStats.tarefasAtrasadas}
              </p>
              <p className="text-[11px] text-ink-faint">
                agora, somando todas as áreas · calculado do Workflow
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {snapshots.map((s) => (
              <KpiCard
                key={s.kpi.id}
                snapshot={s}
                responsibleName={
                  area.kpis.find((k) => k.id === s.kpi.id)?.responsible.name ?? ""
                }
                canEdit={canEdit}
              />
            ))}
            {snapshots.length === 0 && (
              <p className="text-[13px] text-ink-faint">
                Nenhum indicador cadastrado para esta área ainda.
              </p>
            )}
          </div>
        )}
      </section>

      {comercialData && (
        <>
          <div className="flex items-center justify-end">
            {canEdit && (
              <ComercialRefreshButton
                lastUpdatedLabel={comercialData.lastFetched ? formatDateTime(comercialData.lastFetched) : null}
              />
            )}
          </div>
          <FaturamentoDashboard
            periodLabel={period.label}
            wonInPeriod={comercialData.wonInPeriod}
            yearRevenue={comercialData.yearRevenue}
            monthlyTrend={comercialData.monthlyTrend}
            meetingsInPeriod={comercialData.meetingsInPeriod}
            sponsorships={comercialData.sponsorships}
            socialSelling={comercialData.socialSelling}
            sdr={comercialData.sdr}
          />
        </>
      )}

      {trafficByCategory && (
        <>
          <TrafficStatGroup
            title={TRAFFIC_CATEGORY_META.eventos.label}
            description={`Campanhas de Imersão · ${period.label.toLowerCase()} · direto do Facebook Ads (Windsor.ai).`}
            summary={trafficByCategory.eventos}
            mqlIsEstimate
          />
          <TrafficStatGroup
            title={TRAFFIC_CATEGORY_META.distribuicao.label}
            description={`Posts impulsionados · ${period.label.toLowerCase()} · direto do Facebook Ads (Windsor.ai).`}
            summary={trafficByCategory.distribuicao}
            mqlIsEstimate
          />
        </>
      )}

      {comercialData && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-[13px] font-medium text-ink-soft">Closers · {period.label.toLowerCase()}</h2>
            <p className="text-[11.5px] text-ink-faint">
              Origem dos leads mapeada por pipeline no GoHighLevel (Indicação, Referidos e Recuperação
              Própria não têm pipeline dedicado hoje, então não aparecem). Reuniões via Calendly.
            </p>
          </div>
          <CloserBreakdown closers={comercialData.closers} />
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Tarefas ({area.tasks.length})
          </h2>
          <div className="rounded-(--radius-l) border border-border bg-surface px-4">
            {area.tasks.map((t) => (
              <TaskRow
                key={t.id}
                task={t}
                assigneeName={t.assignee.name}
                assigneeInitials={t.assignee.avatarInitials}
                projectName={t.project?.name}
                canManage={
                  isAdmin(user) || canEdit || t.assigneeId === user.id
                }
              />
            ))}
            {area.tasks.length === 0 && (
              <p className="py-4 text-[13px] text-ink-faint">
                Nenhuma tarefa por aqui ainda.
              </p>
            )}
          </div>
          {canEdit && (
            <CreateTaskForm
              areaId={area.id}
              members={area.memberships.map((m) => ({
                id: m.user.id,
                name: m.user.name,
              }))}
              projects={area.projects.map((p) => ({ id: p.id, name: p.name }))}
            />
          )}
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Projetos ({area.projects.length})
          </h2>
          <div className="flex flex-col gap-3">
            {area.projects.map((p) => (
              <ProjectCard
                key={p.id}
                id={p.id}
                name={p.name}
                status={p.status}
                progressPct={p.progressPct}
                deadline={p.deadline}
                ownerName={p.owner.name}
                canEdit={canEdit}
              />
            ))}
            {area.projects.length === 0 && (
              <p className="text-[13px] text-ink-faint">
                Nenhum projeto vinculado a esta área.
              </p>
            )}
          </div>
          {canEdit && (
            <CreateProjectForm
              areaId={area.id}
              members={area.memberships.map((m) => ({
                id: m.user.id,
                name: m.user.name,
              }))}
            />
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Time ({area.memberships.length})
          </h2>
          <div className="flex flex-col gap-1 rounded-(--radius-l) border border-border bg-surface p-2">
            {area.memberships.map((m) => (
              <Link
                key={m.id}
                href={`/perfil/${m.user.id}`}
                className="flex items-center gap-3 rounded-(--radius-s) px-2.5 py-2 transition-colors hover:bg-surface-muted"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-deep text-[11px] font-semibold text-gold-soft">
                  {m.user.avatarInitials}
                </span>
                <div className="flex flex-col">
                  <span className="text-[13px] text-ink">{m.user.name}</span>
                  <span className="text-[11.5px] text-ink-faint">
                    {m.title}
                  </span>
                </div>
                {m.role === "lider" && (
                  <span className="ml-auto rounded-full bg-gold-tint px-2 py-0.5 text-[10.5px] font-medium text-gold-ink">
                    Líder
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Atualizações recentes
          </h2>
          <div className="rounded-(--radius-l) border border-border bg-surface p-2">
            {updates.map((u, i) => (
              <div
                key={i}
                className="flex flex-col gap-0.5 border-t border-border px-2.5 py-2 first:border-t-0"
              >
                <span className="text-[12.5px] text-ink">{u.text}</span>
                <span className="text-[11px] text-ink-faint">
                  {formatDateTime(u.at)}
                </span>
              </div>
            ))}
            {updates.length === 0 && (
              <p className="px-2.5 py-3 text-[13px] text-ink-faint">
                Sem movimentações recentes.
              </p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
