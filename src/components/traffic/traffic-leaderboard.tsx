import { formatCompactCurrency } from "@/lib/format";

type Row = { id: string; name: string; spend: number; leads: number };

export function TrafficLeaderboard({
  title,
  emptyLabel,
  rows,
}: {
  title: string;
  emptyLabel: string;
  rows: Row[];
}) {
  return (
    <div className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
      <h4 className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">{title}</h4>
      {rows.length === 0 ? (
        <p className="py-2 text-[12.5px] text-ink-faint">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col">
          {rows.map((r, i) => {
            const cpl = r.leads > 0 ? r.spend / r.leads : null;
            return (
              <div
                key={r.id}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 border-t border-border py-2 text-[12.5px] first:border-t-0"
              >
                <span className="tnum flex h-5 w-5 items-center justify-center rounded-full bg-gold-tint text-[10.5px] font-medium text-gold-ink">
                  {i + 1}
                </span>
                <span className="truncate text-ink" title={r.name}>
                  {r.name}
                </span>
                <span className="tnum text-ink-soft">{r.leads.toLocaleString("pt-BR")} leads</span>
                <span className="tnum text-ink-faint">{cpl !== null ? formatCompactCurrency(cpl) : "—"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
