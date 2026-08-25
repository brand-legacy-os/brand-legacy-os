import { StatusPill, kpiStatusTone } from "@/components/ui/status-pill";
import { KPI_STATUS_LABEL, type KpiStatusKey } from "@/lib/format";

export function StatTile({
  label,
  value,
  deltaPct,
  targetLabel,
  atingimento,
  status,
}: {
  label: string;
  value: string;
  deltaPct?: number | null;
  targetLabel?: string | null;
  atingimento?: number | null;
  status?: KpiStatusKey | null;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <p className="text-[12px] font-medium text-ink-soft">{label}</p>
      <p className="tnum font-(family-name:--font-display) text-[27px] leading-none text-ink">
        {value}
      </p>

      {deltaPct !== undefined && deltaPct !== null && (
        <p className="flex items-center gap-1.5 text-[12.5px]">
          <span
            className={`tnum font-medium ${
              deltaPct >= 0 ? "text-positive" : "text-critical"
            }`}
          >
            {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(deltaPct))}%
          </span>
          <span className="text-ink-faint">vs. período anterior</span>
        </p>
      )}

      {targetLabel && (
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
            <span
              className="block h-full rounded-full bg-gold"
              style={{
                width: `${Math.min(100, Math.max(4, atingimento ?? 0))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11.5px] text-ink-faint">{targetLabel}</span>
            {status && (
              <StatusPill
                label={`${atingimento ?? 0}% · ${KPI_STATUS_LABEL[status]}`}
                tone={kpiStatusTone(status)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
