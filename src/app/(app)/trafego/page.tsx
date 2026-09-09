import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canViewArea, canEditAreaKpis, isAdmin } from "@/lib/permissions";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { formatDateTime } from "@/lib/format";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { TrafficRefreshButton } from "@/components/traffic/traffic-refresh-button";
import { TrafficStatGroup } from "@/components/traffic/traffic-stat-group";
import { TrafficLeaderboard } from "@/components/traffic/traffic-leaderboard";
import { StatTile } from "@/components/dashboard/stat-tile";
import { TrendChart } from "@/components/finance/trend-chart";
import { formatCompactCurrency } from "@/lib/format";
import {
  summarizeTraffic,
  campaignsByCategory,
  loadTrafficPeriodData,
  loadTrafficLeaderboards,
  loadTrafficMonthlyTrend,
  prorateMql,
} from "@/lib/traffic";

export default async function TrafegoPage({
  searchParams,
}: PageProps<"/trafego">) {
  const user = await requireUser();
  if (!isAdmin(user) && !canViewArea(user, "comercial")) notFound();
  const canEdit = isAdmin(user) || canEditAreaKpis(user, "comercial");
  const sp = await searchParams;

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const [{ campaigns, mqlCount, sqlCount, lastFetched }, { topCampaigns, topAds }, monthlyTrend] = await Promise.all([
    loadTrafficPeriodData(period.start, period.end),
    loadTrafficLeaderboards(period.start, period.end),
    loadTrafficMonthlyTrend(),
  ]);
  const totalSummary = summarizeTraffic(campaigns, mqlCount);
  const aquisicaoRows = campaignsByCategory(campaigns, "aquisicao");
  const aquisicaoMql = prorateMql(
    mqlCount,
    aquisicaoRows.reduce((s, r) => s + r.spend, 0),
    totalSummary.spend
  );
  const aquisicaoSummary = summarizeTraffic(aquisicaoRows, aquisicaoMql);
  const costPerSql = sqlCount > 0 ? totalSummary.spend / sqlCount : null;

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
          Tráfego
        </h1>
        <p className="max-w-[72ch] text-[13px] text-ink-soft">
          Aquisição via tráfego pago — direto do Facebook Ads e do CRM, via Windsor.ai.
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

      <StatTile label={`Verba investida · ${period.label.toLowerCase()}`} value={formatCompactCurrency(totalSummary.spend)} />

      <section className="flex flex-col gap-3">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[12.5px] font-medium text-ink-soft">Funil comercial</h3>
          <p className="text-[11.5px] text-ink-faint">
            SQL = oportunidades que o Comercial avançou além do primeiro estágio do funil no CRM.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatTile label="SQL (oportunidades qualificadas)" value={sqlCount.toLocaleString("pt-BR")} />
          <StatTile label="Custo por SQL" value={costPerSql !== null ? formatCompactCurrency(costPerSql) : "—"} />
        </div>
      </section>

      <TrafficStatGroup
        title="Aquisição"
        description="Campanhas de captação geral (cadastros, webinars, diagnóstico) — exclui Eventos e Distribuição de Conteúdo, que aparecem no Comercial."
        summary={aquisicaoSummary}
        mqlIsEstimate
      />

      <section className="flex flex-col gap-3">
        <h3 className="text-[12.5px] font-medium text-ink-soft">
          Verba, CPL e MQL mês a mês · {new Date().getFullYear()}
        </h3>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h4 className="text-[12px] font-medium text-ink-soft">Verba investida</h4>
            <TrendChart points={monthlyTrend.map((m) => ({ label: m.label, value: m.spend }))} formatValue={formatCompactCurrency} />
          </div>
          <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h4 className="text-[12px] font-medium text-ink-soft">CPL (custo por lead)</h4>
            <TrendChart points={monthlyTrend.map((m) => ({ label: m.label, value: m.cpl }))} formatValue={formatCompactCurrency} />
          </div>
          <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h4 className="text-[12px] font-medium text-ink-soft">Leads MQL</h4>
            <TrendChart points={monthlyTrend.map((m) => ({ label: m.label, value: m.mqlCount }))} formatValue={(v) => String(Math.round(v))} />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-[12.5px] font-medium text-ink-soft">
          O que está funcionando · {period.label.toLowerCase()}
        </h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <TrafficLeaderboard title="Campanhas com melhor desempenho" emptyLabel="Nenhuma campanha com leads no período." rows={topCampaigns} />
          <TrafficLeaderboard title="Criativos com melhor desempenho" emptyLabel="Nenhum criativo com leads no período." rows={topAds} />
        </div>
      </section>
    </>
  );
}
