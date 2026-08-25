import type { Kpi, KpiEntry, KpiTarget } from "@prisma/client";
import type { PeriodRange } from "./period";
import { computeAtingimento, computeKpiStatus, type KpiStatusKey } from "./format";

export type KpiSnapshot = {
  kpi: Kpi;
  value: number;
  previousValue: number;
  deltaPct: number | null;
  status: KpiStatusKey | null;
  atingimento: number | null;
  target: number | null;
  targetLabel: "mensal" | "anual" | "proporcional" | "padrão" | null;
  hasData: boolean;
  series: { date: Date; value: number }[];
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Resolves the target to compare against for a given period. Revenue-style
 * KPIs have a real target that varies wildly month to month (e.g. R$195k in
 * January vs R$5.86M in September), so a single static Kpi.target would be
 * meaningless outside the one month it was set for. KpiTarget rows override
 * per "YYYY-MM"; a week/day period prorates the month's target by day count.
 */
export function resolveTarget(
  kpi: Kpi,
  targets: KpiTarget[],
  period: PeriodRange
): { value: number | null; label: KpiSnapshot["targetLabel"] } {
  if (period.key === "ano") {
    const year = String(period.start.getFullYear());
    const rows = targets.filter((t) => t.periodKey.startsWith(`${year}-`));
    if (rows.length > 0) {
      return { value: rows.reduce((s, r) => s + r.target, 0), label: "anual" };
    }
    return { value: kpi.target, label: kpi.target !== null ? "padrão" : null };
  }

  const key = monthKey(period.start);
  const monthRow = targets.find((t) => t.periodKey === key);
  const monthlyTarget = monthRow ? monthRow.target : kpi.target;
  if (monthlyTarget === null || monthlyTarget === undefined) {
    return { value: null, label: null };
  }

  if (period.key === "mes") {
    return { value: monthlyTarget, label: monthRow ? "mensal" : "padrão" };
  }

  // "hoje" / "semana" / "personalizado": prorate the month's target by the
  // share of the month the period actually covers.
  const daysInMonth = new Date(
    period.start.getFullYear(),
    period.start.getMonth() + 1,
    0
  ).getDate();
  const periodDays = Math.max(
    1,
    Math.round((period.end.getTime() - period.start.getTime()) / 86400000) + 1
  );
  if (!kpi.cumulative) {
    return { value: monthlyTarget, label: monthRow ? "mensal" : "padrão" };
  }
  return {
    value: (monthlyTarget * periodDays) / daysInMonth,
    label: "proporcional",
  };
}

export function computeKpiSnapshot(
  kpi: Kpi,
  entries: KpiEntry[],
  period: PeriodRange,
  targets: KpiTarget[] = []
): KpiSnapshot {
  const sorted = [...entries].sort((a, b) => a.date.getTime() - b.date.getTime());
  const inPeriod = sorted.filter(
    (e) => e.date >= period.start && e.date <= period.end
  );
  const inPrevPeriod = sorted.filter(
    (e) => e.date >= period.prevStart && e.date <= period.prevEnd
  );

  let value: number;
  let previousValue: number;
  let series: { date: Date; value: number }[];

  if (kpi.cumulative) {
    value = inPeriod.reduce((sum, e) => sum + e.value, 0);
    previousValue = inPrevPeriod.reduce((sum, e) => sum + e.value, 0);
    series = inPeriod.map((e) => ({ date: e.date, value: e.value }));
  } else {
    const upToEnd = sorted.filter((e) => e.date <= period.end);
    const upToPrevEnd = sorted.filter((e) => e.date <= period.prevEnd);
    value = upToEnd.length ? upToEnd[upToEnd.length - 1].value : 0;
    previousValue = upToPrevEnd.length
      ? upToPrevEnd[upToPrevEnd.length - 1].value
      : value;
    series = inPeriod.length ? inPeriod : upToEnd.slice(-14);
  }

  const deltaPct =
    previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : null;

  const { value: target, label: targetLabel } = resolveTarget(kpi, targets, period);

  // A KPI that has never been filled in reads as "no data yet", not as a
  // red "abaixo da meta" — those are different situations and conflating
  // them would make every freshly-created KPI look like it's failing.
  const hasAnyData = sorted.length > 0;

  const status = target && hasAnyData
    ? computeKpiStatus(value, target, kpi.higherIsBetter)
    : null;
  const atingimento = target && hasAnyData
    ? computeAtingimento(value, target, kpi.higherIsBetter)
    : null;

  return {
    kpi,
    value,
    previousValue,
    deltaPct,
    status,
    atingimento,
    target,
    targetLabel,
    hasData: hasAnyData,
    series,
  };
}

export function averageAtingimento(snapshots: KpiSnapshot[]): number | null {
  const withTarget = snapshots.filter((s) => s.atingimento !== null);
  if (withTarget.length === 0) return null;
  const sum = withTarget.reduce((acc, s) => acc + (s.atingimento ?? 0), 0);
  return Math.round(sum / withTarget.length);
}
