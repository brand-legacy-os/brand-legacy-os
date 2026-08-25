import type { KpiSnapshot } from "@/lib/kpi";
import { formatKpiValue, KPI_STATUS_LABEL, PERIODICITY_LABEL } from "@/lib/format";
import { StatusPill, kpiStatusTone } from "@/components/ui/status-pill";
import { Sparkline } from "@/components/dashboard/sparkline";
import { KpiEntryForm } from "./kpi-entry-form";
import { KpiTargetForm } from "./kpi-target-form";

export function KpiCard({
  snapshot,
  responsibleName,
  canEdit,
}: {
  snapshot: KpiSnapshot;
  responsibleName: string;
  canEdit: boolean;
}) {
  const { kpi, value, deltaPct, status, atingimento, target, hasData, series } =
    snapshot;

  return (
    <div className="flex flex-col gap-4 rounded-(--radius-l) border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-medium text-ink">{kpi.name}</p>
          <p className="text-[12px] text-ink-faint">{kpi.description}</p>
        </div>
        {status ? (
          <StatusPill
            label={KPI_STATUS_LABEL[status]}
            tone={kpiStatusTone(status)}
          />
        ) : !hasData ? (
          <StatusPill label="Sem preenchimento" tone="neutral" />
        ) : null}
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <p className="tnum font-(family-name:--font-display) text-[26px] leading-none text-ink">
            {hasData ? formatKpiValue(kpi, value) : "—"}
          </p>
          <div className="flex items-center gap-2 text-[12px]">
            {deltaPct !== null && (
              <span
                className={`tnum font-medium ${
                  deltaPct >= 0 ? "text-positive" : "text-critical"
                }`}
              >
                {deltaPct >= 0 ? "▲" : "▼"} {Math.abs(Math.round(deltaPct))}%
              </span>
            )}
            {target ? (
              <span className="text-ink-faint">
                meta {formatKpiValue(kpi, target)}
                {atingimento !== null ? ` · ${atingimento}% atingido` : ""}
              </span>
            ) : (
              <span className="text-ink-faint">sem meta definida</span>
            )}
          </div>
        </div>
        <Sparkline series={series} target={target} />
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-[12px] text-ink-faint">
        <span>Responsável: {responsibleName}</span>
        <span>{PERIODICITY_LABEL[kpi.periodicity]}</span>
      </div>

      {canEdit && (
        <div className="flex flex-col gap-2">
          <KpiEntryForm kpiId={kpi.id} unit={kpi.unit || kpi.type} />
          <KpiTargetForm kpiId={kpi.id} />
        </div>
      )}
    </div>
  );
}
