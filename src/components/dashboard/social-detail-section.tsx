import { formatCompactCurrency } from "@/lib/format";
import type { loadEngagementByMonth, loadFollowerProgression } from "@/lib/social";

export function SocialDetailSection({
  engagement,
  followers,
  organicRevenueByMonth,
}: {
  engagement: Awaited<ReturnType<typeof loadEngagementByMonth>>;
  followers: Awaited<ReturnType<typeof loadFollowerProgression>>;
  organicRevenueByMonth: { label: string; revenue: number }[];
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[13px] font-medium text-ink-soft">Social</h2>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Taxa de engajamento por perfil (mês a mês)</h3>
        {engagement.map((p) => (
          <div key={p.profile} className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
            <table className="w-full min-w-[700px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border text-left text-ink-faint">
                  <th className="py-2 pl-3 pr-3 font-medium">{p.profile}</th>
                  {p.months.map((m, i) => (
                    <th key={i} className="px-2 py-2 text-right font-medium">
                      {m.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 pl-3 pr-3 text-ink-soft">Engajamento</td>
                  {p.months.map((m, i) => (
                    <td key={i} className="tnum px-2 py-2 text-right text-ink-soft">
                      {m.engagementPct !== null ? `${m.engagementPct.toFixed(1)}%` : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ))}
        {engagement.length === 0 && <p className="text-[12.5px] text-ink-faint">Nenhum perfil cadastrado.</p>}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Progressão de seguidores (mês a mês)</h3>
        {followers.map((p) => (
          <div key={p.profile} className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
            <table className="w-full min-w-[700px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border text-left text-ink-faint">
                  <th className="py-2 pl-3 pr-3 font-medium">{p.profile}</th>
                  {p.snapshots.map((s) => (
                    <th key={s.monthKey} className="px-2 py-2 text-right font-medium">
                      {s.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-2 pl-3 pr-3 text-ink-soft">Seguidores</td>
                  {p.snapshots.map((s) => (
                    <td key={s.monthKey} className="tnum px-2 py-2 text-right text-ink-soft">
                      {s.count.toLocaleString("pt-BR")}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            {p.snapshots.length === 0 && (
              <p className="px-3 py-3 text-[12px] text-ink-faint">Nenhum registro de seguidores ainda.</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-[12px] font-medium text-ink-soft">Faturamento de social orgânico (mês a mês)</h3>
        <p className="text-[11.5px] text-ink-faint">
          Mesmo número do faturamento de Social Selling (GoHighLevel), por definição — social orgânico é o
          canal de origem.
        </p>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[700px] border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-border text-left text-ink-faint">
                <th className="py-2 pl-3 pr-3 font-medium">Faturamento</th>
                {organicRevenueByMonth.map((m, i) => (
                  <th key={i} className="px-2 py-2 text-right font-medium">
                    {m.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 pl-3 pr-3 text-ink-soft">Social orgânico</td>
                {organicRevenueByMonth.map((m, i) => (
                  <td key={i} className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.revenue > 0 ? formatCompactCurrency(m.revenue) : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
