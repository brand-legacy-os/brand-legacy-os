import { formatCompactCurrency } from "@/lib/format";
import { LEAD_CHANNEL_META } from "@/lib/comercial";
import type { loadTrafficChannelRates } from "@/lib/traffic";
import { StatTile } from "@/components/dashboard/stat-tile";

type ChannelRates = Awaited<ReturnType<typeof loadTrafficChannelRates>>;

export function TrafegoDetailSection({
  periodLabel,
  leadsTotais,
  investidoGeral,
  investidoPorFunil,
  channelRates,
}: {
  periodLabel: string;
  leadsTotais: number;
  investidoGeral: number;
  investidoPorFunil: { category: string; label: string; spend: number }[];
  channelRates: ChannelRates;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[13px] font-medium text-ink-soft">Tráfego · {periodLabel.toLowerCase()}</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Leads totais (Facebook Ads)" value={leadsTotais.toLocaleString("pt-BR")} />
        <StatTile label="Total investido (geral)" value={formatCompactCurrency(investidoGeral)} />
        <StatTile
          label="ROI de tráfego"
          value={
            channelRates.find((c) => c.channel === "trafego")?.roi !== null &&
            channelRates.find((c) => c.channel === "trafego")?.roi !== undefined
              ? `${channelRates.find((c) => c.channel === "trafego")!.roi!.toFixed(0)}%`
              : "—"
          }
        />
      </div>

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[600px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-3 py-2.5 font-medium">Investido por funil</th>
              <th className="px-3 py-2.5 text-right font-medium">Verba investida</th>
            </tr>
          </thead>
          <tbody>
            {investidoPorFunil.map((f) => (
              <tr key={f.category} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2.5 text-ink">{f.label}</td>
                <td className="tnum px-3 py-2.5 text-right font-medium text-ink">{formatCompactCurrency(f.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-[12px] font-medium text-ink-soft">Leads, SQL, custo e faturamento por canal</h3>
        <p className="text-[11.5px] text-ink-faint">
          Custo por SQL e ROI só existem para Tráfego pago — os demais canais não têm verba de mídia
          atribuível (esforço orgânico/manual).
        </p>
      </div>
      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[880px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-3 py-2.5 font-medium">Canal</th>
              <th className="px-3 py-2.5 text-right font-medium">Leads</th>
              <th className="px-3 py-2.5 text-right font-medium">SQL</th>
              <th className="px-3 py-2.5 text-right font-medium">Taxa de SQL</th>
              <th className="px-3 py-2.5 text-right font-medium">Custo por SQL</th>
              <th className="px-3 py-2.5 text-right font-medium">Faturamento gerado</th>
              <th className="px-3 py-2.5 text-right font-medium">ROI</th>
            </tr>
          </thead>
          <tbody>
            {channelRates.map((c) => (
              <tr key={c.channel} className="border-b border-border last:border-b-0">
                <td className="px-3 py-2.5 text-ink">{LEAD_CHANNEL_META[c.channel].label}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink">{c.leadCount.toLocaleString("pt-BR")}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink">{c.sqlCount.toLocaleString("pt-BR")}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink">
                  {c.sqlRate !== null ? `${c.sqlRate.toFixed(1)}%` : "—"}
                </td>
                <td className="tnum px-3 py-2.5 text-right text-ink">
                  {c.costPerSql !== null ? formatCompactCurrency(c.costPerSql) : "—"}
                </td>
                <td className="tnum px-3 py-2.5 text-right font-medium text-ink">{formatCompactCurrency(c.revenue)}</td>
                <td className="tnum px-3 py-2.5 text-right text-ink">
                  {c.roi !== null ? `${c.roi.toFixed(0)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-ink-faint">
        &quot;Recuperação&quot; já está incluída em SDR (pipeline &quot;Recuperação - SDR&quot;) — não é um canal
        separado no CRM hoje. &quot;Indicação&quot; ainda não tem sinal próprio no GoHighLevel (nenhum pipeline
        real mapeia pra esse canal); quando existir, entra aqui automaticamente.
      </p>
    </section>
  );
}
