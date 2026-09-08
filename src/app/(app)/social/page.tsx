import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewArea } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { monthKey, periodKeyLabel } from "@/lib/finance";
import { SocialTabs } from "@/components/social/social-tabs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { StatTile } from "@/components/dashboard/stat-tile";
import { TrendChart } from "@/components/finance/trend-chart";
import { DonutChart } from "@/components/charts/donut-chart";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { formatCompactCurrency } from "@/lib/format";
import { notFound } from "next/navigation";

function lastNMonthKeys(n: number, endKey: string) {
  const [y, m] = endKey.split("-").map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(monthKey(new Date(y, m - 1 - i, 1)));
  return keys;
}

/** Extrai o primeiro número de uma string tipo "12,4%" ou "1.234" — os
 * valores do Reportei vêm como texto livre (ver reportei-scraper.ts). */
function parseMetricNumber(raw: string): number | null {
  const cleaned = raw.replace(/\./g, "").replace(",", ".").match(/-?\d+(\.\d+)?/);
  return cleaned ? Number(cleaned[0]) : null;
}

export default async function SocialPage({
  searchParams,
}: PageProps<"/social">) {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const sp = await searchParams;

  const area = await prisma.area.findUnique({
    where: { slug: "social" },
    include: { memberships: { include: { user: true } } },
  });
  if (!area) notFound();

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const now = new Date();
  const currentMonthKey = monthKey(now);
  const months = lastNMonthKeys(6, currentMonthKey);

  const [leads, posts, profiles] = await Promise.all([
    prisma.socialSellingLead.findMany(),
    prisma.contentCalendarPost.findMany({ where: { date: { gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) } } }),
    prisma.socialProfile.findMany({
      where: { reporteiUrl: { not: null } },
      include: { reporteiMetrics: { orderBy: { fetchedAt: "desc" } } },
      orderBy: { order: "asc" },
    }),
  ]);

  // --- Leads gerados via Social (CRM Social Selling) ---
  const leadsThisMonth = leads.filter((l) => monthKey(l.createdAt) === currentMonthKey).length;
  const leadsTrend = months.map((mk) => ({
    label: periodKeyLabel(mk).slice(0, 3),
    value: leads.filter((l) => monthKey(l.createdAt) === mk).length,
  }));

  // --- Receita gerada por Social (CRM Social Selling) ---
  const closedLeads = leads.filter((l) => l.saleValue && l.saleDate);
  const revenueThisMonth = closedLeads
    .filter((l) => monthKey(l.saleDate!) === currentMonthKey)
    .reduce((s, l) => s + (l.saleValue ?? 0), 0);
  const weekBuckets = new Map<number, number>();
  for (const l of closedLeads.filter((l) => monthKey(l.saleDate!) === currentMonthKey)) {
    const week = Math.ceil(new Date(l.saleDate!).getDate() / 7);
    weekBuckets.set(week, (weekBuckets.get(week) ?? 0) + (l.saleValue ?? 0));
  }
  const revenueByWeek = [...weekBuckets.entries()].sort(([a], [b]) => a - b);
  const revenueTrend = months.map((mk) => ({
    label: periodKeyLabel(mk).slice(0, 3),
    value: closedLeads.filter((l) => monthKey(l.saleDate!) === mk).reduce((s, l) => s + (l.saleValue ?? 0), 0),
  }));

  // --- CRM extra: ticket médio + vendas por produto ---
  const ticketMedio = closedLeads.length > 0 ? closedLeads.reduce((s, l) => s + (l.saleValue ?? 0), 0) / closedLeads.length : 0;
  const byProduct = new Map<string, { count: number; value: number }>();
  for (const l of closedLeads) {
    const key = l.saleProduct ?? "Outro";
    const entry = byProduct.get(key) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += l.saleValue ?? 0;
    byProduct.set(key, entry);
  }
  const productDonutData = [...byProduct.entries()]
    .filter(([, v]) => v.value > 0)
    .map(([label, v]) => ({ label, value: v.value }));

  // --- Publicações no mês (Calendário) ---
  const postsThisMonth = posts.filter((p) => p.date >= period.start && p.date <= period.end).length;
  const postsTrend = months.map((mk) => ({
    label: periodKeyLabel(mk).slice(0, 3),
    value: posts.filter((p) => monthKey(p.date) === mk).length,
  }));

  // --- Engajamento médio (Dashboard Reportei) ---
  const engajamentoByProfile = profiles.map((p) => {
    const history = p.reporteiMetrics
      .filter((m) => /engaj/i.test(m.title))
      .map((m) => ({ ...m, num: parseMetricNumber(m.value) }))
      .filter((m) => m.num !== null);
    const latest = history[0] ?? null;
    return { name: p.name, latest: latest?.num ?? null, historyCount: history.length };
  });
  const withEngagement = engajamentoByProfile.filter((p) => p.latest !== null);
  const engajamentoGeral =
    withEngagement.length > 0
      ? withEngagement.reduce((s, p) => s + (p.latest ?? 0), 0) / withEngagement.length
      : null;

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Marca forte não acontece por acaso — se constrói todo dia."
        subtitle="Consistência, autenticidade e presença — cada post é um tijolo na autoridade da marca."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Social
          </h1>
          <p className="max-w-[62ch] text-[13px] text-ink-soft">
            Indicadores ao vivo — cada número vem direto do CRM Social
            Selling, do Calendário e do Dashboard Reportei, sem lançamento
            manual.
          </p>
        </div>
        <FilterBar
          areaOptions={[]}
          responsibleOptions={area.memberships.map((m) => ({
            value: m.user.id,
            label: m.user.name,
          }))}
        />
      </div>

      <SocialTabs />

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Indicadores gerais · {period.label.toLowerCase()}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Leads gerados via Social (mês)" value={String(leadsThisMonth)} />
          <StatTile label="Receita gerada por Social (mês)" value={formatCompactCurrency(revenueThisMonth)} />
          <StatTile label="Publicações no mês" value={String(postsThisMonth)} />
          <StatTile label="Engajamento médio geral" value={engajamentoGeral !== null ? `${engajamentoGeral.toFixed(1)}%` : "—"} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h3 className="text-[12.5px] font-medium text-ink-soft">Leads — histórico (6 meses)</h3>
            <TrendChart points={leadsTrend} formatValue={(v) => String(Math.round(v))} />
          </section>
          <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h3 className="text-[12.5px] font-medium text-ink-soft">Receita — histórico (6 meses)</h3>
            <TrendChart points={revenueTrend} formatValue={formatCompactCurrency} />
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
            <h3 className="text-[12.5px] font-medium text-ink-soft">Receita por semana ({period.label.toLowerCase()})</h3>
            {revenueByWeek.length > 0 ? (
              revenueByWeek.map(([week, value]) => (
                <div key={week} className="flex items-center justify-between text-[12.5px]">
                  <span className="text-ink">Semana {week}</span>
                  <span className="tnum text-ink-soft">{formatCompactCurrency(value)}</span>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-ink-faint">Nenhuma venda fechada esse mês ainda.</p>
            )}
          </section>
          <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h3 className="text-[12.5px] font-medium text-ink-soft">Publicações — histórico (6 meses)</h3>
            <TrendChart points={postsTrend} formatValue={(v) => String(Math.round(v))} />
          </section>
        </div>

        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h3 className="text-[12.5px] font-medium text-ink-soft">Engajamento por perfil</h3>
          <div className="flex flex-col">
            {engajamentoByProfile.map((p) => (
              <div key={p.name} className="flex items-center justify-between border-t border-border py-2 first:border-t-0">
                <span className="text-[12.5px] text-ink">{p.name}</span>
                <span className="tnum text-[12.5px] text-ink-soft">
                  {p.latest !== null ? `${p.latest.toFixed(1)}%` : "sem dado"}
                </span>
              </div>
            ))}
            {engajamentoByProfile.length === 0 && (
              <p className="py-2 text-[12.5px] text-ink-faint">
                Nenhum perfil com dashboard Reportei vinculado ainda.
              </p>
            )}
          </div>
          <p className="text-[11px] text-ink-faint">
            Histórico mês a mês / semana a semana vai se acumulando a cada
            vez que alguém clica em "Atualizar" no Dashboard Reportei — antes
            desta mudança, cada atualização substituía a leitura anterior, então
            o histórico começa a contar a partir de agora.
          </p>
        </section>

        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h3 className="text-[12.5px] font-medium text-ink-soft">Produtos vendidos (CRM Social Selling)</h3>
          {productDonutData.length > 1 && (
            <DonutChart
              data={productDonutData}
              formatValue={formatCompactCurrency}
              centerLabel="vendido"
              centerAsCurrency
              ariaLabel="Vendas por produto"
            />
          )}
          <div className="flex flex-col">
            {[...byProduct.entries()].map(([product, { count, value }]) => (
              <div key={product} className="flex items-center justify-between border-t border-border py-2 first:border-t-0">
                <span className="text-[12.5px] text-ink">
                  {product} <span className="text-ink-faint">· {count} venda{count === 1 ? "" : "s"}</span>
                </span>
                <span className="tnum text-[12.5px] text-ink-soft">{formatCompactCurrency(value)}</span>
              </div>
            ))}
            {byProduct.size === 0 && (
              <p className="py-2 text-[12.5px] text-ink-faint">Nenhuma venda registrada ainda.</p>
            )}
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-[12px] text-ink-soft">Ticket médio</span>
            <span className="tnum text-[13px] font-medium text-ink">{formatCompactCurrency(ticketMedio)}</span>
          </div>
        </section>
      </section>
    </>
  );
}
