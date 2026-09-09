import { formatCompactCurrency } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";

export function EventosDetailSection({
  rows,
  budgetPlannedTotal,
  budgetActualTotal,
}: {
  rows: {
    id: string;
    name: string;
    budgetPlanned: number | null;
    budgetActual: number;
    sponsorPlanned: number;
    sponsorRealized: number;
    npsAverage: number | null;
    registeredCount: number | null;
    presentCount: number | null;
  }[];
  budgetPlannedTotal: number;
  budgetActualTotal: number;
}) {
  const budgetCompliancePct = budgetPlannedTotal > 0 ? (budgetActualTotal / budgetPlannedTotal) * 100 : null;

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[13px] font-medium text-ink-soft">Eventos</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          label="Budget realizado (ano)"
          value={`${formatCompactCurrency(budgetActualTotal)} / ${formatCompactCurrency(budgetPlannedTotal)}`}
        />
        <StatTile
          label="Taxa de cumprimento do budget anual"
          value={budgetCompliancePct !== null ? `${budgetCompliancePct.toFixed(0)}%` : "—"}
        />
      </div>

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[980px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-3 py-2.5 font-medium">Evento</th>
              <th className="px-3 py-2.5 text-right font-medium">Budget realizado / previsto</th>
              <th className="px-3 py-2.5 text-right font-medium">Patrocínio realizado / contratado</th>
              <th className="px-3 py-2.5 text-right font-medium">Receita patroc. − gasto</th>
              <th className="px-3 py-2.5 text-right font-medium">NPS</th>
              <th className="px-3 py-2.5 text-right font-medium">Taxa de participação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const relacao = e.sponsorRealized - e.budgetActual;
              const participacao =
                e.registeredCount && e.registeredCount > 0 && e.presentCount !== null
                  ? (e.presentCount / e.registeredCount) * 100
                  : null;
              return (
                <tr key={e.id} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 text-ink">{e.name}</td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-soft">
                    {formatCompactCurrency(e.budgetActual)} / {e.budgetPlanned !== null ? formatCompactCurrency(e.budgetPlanned) : "—"}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-ink-soft">
                    {formatCompactCurrency(e.sponsorRealized)} / {formatCompactCurrency(e.sponsorPlanned)}
                  </td>
                  <td className={`tnum px-3 py-2.5 text-right font-medium ${relacao >= 0 ? "text-positive" : "text-critical"}`}>
                    {formatCompactCurrency(relacao)}
                  </td>
                  <td className="tnum px-3 py-2.5 text-right text-ink">{e.npsAverage !== null ? Math.round(e.npsAverage) : "—"}</td>
                  <td className="tnum px-3 py-2.5 text-right text-ink">
                    {participacao !== null ? `${participacao.toFixed(0)}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
