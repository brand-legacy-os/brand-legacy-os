import { formatCompactCurrency } from "@/lib/format";
import { LEAD_CHANNEL_META, leadsByProduct, channelBreakdown, sumWonRevenue, type OpportunityRow, type MeetingRow } from "@/lib/comercial";
import { countScheduled, countRealized, showRate } from "@/lib/comercial";

export function CloserBreakdown({
  closers,
}: {
  closers: { name: string; email: string; opportunities: OpportunityRow[]; meetings: MeetingRow[] }[];
}) {
  if (closers.length === 0) {
    return <p className="text-[13px] text-ink-faint">Nenhuma oportunidade/reunião atribuída a um closer no período.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {closers.map((c) => {
        const { total, byChannel } = channelBreakdown(c.opportunities);
        const products = leadsByProduct(c.opportunities);
        const scheduled = countScheduled(c.meetings);
        const realized = countRealized(c.meetings);
        const rate = showRate(c.meetings);
        const won = c.opportunities.filter((o) => o.status === "won");
        const open = c.opportunities.filter((o) => o.status === "open");
        const pipelineTotal = c.opportunities.reduce((s, o) => s + o.monetaryValue, 0);
        const pipelineAberto = open.reduce((s, o) => s + o.monetaryValue, 0);
        const pipelineFechado = sumWonRevenue(c.opportunities);
        const pipelineRate = pipelineTotal > 0 ? (pipelineFechado / pipelineTotal) * 100 : null;

        return (
          <div key={c.email} className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h3 className="text-[13.5px] font-medium text-ink">{c.name}</h3>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">
                Origem dos leads ({total})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {byChannel.filter((b) => b.count > 0).map((b) => (
                  <span key={b.channel} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-soft">
                    {LEAD_CHANNEL_META[b.channel].label}: {b.count}
                  </span>
                ))}
                {byChannel.every((b) => b.count === 0) && <span className="text-[11.5px] text-ink-faint">—</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-medium uppercase tracking-[0.03em] text-ink-faint">Leads por produto</span>
              <div className="flex flex-wrap gap-1.5">
                {products.filter((p) => p.count > 0).map((p) => (
                  <span key={p.product} className="rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-soft">
                    {p.product}: {p.count}
                  </span>
                ))}
                {products.every((p) => p.count === 0) && <span className="text-[11.5px] text-ink-faint">—</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12.5px]">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Reuniões agendadas</span>
                <span className="tnum font-medium text-ink">{scheduled}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Reuniões realizadas</span>
                <span className="tnum font-medium text-ink">{realized}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Show Rate</span>
                <span className="tnum font-medium text-ink">{rate !== null ? `${rate.toFixed(0)}%` : "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Vendas fechadas</span>
                <span className="tnum font-medium text-ink">{won.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Faturamento total</span>
                <span className="tnum font-medium text-ink">{formatCompactCurrency(pipelineFechado)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Pipeline do mês</span>
                <span className="tnum font-medium text-ink">{formatCompactCurrency(pipelineTotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Pipeline aberto</span>
                <span className="tnum font-medium text-ink">{formatCompactCurrency(pipelineAberto)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Taxa % do pipeline</span>
                <span className="tnum font-medium text-ink">{pipelineRate !== null ? `${pipelineRate.toFixed(0)}%` : "—"}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
