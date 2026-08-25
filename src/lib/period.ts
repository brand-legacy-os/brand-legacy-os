export type PeriodKey = "hoje" | "semana" | "mes" | "ano" | "personalizado";

export type PeriodRange = {
  key: PeriodKey;
  label: string;
  start: Date;
  end: Date;
  prevStart: Date;
  prevEnd: Date;
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function resolvePeriod(
  key: PeriodKey,
  from?: string,
  to?: string
): PeriodRange {
  const now = new Date();

  if (key === "personalizado" && from && to) {
    // "YYYY-MM-DD" alone parses as UTC midnight (ECMA-262), which shifts to
    // the previous local day in any timezone behind UTC — anchor to local
    // noon first so startOfDay/endOfDay operate on the intended calendar day.
    const start = startOfDay(new Date(`${from}T12:00:00`));
    const end = endOfDay(new Date(`${to}T12:00:00`));
    const spanMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - spanMs);
    return {
      key,
      label: "Período personalizado",
      start,
      end,
      prevStart,
      prevEnd,
    };
  }

  if (key === "hoje") {
    const start = startOfDay(now);
    const end = endOfDay(now);
    const prevStart = startOfDay(new Date(now.getTime() - 86400000));
    const prevEnd = endOfDay(new Date(now.getTime() - 86400000));
    return { key, label: "Hoje", start, end, prevStart, prevEnd };
  }

  if (key === "semana") {
    const end = endOfDay(now);
    const start = startOfDay(new Date(now.getTime() - 6 * 86400000));
    const prevEnd = endOfDay(new Date(start.getTime() - 1));
    const prevStart = startOfDay(new Date(prevEnd.getTime() - 6 * 86400000));
    return { key, label: "Esta semana", start, end, prevStart, prevEnd };
  }

  if (key === "ano") {
    const start = new Date(now.getFullYear(), 0, 1);
    const end = endOfDay(now);
    const prevStart = new Date(now.getFullYear() - 1, 0, 1);
    const prevEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
    return { key, label: "Este ano", start, end, prevStart, prevEnd };
  }

  // "mes" default
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = endOfDay(now);
  const prevMonthEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(
    prevMonthEnd.getFullYear(),
    prevMonthEnd.getMonth(),
    1
  );
  return { key: "mes", label: "Este mês", start, end, prevStart, prevEnd: endOfDay(prevMonthEnd) };
}

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "semana", label: "Esta semana" },
  { key: "mes", label: "Este mês" },
  { key: "ano", label: "Este ano" },
];
