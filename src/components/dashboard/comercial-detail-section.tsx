import { formatCompactCurrency, formatDate } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";
import { ClosersTable } from "@/components/comercial/closers-table";
import { ChannelBreakdownSection } from "@/components/comercial/channel-breakdown-section";
import {
  COMERCIAL_PRODUCTS,
  type loadComercialMonthlyTrend,
  type loadSponsorshipsMonthlyTrend,
  type loadPipelineSummary,
  type loadCustomersByProduct,
  type loadChannelBreakdown,
  type OpportunityRow,
  type MeetingRow,
} from "@/lib/comercial";

const ALL_PRODUCT_ROWS = [...COMERCIAL_PRODUCTS, "Patrocínios"] as const;

export function ComercialDetailSection({
  vendasDoMes,
  faturamentoDoMes,
  monthlyTrend,
  sponsorshipsMonthly,
  pipeline,
  customersByProduct,
  closers,
  socialSelling,
  sdr,
  periodLabel,
}: {
  vendasDoMes: number;
  faturamentoDoMes: number;
  monthlyTrend: Awaited<ReturnType<typeof loadComercialMonthlyTrend>>;
  sponsorshipsMonthly: Awaited<ReturnType<typeof loadSponsorshipsMonthlyTrend>>;
  pipeline: Awaited<ReturnType<typeof loadPipelineSummary>>;
  customersByProduct: Awaited<ReturnType<typeof loadCustomersByProduct>>;
  closers: { name: string; email: string; opportunities: OpportunityRow[]; meetings: MeetingRow[] }[];
  socialSelling: Awaited<ReturnType<typeof loadChannelBreakdown>>;
  sdr: Awaited<ReturnType<typeof loadChannelBreakdown>>;
  periodLabel: string;
}) {
  const productRevenueByMonth = (product: (typeof ALL_PRODUCT_ROWS)[number], mk: string) => {
    if (product === "Patrocínios") {
      return sponsorshipsMonthly.find((s) => s.monthKey === mk)?.revenue ?? 0;
    }
    const month = monthlyTrend.find((m) => m.monthKey === mk);
    return month?.byProduct.find((p) => p.product === product)?.revenue ?? 0;
  };
  const productCountByMonth = (product: (typeof ALL_PRODUCT_ROWS)[number], mk: string) => {
    if (product === "Patrocínios") {
      return sponsorshipsMonthly.find((s) => s.monthKey === mk)?.count ?? 0;
    }
    const month = monthlyTrend.find((m) => m.monthKey === mk);
    return month?.byProduct.find((p) => p.product === product)?.count ?? 0;
  };

  return (
    <section className="flex flex-col gap-5">
      <h2 className="text-[13px] font-medium text-ink-soft">Comercial · {periodLabel.toLowerCase()}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile label="Número de vendas do mês" value={vendasDoMes.toLocaleString("pt-BR")} />
        <StatTile label="Faturamento total do mês" value={formatCompactCurrency(faturamentoDoMes)} />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Vendas mês a mês</h3>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[700px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="py-2 pl-3 pr-3 font-medium">Métrica</th>
                {monthlyTrend.map((m) => (
                  <th key={m.monthKey} className="px-2 py-2 text-right font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pl-3 pr-3 text-ink">Vendas (qtd.)</td>
                {monthlyTrend.map((m) => (
                  <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.count}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pl-3 pr-3 text-ink">Faturamento</td>
                {monthlyTrend.map((m) => (
                  <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                    {formatCompactCurrency(m.revenue)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Vendas mês a mês por produto (qtd.)</h3>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="py-2 pl-3 pr-3 font-medium">Produto</th>
                {monthlyTrend.map((m) => (
                  <th key={m.monthKey} className="px-2 py-2 text-right font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PRODUCT_ROWS.map((product) => (
                <tr key={product} className="border-b border-border last:border-b-0">
                  <td className="py-2 pl-3 pr-3 text-ink">{product}</td>
                  {monthlyTrend.map((m) => (
                    <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                      {productCountByMonth(product, m.monthKey) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Faturamento mês a mês por produto</h3>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[820px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="py-2 pl-3 pr-3 font-medium">Produto</th>
                {monthlyTrend.map((m) => (
                  <th key={m.monthKey} className="px-2 py-2 text-right font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PRODUCT_ROWS.map((product) => (
                <tr key={product} className="border-b border-border last:border-b-0">
                  <td className="py-2 pl-3 pr-3 text-ink">{product}</td>
                  {monthlyTrend.map((m) => {
                    const v = productRevenueByMonth(product, m.monthKey);
                    return (
                      <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                        {v > 0 ? formatCompactCurrency(v) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Clientes que compraram cada produto</h3>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {customersByProduct.map((p) => (
            <div key={p.product} className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-ink-soft">{p.product}</span>
                <span className="tnum text-[11.5px] text-ink-faint">{p.customers.length}</span>
              </div>
              <div className="flex max-h-[260px] flex-col gap-1 overflow-y-auto">
                {p.customers.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-[12px]">
                    <span className="text-ink">{c.name}</span>
                    <span className="tnum text-ink-faint">
                      {formatCompactCurrency(c.value)} · {formatDate(c.date)}
                    </span>
                  </div>
                ))}
                {p.customers.length === 0 && <p className="text-[12px] text-ink-faint">Nenhuma venda ainda.</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Pipeline em negociação</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <StatTile label="Pipeline total (aberto)" value={formatCompactCurrency(pipeline.total)} />
          <StatTile label="Oportunidades em aberto" value={pipeline.count.toLocaleString("pt-BR")} />
        </div>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[500px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
                <th className="px-3 py-2.5 font-medium">Closer</th>
                <th className="px-3 py-2.5 text-right font-medium">Oportunidades</th>
                <th className="px-3 py-2.5 text-right font-medium">Pipeline aberto</th>
              </tr>
            </thead>
            <tbody>
              {pipeline.byCloser.map((c) => (
                <tr key={c.email} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 text-ink">{c.name}</td>
                  <td className="tnum px-3 py-2.5 text-right text-ink">{c.count}</td>
                  <td className="tnum px-3 py-2.5 text-right font-medium text-ink">{formatCompactCurrency(c.total)}</td>
                </tr>
              ))}
              {pipeline.byCloser.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-center text-ink-faint">
                    Nenhuma oportunidade aberta atribuída a um closer.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">KPIs por closer</h3>
        <ClosersTable closers={closers} />
      </div>

      <ChannelBreakdownSection
        title="Social Selling"
        periodLabel={periodLabel}
        breakdown={socialSelling}
        unavailableMetrics={[
          "Contatos Totais",
          "Follow-ups",
          "Taxa de Resposta",
          "Agendamentos",
          "No Show",
          "quebra por perfil (Brand Legacy/Dom/Carol)",
        ]}
      />

      <ChannelBreakdownSection
        title="SDR"
        periodLabel={periodLabel}
        breakdown={sdr}
        unavailableMetrics={["Contatos Totais", "Follow-ups", "Taxa de Resposta", "Agendamentos", "No Show"]}
      />
    </section>
  );
}
