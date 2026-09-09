import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewArea, canEditAreaKpis, isAdmin } from "@/lib/permissions";
import { performanceGroup, PERFORMANCE_GROUP_ORDER, parsePerformanceNumber, findMetric } from "@/lib/performance";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { computeAtingimento, computeKpiStatus, formatDateTime } from "@/lib/format";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { TrafficRefreshButton } from "@/components/traffic/traffic-refresh-button";
import { TrafficStatGroup } from "@/components/traffic/traffic-stat-group";
import { TrafficLeaderboard } from "@/components/traffic/traffic-leaderboard";
import { summarizeTraffic, campaignsByCategory, loadTrafficPeriodData, loadTrafficLeaderboards, prorateMql } from "@/lib/traffic";

export default async function TrafegoPage({
  searchParams,
}: PageProps<"/trafego">) {
  const user = await requireUser();
  if (!isAdmin(user) && !canViewArea(user, "comercial")) notFound();
  const canEdit = isAdmin(user) || canEditAreaKpis(user, "comercial");
  const sp = await searchParams;

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const [{ campaigns, mqlCount, lastFetched }, { topCampaigns, topAds }] = await Promise.all([
    loadTrafficPeriodData(period.start, period.end),
    loadTrafficLeaderboards(period.start, period.end),
  ]);
  const totalSummary = summarizeTraffic(campaigns, mqlCount);
  const aquisicaoRows = campaignsByCategory(campaigns, "aquisicao");
  const aquisicaoMql = prorateMql(
    mqlCount,
    aquisicaoRows.reduce((s, r) => s + r.spend, 0),
    totalSummary.spend
  );
  const aquisicaoSummary = summarizeTraffic(aquisicaoRows, aquisicaoMql);

  const sections = await prisma.performanceSection.findMany({
    include: { metrics: { orderBy: { order: "asc" } } },
    orderBy: { order: "asc" },
  });

  const byGroup = new Map<string, typeof sections>();
  for (const s of sections) {
    const g = performanceGroup(s.name);
    byGroup.set(g, [...(byGroup.get(g) ?? []), s]);
  }

  // Headline executivo: alguns números-chave do Resumo Geral + Marketing,
  // com barra de atingimento — o resto da página segue detalhado por funil.
  const headlineDefs = [
    { section: "Resumo Geral", label: "Faturamento Total Mês", fmt: "money" as const },
    { section: "MARKETING", label: "Total de Leads válidos", fmt: "count" as const },
    { section: "MARKETING", label: "Total de MQL", fmt: "count" as const },
    { section: "Resumo Geral", label: "Ticket Médio Mês", fmt: "money" as const },
  ];
  const moneyFmt = (v: number) =>
    `R$ ${v.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
  const headline = headlineDefs
    .map((h) => {
      const m = findMetric(sections, h.section, h.label);
      if (!m) return null;
      const target = parsePerformanceNumber(m.target);
      const realized = parsePerformanceNumber(m.realized);
      if (realized === null) return null;
      const atingimento = target ? computeAtingimento(realized, target, true) : null;
      const status = target ? computeKpiStatus(realized, target, true) : null;
      return {
        label: `${h.label} (${h.section})`,
        value: h.fmt === "money" ? moneyFmt(realized) : realized.toLocaleString("pt-BR"),
        targetLabel: target ? `Meta: ${h.fmt === "money" ? moneyFmt(target) : target.toLocaleString("pt-BR")}` : null,
        atingimento,
        status,
      };
    })
    .filter((h): h is NonNullable<typeof h> => h !== null);

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Resultado é o que sustenta a autoridade."
        subtitle="Autorresponsabilidade, entrega e dados reais guiando cada decisão comercial — sem atalho, sem desculpa."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Tráfego &amp; Performance Comercial
        </h1>
        <p className="max-w-[72ch] text-[13px] text-ink-soft">
          Aquisição, funis de conversão, social selling, SDR, closers e renovação —
          importado diretamente da planilha real de performance do time.
          Meta x realizado do mês corrente, valores exatamente como registrados
          na origem.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar areaOptions={[]} responsibleOptions={[]} />
        {canEdit && <TrafficRefreshButton lastUpdatedLabel={lastFetched ? formatDateTime(lastFetched) : null} />}
      </div>

      <TrafficStatGroup
        title={`Aquisição via tráfego pago · ${period.label.toLowerCase()}`}
        description="Direto do Facebook Ads (Windsor.ai) + leads MQL validados no CRM."
        summary={totalSummary}
      />

      <TrafficStatGroup
        title="Aquisição"
        description="Campanhas de captação geral (cadastros, webinars, diagnóstico) — exclui Eventos e Distribuição de Conteúdo, que aparecem no Comercial."
        summary={aquisicaoSummary}
        mqlIsEstimate
      />

      <section className="flex flex-col gap-3">
        <h3 className="text-[12.5px] font-medium text-ink-soft">
          O que está funcionando · {period.label.toLowerCase()}
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrafficLeaderboard title="Campanhas com melhor desempenho" emptyLabel="Nenhuma campanha com leads no período." rows={topCampaigns} />
          <TrafficLeaderboard title="Criativos com melhor desempenho" emptyLabel="Nenhum criativo com leads no período." rows={topAds} />
        </div>
      </section>

      {headline.length > 0 && (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {headline.map((h) => (
            <StatTile key={h.label} {...h} />
          ))}
        </section>
      )}

      <div className="flex flex-col gap-8">
        {PERFORMANCE_GROUP_ORDER.map((group) => {
          const groupSections = byGroup.get(group);
          if (!groupSections || groupSections.length === 0) return null;
          return (
            <section key={group} className="flex flex-col gap-3">
              <h2 className="text-[14px] font-medium text-ink">{group}</h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {groupSections.map((s) => (
                  <div key={s.id} className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-[12.5px] font-medium uppercase tracking-[0.04em] text-ink-faint">
                        {s.name}
                      </h3>
                      <div className="flex gap-3 text-[10px] uppercase tracking-[0.04em] text-ink-faint">
                        <span className="w-16 text-right">Meta</span>
                        <span className="w-16 text-right">Realizado</span>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      {s.metrics.map((m, i) => (
                        <div
                          key={m.id}
                          className={`grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-(--radius-s) px-2 py-1.5 text-[12.5px] ${
                            i % 2 === 1 ? "bg-surface-muted/60" : ""
                          }`}
                        >
                          <span className="text-ink-soft">{m.label}</span>
                          <span className="tnum w-16 text-right text-ink-faint">{m.target ?? "—"}</span>
                          <span className="tnum w-16 text-right font-medium text-ink">{m.realized ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
        {sections.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
            Nenhum dado de performance importado ainda.
          </p>
        )}
      </div>
    </>
  );
}
