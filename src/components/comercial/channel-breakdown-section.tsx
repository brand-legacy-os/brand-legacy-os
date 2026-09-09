import { StatTile } from "@/components/dashboard/stat-tile";
import { formatCompactCurrency } from "@/lib/format";
import type { loadChannelBreakdown } from "@/lib/comercial";

type Breakdown = Awaited<ReturnType<typeof loadChannelBreakdown>>;

export function ChannelBreakdownSection({
  title,
  periodLabel,
  breakdown,
  unavailableMetrics,
}: {
  title: string;
  periodLabel: string;
  breakdown: Breakdown;
  unavailableMetrics: string[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-[12.5px] font-medium text-ink-soft">
          {title} · {periodLabel.toLowerCase()}
        </h3>
        <p className="text-[11.5px] text-ink-faint">
          Direto do GoHighLevel (via Windsor.ai) — pipeline classificado por canal.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatTile label="Leads gerados" value={breakdown.leadCount.toLocaleString("pt-BR")} />
        <StatTile label="Vendas fechadas" value={breakdown.wonCount.toLocaleString("pt-BR")} />
        <StatTile label="Faturamento" value={formatCompactCurrency(breakdown.revenue)} />
        <StatTile
          label="Taxa de conversão"
          value={breakdown.conversionRate !== null ? `${breakdown.conversionRate.toFixed(1)}%` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
          <h4 className="text-[12px] font-medium text-ink-soft">Leads por produto</h4>
          {breakdown.byProduct.map((p) => (
            <div key={p.product} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink">{p.product}</span>
              <span className="tnum text-ink-soft">
                {p.leads} lead{p.leads === 1 ? "" : "s"} · {formatCompactCurrency(p.revenue)}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
          <h4 className="text-[12px] font-medium text-ink-soft">Por vendedor</h4>
          {breakdown.byVendor.map((v) => (
            <div key={v.email} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink">{v.name}</span>
              <span className="tnum text-ink-soft">
                {v.leads} lead{v.leads === 1 ? "" : "s"} · {v.won} venda{v.won === 1 ? "" : "s"} ·{" "}
                {formatCompactCurrency(v.revenue)}
              </span>
            </div>
          ))}
          {breakdown.byVendor.length === 0 && (
            <p className="text-[12px] text-ink-faint">Nenhum lead atribuído a um vendedor nesse período.</p>
          )}
        </div>
      </div>

      {unavailableMetrics.length > 0 && (
        <div className="rounded-(--radius-l) border border-dashed border-border bg-surface-muted p-4">
          <p className="text-[11.5px] text-ink-faint">
            <span className="font-medium text-ink-soft">Ainda não disponível a partir dos dados reais:</span>{" "}
            {unavailableMetrics.join(", ")}. O GoHighLevel/Calendly não tem um campo de canal em reuniões
            nem histórico de mensagens — só é possível saber o canal de uma oportunidade pelo pipeline em
            que ela entra, não de uma reunião ou de um contato isolado.
          </p>
        </div>
      )}
    </section>
  );
}
