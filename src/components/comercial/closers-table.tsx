import { formatCompactCurrency } from "@/lib/format";
import {
  channelBreakdown,
  leadsByProduct,
  sumWonRevenue,
  countScheduled,
  countRealized,
  showRate,
  weeklyMeetings,
  LEAD_CHANNEL_META,
  type OpportunityRow,
  type MeetingRow,
} from "@/lib/comercial";

export function ClosersTable({
  closers,
}: {
  closers: { name: string; email: string; opportunities: OpportunityRow[]; meetings: MeetingRow[] }[];
}) {
  if (closers.length === 0) {
    return <p className="text-[13px] text-ink-faint">Nenhuma oportunidade/reunião atribuída a um closer no período.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
      <table className="w-full min-w-[1400px] border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-[0.04em] text-ink-faint">
            <th className="px-3 py-2.5 font-medium">Closer</th>
            <th className="px-3 py-2.5 font-medium">Leads (total)</th>
            <th className="px-3 py-2.5 font-medium">Leads por canal</th>
            <th className="px-3 py-2.5 font-medium">Leads por produto</th>
            <th className="px-3 py-2.5 text-right font-medium">Agendadas</th>
            <th className="px-3 py-2.5 text-right font-medium">Realizadas</th>
            <th className="px-3 py-2.5 font-medium">Por semana (ag./real.)</th>
            <th className="px-3 py-2.5 text-right font-medium">Show rate</th>
            <th className="px-3 py-2.5 text-right font-medium">Taxa conversão</th>
            <th className="px-3 py-2.5 text-right font-medium">Faturamento total</th>
            <th className="px-3 py-2.5 font-medium">Faturamento por produto</th>
          </tr>
        </thead>
        <tbody>
          {closers.map((c) => {
            const { total, byChannel } = channelBreakdown(c.opportunities);
            const products = leadsByProduct(c.opportunities);
            const scheduled = countScheduled(c.meetings);
            const realized = countRealized(c.meetings);
            const rate = showRate(c.meetings);
            const won = c.opportunities.filter((o) => o.status === "won");
            const revenue = sumWonRevenue(c.opportunities);
            const conversionRate = total > 0 ? (won.length / total) * 100 : null;
            const weeks = weeklyMeetings(c.meetings);
            const revenueByProduct = products
              .map((p) => ({
                product: p.product,
                revenue: won
                  .filter((o) => o.product === p.product)
                  .reduce((s, o) => s + o.monetaryValue, 0),
              }))
              .filter((p) => p.revenue > 0);

            return (
              <tr key={c.email} className="border-b border-border last:border-b-0 align-top">
                <td className="px-3 py-2.5 text-ink">{c.name}</td>
                <td className="tnum px-3 py-2.5 text-ink">{total}</td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {byChannel.filter((b) => b.count > 0).length === 0
                    ? "—"
                    : byChannel
                        .filter((b) => b.count > 0)
                        .map((b) => `${LEAD_CHANNEL_META[b.channel].label}: ${b.count}`)
                        .join(" · ")}
                </td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {products.filter((p) => p.count > 0).length === 0
                    ? "—"
                    : products
                        .filter((p) => p.count > 0)
                        .map((p) => `${p.product}: ${p.count}`)
                        .join(" · ")}
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink">{scheduled}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink">{realized}</td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {weeks.length === 0
                    ? "—"
                    : weeks.map(([week, w]) => `S${week}: ${w.scheduled}/${w.realized}`).join(" · ")}
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink">{rate !== null ? `${rate.toFixed(0)}%` : "—"}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink">
                  {conversionRate !== null ? `${conversionRate.toFixed(0)}%` : "—"}
                </td>
                <td className="tnum px-3 py-2.5 text-right font-medium text-ink">{formatCompactCurrency(revenue)}</td>
                <td className="px-3 py-2.5 text-ink-soft">
                  {revenueByProduct.length === 0
                    ? "—"
                    : revenueByProduct.map((p) => `${p.product}: ${formatCompactCurrency(p.revenue)}`).join(" · ")}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
