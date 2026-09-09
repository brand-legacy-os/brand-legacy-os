import { StatTile } from "@/components/dashboard/stat-tile";
import { formatCompactCurrency } from "@/lib/format";
import type { TrafficSummary } from "@/lib/traffic";

export function TrafficStatGroup({
  title,
  description,
  summary,
  mqlIsEstimate,
}: {
  title?: string;
  description?: string;
  summary: TrafficSummary;
  mqlIsEstimate?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3">
      {title && (
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[12.5px] font-medium text-ink-soft">{title}</h3>
          {description && <p className="text-[11.5px] text-ink-faint">{description}</p>}
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Leads gerados (Facebook Ads)" value={summary.leads.toLocaleString("pt-BR")} />
        <StatTile label="CPL (custo por lead)" value={summary.cpl !== null ? formatCompactCurrency(summary.cpl) : "—"} />
        <StatTile
          label={`Contatos no CRM (MQL)${mqlIsEstimate ? " (estimado)" : ""}`}
          value={summary.mqlCount.toLocaleString("pt-BR")}
        />
        <StatTile
          label={`Custo por MQL${mqlIsEstimate ? " (estimado)" : ""}`}
          value={summary.costPerMql !== null ? formatCompactCurrency(summary.costPerMql) : "—"}
        />
      </div>
      <p className="text-[11px] text-ink-faint">
        &quot;Leads gerados&quot; é só o que o Facebook Ads reporta (pixel de conversão da própria campanha).
        &quot;Contatos no CRM (MQL)&quot; conta todo mundo que chega no GoHighLevel, de qualquer origem — por
        isso pode ser maior que os leads gerados, não são a mesma população nem um funil direto entre si.
      </p>
    </section>
  );
}
