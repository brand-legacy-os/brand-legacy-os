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
import { computeReachEngagement } from "@/lib/social";
import { FollowerSnapshotForm } from "@/components/social/follower-snapshot-form";
import { notFound } from "next/navigation";

function lastNMonthKeys(n: number, endKey: string) {
  const [y, m] = endKey.split("-").map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(monthKey(new Date(y, m - 1 - i, 1)));
  return keys;
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

  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [leads, posts, profiles] = await Promise.all([
    prisma.socialSellingLead.findMany(),
    prisma.contentCalendarPost.findMany({ where: { date: { gte: sixMonthsAgo } } }),
    prisma.socialProfile.findMany({
      where: { reporteiUrl: { not: null } },
      include: {
        reporteiPosts: true,
        followerSnapshots: { where: { monthKey: { in: months } } },
      },
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

  // --- Engajamento (Dashboard Reportei) — duas visões, por perfil ---
  // Por alcance: ((curtidas+comentários+salvamentos+compartilhamentos) / alcance) x 100,
  // somado sobre os posts de cada mês (postedAt real do post, não da data do fetch).
  // Por seguidores: mesma soma de interações / total de seguidores do mês (preenchido
  // manualmente — o Reportei não expõe esse total como card único).
  // Quando o mês corrente ainda não tem posts (ele acabou de começar), o
  // "atual" cai pra média dos meses anteriores que tiveram post — em vez de
  // mostrar 0%, que parece um erro de leitura em vez de "ainda sem dado".
  function averageOfNonEmpty(monthPoints: { value: number; hasData: boolean }[]) {
    const withData = monthPoints.filter((m) => m.hasData);
    if (withData.length === 0) return null;
    return withData.reduce((s, m) => s + m.value, 0) / withData.length;
  }

  const profileEngagement = profiles.map((p) => {
    const reachPoints = months.map((mk) => {
      const postsInMonth = p.reporteiPosts.filter((post) => post.postedAt && monthKey(post.postedAt) === mk);
      const { engagementPct } = computeReachEngagement(postsInMonth);
      return {
        label: periodKeyLabel(mk).slice(0, 3),
        value: engagementPct ?? 0,
        hasData: postsInMonth.length > 0,
      };
    });
    const followerPoints = months.map((mk) => {
      const postsInMonth = p.reporteiPosts.filter((post) => post.postedAt && monthKey(post.postedAt) === mk);
      const { interactions } = computeReachEngagement(postsInMonth);
      const snapshot = p.followerSnapshots.find((f) => f.monthKey === mk);
      const pct = snapshot && snapshot.count > 0 ? (interactions / snapshot.count) * 100 : null;
      return {
        label: periodKeyLabel(mk).slice(0, 3),
        value: pct ?? 0,
        hasData: pct !== null,
      };
    });

    const byMonthReach = reachPoints.map(({ label, value }) => ({ label, value }));
    const byMonthFollowers = followerPoints.map(({ label, value }) => ({ label, value }));

    const currentMonthReach = reachPoints[reachPoints.length - 1];
    const currentReach = currentMonthReach?.hasData
      ? currentMonthReach.value
      : averageOfNonEmpty(reachPoints.slice(0, -1));

    const currentMonthFollowers = followerPoints[followerPoints.length - 1];
    const currentFollowers = currentMonthFollowers?.hasData
      ? currentMonthFollowers.value
      : averageOfNonEmpty(followerPoints.slice(0, -1));

    const currentFollowerSnapshot = p.followerSnapshots.find((f) => f.monthKey === currentMonthKey);
    return {
      id: p.id,
      name: p.name,
      byMonthReach,
      byMonthFollowers,
      currentReach,
      currentFollowers,
      currentIsAverage: !currentMonthReach?.hasData,
      currentFollowerCount: currentFollowerSnapshot?.count ?? null,
    };
  });

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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatTile label="Leads gerados via Social (mês)" value={String(leadsThisMonth)} />
          <StatTile label="Receita gerada por Social (mês)" value={formatCompactCurrency(revenueThisMonth)} />
          <StatTile label="Publicações no mês" value={String(postsThisMonth)} />
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

        <section className="flex flex-col gap-4 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex flex-col gap-1">
            <h3 className="text-[12.5px] font-medium text-ink-soft">Engajamento por perfil</h3>
            <p className="text-[11px] text-ink-faint">
              Por alcance = (curtidas + comentários + salvamentos + compartilhamentos) / alcance ×
              100, somado sobre os posts de cada mês (data real do post). Por seguidores = mesma
              soma de interações / total de seguidores do mês — o Reportei não expõe um total de
              seguidores como card único, então esse número é preenchido manualmente abaixo.
            </p>
          </div>
          {profileEngagement.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-medium text-ink">{p.name}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[12px] text-ink-soft">
                    Por alcance: <span className="tnum font-medium text-ink">{p.currentReach !== null ? `${p.currentReach.toFixed(1)}%` : "—"}</span>
                    {p.currentIsAverage && p.currentReach !== null && (
                      <span className="ml-1 text-[10.5px] text-ink-faint">(média)</span>
                    )}
                  </span>
                  <span className="text-[12px] text-ink-soft">
                    Por seguidores: <span className="tnum font-medium text-ink">{p.currentFollowers !== null ? `${p.currentFollowers.toFixed(1)}%` : "—"}</span>
                    {p.currentIsAverage && p.currentFollowers !== null && (
                      <span className="ml-1 text-[10.5px] text-ink-faint">(média)</span>
                    )}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-ink-faint">Por alcance — 6 meses</span>
                  <TrendChart points={p.byMonthReach} formatValue={(v) => `${v.toFixed(1)}%`} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-ink-faint">Por seguidores — 6 meses</span>
                  <TrendChart points={p.byMonthFollowers} formatValue={(v) => `${v.toFixed(1)}%`} />
                </div>
              </div>
              <FollowerSnapshotForm profileId={p.id} monthKey={currentMonthKey} currentCount={p.currentFollowerCount} />
            </div>
          ))}
          {profileEngagement.length === 0 && (
            <p className="py-2 text-[12.5px] text-ink-faint">
              Nenhum perfil com dashboard Reportei vinculado ainda.
            </p>
          )}
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
