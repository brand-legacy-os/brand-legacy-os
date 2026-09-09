import Link from "next/link";
import { StatTile } from "@/components/dashboard/stat-tile";
import { DonutChart } from "@/components/charts/donut-chart";
import { MonthlyRevenueTable } from "@/components/comercial/monthly-revenue-table";
import { formatCompactCurrency } from "@/lib/format";
import {
  COMERCIAL_PRODUCTS,
  productSummary,
  weeklyMeetings,
  sumWonRevenue,
  countWon,
  countScheduled,
  countRealized,
  showRate,
  type OpportunityRow,
  type MeetingRow,
  type loadChannelBreakdown,
  type loadComercialMonthlyTrend,
  type loadSponsorshipsMonthlyTrend,
  type loadCustomersByMonth,
} from "@/lib/comercial";

export function FaturamentoDashboard({
  periodLabel,
  wonInPeriod,
  yearRevenue,
  monthlyTrend,
  sponsorshipsMonthly,
  customersByMonth,
  meetingsInPeriod,
  sponsorships,
  socialSelling,
  sdr,
}: {
  periodLabel: string;
  wonInPeriod: OpportunityRow[];
  yearRevenue: number;
  monthlyTrend: Awaited<ReturnType<typeof loadComercialMonthlyTrend>>;
  sponsorshipsMonthly: Awaited<ReturnType<typeof loadSponsorshipsMonthlyTrend>>;
  customersByMonth: Awaited<ReturnType<typeof loadCustomersByMonth>>;
  meetingsInPeriod: MeetingRow[];
  sponsorships: { count: number; revenue: number };
  socialSelling: Awaited<ReturnType<typeof loadChannelBreakdown>>;
  sdr: Awaited<ReturnType<typeof loadChannelBreakdown>>;
}) {
  const crmRevenue = sumWonRevenue(wonInPeriod);
  const revenueThisPeriod = crmRevenue + sponsorships.revenue;
  const dealsThisPeriod = countWon(wonInPeriod) + sponsorships.count;
  const avgTicketThisPeriod = dealsThisPeriod > 0 ? revenueThisPeriod / dealsThisPeriod : 0;
  const products = productSummary(wonInPeriod);

  const scheduled = countScheduled(meetingsInPeriod);
  const realizedThisPeriod = countRealized(meetingsInPeriod);
  const meetingShowRate = showRate(meetingsInPeriod);
  const weeks = weeklyMeetings(meetingsInPeriod);

  const annualSponsorshipRevenue = sponsorshipsMonthly.reduce((s, m) => s + m.revenue, 0);
  const annualProductRevenue = COMERCIAL_PRODUCTS.map((product) => ({
    product,
    revenue: monthlyTrend.reduce((s, m) => s + (m.byProduct.find((b) => b.product === product)?.revenue ?? 0), 0),
  }));

  const periodPieData = [
    ...products.filter((p) => p.revenue > 0).map((p) => ({ label: p.product, value: p.revenue })),
    ...(sponsorships.revenue > 0 ? [{ label: "Patrocínios", value: sponsorships.revenue }] : []),
  ];
  const annualPieData = [
    ...annualProductRevenue.filter((p) => p.revenue > 0).map((p) => ({ label: p.product, value: p.revenue })),
    ...(annualSponsorshipRevenue > 0 ? [{ label: "Patrocínios", value: annualSponsorshipRevenue }] : []),
  ];

  // Ticket médio por produto no período (pra flagrar desconto exagerado de vendedor).
  const avgTicketByProduct = products.map((p) => ({
    product: p.product,
    avgTicket: p.count > 0 ? p.revenue / p.count : 0,
  }));

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-[13px] font-medium text-ink-soft">Faturamento · {periodLabel.toLowerCase()}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Faturamento anual (ano corrente)" value={formatCompactCurrency(yearRevenue + annualSponsorshipRevenue)} />
        <StatTile label="Faturamento no período" value={formatCompactCurrency(revenueThisPeriod)} />
        <StatTile label="Ticket médio no período" value={formatCompactCurrency(avgTicketThisPeriod)} />
        <StatTile
          label="Reuniões agendadas / realizadas"
          value={`${scheduled} / ${realizedThisPeriod}`}
          targetLabel={meetingShowRate !== null ? `Show rate: ${meetingShowRate.toFixed(0)}%` : null}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Ticket médio por produto · {periodLabel.toLowerCase()}</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {avgTicketByProduct.map((p) => (
            <div key={p.product} className="flex flex-col gap-1 rounded-(--radius-s) bg-surface-muted p-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">{p.product}</span>
              <span className="tnum text-[13px] font-medium text-ink">
                {p.avgTicket > 0 ? formatCompactCurrency(p.avgTicket) : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[12px] font-medium text-ink-soft">Faturamento mês a mês (ano corrente completo)</h3>
          <p className="text-[11.5px] text-ink-faint">
            Clique num mês pra ver quais clientes/patrocinadores compraram, valor e ticket médio.
          </p>
        </div>
        <MonthlyRevenueTable months={customersByMonth} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h3 className="text-[12px] font-medium text-ink-soft">Composição do faturamento anual</h3>
          <DonutChart
            data={annualPieData}
            formatValue={formatCompactCurrency}
            centerLabel="faturado (ano)"
            centerAsCurrency
            emptyMessage="Nenhuma venda com produto identificado ainda este ano."
            ariaLabel="Composição do faturamento anual por produto"
          />
        </div>
        <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h3 className="text-[12px] font-medium text-ink-soft">Composição do faturamento — {periodLabel.toLowerCase()}</h3>
          <DonutChart
            data={periodPieData}
            formatValue={formatCompactCurrency}
            centerLabel="faturado"
            centerAsCurrency
            emptyMessage="Nenhuma venda com produto identificado no período."
            ariaLabel="Composição do faturamento do período por produto"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h3 className="text-[12px] font-medium text-ink-soft">Reuniões por semana · {periodLabel.toLowerCase()}</h3>
        {weeks.length === 0 ? (
          <p className="py-4 text-[12.5px] text-ink-faint">Nenhuma reunião no período.</p>
        ) : (
          <div className="flex flex-col">
            {weeks.map(([week, w]) => (
              <div key={week} className="flex items-center justify-between border-t border-border py-2 text-[12.5px] first:border-t-0">
                <span className="text-ink">Semana {week}</span>
                <span className="tnum text-ink-soft">
                  {w.realized} realizadas / {w.scheduled} agendadas
                  {w.scheduled > 0 ? ` · ${((w.realized / w.scheduled) * 100).toFixed(0)}%` : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h3 className="text-[12px] font-medium text-ink-soft">Faturamento por produto — mês a mês (ano corrente completo)</h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="py-2 pr-3 font-medium">Produto</th>
                {monthlyTrend.map((m, i) => (
                  <th key={i} className="px-2 py-2 text-right font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMERCIAL_PRODUCTS.map((product) => (
                <tr key={product} className="border-b border-border last:border-b-0">
                  <td className="py-2 pr-3 text-ink">{product}</td>
                  {monthlyTrend.map((m, i) => {
                    const v = m.byProduct.find((b) => b.product === product)?.revenue ?? 0;
                    return (
                      <td key={i} className="tnum px-2 py-2 text-right text-ink-soft">
                        {v > 0 ? formatCompactCurrency(v) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <td className="py-2 pr-3 text-ink">Patrocínios</td>
                {sponsorshipsMonthly.map((m, i) => (
                  <td key={i} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.revenue > 0 ? formatCompactCurrency(m.revenue) : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[12px] font-medium text-ink-soft">Quadro resumo · {periodLabel.toLowerCase()}</h3>
          <Link href="/patrocinios" className="text-[11.5px] font-medium text-brand hover:underline">
            Ver detalhado em Patrocínios →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {products.map((p) => (
            <div key={p.product} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">{p.product}</span>
              <span className="tnum text-[13px] text-ink">{p.count} venda{p.count === 1 ? "" : "s"}</span>
              <span className="tnum text-[13px] font-medium text-ink">{formatCompactCurrency(p.revenue)}</span>
            </div>
          ))}
          <div className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">Patrocínios</span>
            <span className="tnum text-[13px] text-ink">
              {sponsorships.count} fechado{sponsorships.count === 1 ? "" : "s"}
            </span>
            <span className="tnum text-[13px] font-medium text-ink">{formatCompactCurrency(sponsorships.revenue)}</span>
          </div>
          <div className="flex flex-col gap-2 rounded-(--radius-s) bg-gold-tint p-3">
            <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-gold-ink">Total do período</span>
            <span className="tnum text-[13px] text-gold-ink">{dealsThisPeriod} fechamentos</span>
            <span className="tnum text-[13px] font-medium text-gold-ink">
              {formatCompactCurrency(revenueThisPeriod)} · tíquete {formatCompactCurrency(avgTicketThisPeriod)}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-border pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">
              Por canal (Social Selling / SDR)
            </h4>
            <span className="text-[11px] text-ink-faint">já incluso no total acima, por produto</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">Social Selling</span>
                <Link href="/social/crm" className="text-[11px] font-medium text-brand hover:underline">
                  Ver em Social →
                </Link>
              </div>
              <span className="tnum text-[13px] text-ink">
                {socialSelling.leadCount} lead{socialSelling.leadCount === 1 ? "" : "s"} · {socialSelling.wonCount} venda
                {socialSelling.wonCount === 1 ? "" : "s"}
              </span>
              <span className="tnum text-[13px] font-medium text-ink">{formatCompactCurrency(socialSelling.revenue)}</span>
            </div>
            <div className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">SDR</span>
                <Link href="/sdr" className="text-[11px] font-medium text-brand hover:underline">
                  Ver em SDR →
                </Link>
              </div>
              <span className="tnum text-[13px] text-ink">
                {sdr.leadCount} lead{sdr.leadCount === 1 ? "" : "s"} · {sdr.wonCount} venda{sdr.wonCount === 1 ? "" : "s"}
              </span>
              <span className="tnum text-[13px] font-medium text-ink">{formatCompactCurrency(sdr.revenue)}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
