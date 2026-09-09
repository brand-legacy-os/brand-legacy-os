import { formatCompactCurrency } from "@/lib/format";
import { StatTile } from "@/components/dashboard/stat-tile";

export function CsDetailSection({
  ltv,
  churnMonthly,
  churnAnnualPct,
  renewalRatePct,
  renewalMonthly,
  activeTotal,
  activeByCarteira,
  mentoriaDelivery,
}: {
  ltv: number | null;
  churnMonthly: { label: string; pct: number | null; churned: number; eligible: number }[];
  churnAnnualPct: number | null;
  renewalRatePct: number | null;
  renewalMonthly: { label: string; monthKey: string; plannedCount: number; plannedValue: number; realizedCount: number; realizedValue: number }[];
  activeTotal: number;
  activeByCarteira: { name: string; count: number }[];
  mentoriaDelivery: { delivered: number; target: number; pct: number | null };
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[13px] font-medium text-ink-soft">Customer Success</h2>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="LTV (geral)" value={ltv !== null ? formatCompactCurrency(ltv) : "—"} />
        <StatTile label="Churn anual" value={churnAnnualPct !== null ? `${churnAnnualPct.toFixed(1)}%` : "—"} />
        <StatTile label="Taxa de renovação" value={renewalRatePct !== null ? `${renewalRatePct.toFixed(0)}%` : "—"} />
        <StatTile
          label="Taxa de entrega da mentoria"
          value={mentoriaDelivery.pct !== null ? `${mentoriaDelivery.pct.toFixed(0)}%` : "—"}
          targetLabel={`${mentoriaDelivery.delivered} de ${mentoriaDelivery.target} encontros`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Churn mês a mês</h3>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[700px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="py-2 pl-3 pr-3 font-medium">Métrica</th>
                {churnMonthly.map((m, i) => (
                  <th key={i} className="px-2 py-2 text-right font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pl-3 pr-3 text-ink">Churn %</td>
                {churnMonthly.map((m, i) => (
                  <td key={i} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.pct !== null ? `${m.pct.toFixed(1)}%` : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pl-3 pr-3 text-ink">Cancelados / base elegível</td>
                {churnMonthly.map((m, i) => (
                  <td key={i} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.churned} / {m.eligible}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-[12px] font-medium text-ink-soft">Renovação — disponível x realizado (mês a mês)</h3>
          <p className="text-[11.5px] text-ink-faint">
            Renovação = 50% do valor do contrato; eventos/imersões não são renováveis e não entram aqui.
          </p>
        </div>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[900px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="py-2 pl-3 pr-3 font-medium">Métrica</th>
                {renewalMonthly.map((m) => (
                  <th key={m.monthKey} className="px-2 py-2 text-right font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-2 pl-3 pr-3 text-ink">Disponível (qtd.)</td>
                {renewalMonthly.map((m) => (
                  <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.plannedCount || "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pl-3 pr-3 text-ink">Disponível (R$)</td>
                {renewalMonthly.map((m) => (
                  <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.plannedValue > 0 ? formatCompactCurrency(m.plannedValue) : "—"}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pl-3 pr-3 text-ink">Realizado (qtd.)</td>
                {renewalMonthly.map((m) => (
                  <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.realizedCount || "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 pl-3 pr-3 text-ink">Realizado (R$)</td>
                {renewalMonthly.map((m) => (
                  <td key={m.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.realizedValue > 0 ? formatCompactCurrency(m.realizedValue) : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        {renewalMonthly.every((m) => m.plannedCount === 0) && (
          <p className="text-[11.5px] text-ink-faint">
            Nenhum ciclo de renovação registrado ainda — cadastre pela ficha do mentorado em CS.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Clientes ativos — geral e por carteira</h3>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[400px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
                <th className="px-3 py-2.5 font-medium">CS</th>
                <th className="px-3 py-2.5 text-right font-medium">Clientes ativos</th>
              </tr>
            </thead>
            <tbody>
              {activeByCarteira.map((c) => (
                <tr key={c.name} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2.5 text-ink">{c.name}</td>
                  <td className="tnum px-3 py-2.5 text-right text-ink">{c.count}</td>
                </tr>
              ))}
              <tr className="bg-surface-muted font-medium">
                <td className="px-3 py-2.5 text-ink">Total</td>
                <td className="tnum px-3 py-2.5 text-right text-ink">{activeTotal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
