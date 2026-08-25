import type { Kpi } from "@prisma/client";

const currencyFmt = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const numberFmt = new Intl.NumberFormat("pt-BR");

const decimalFmt = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

export function formatKpiValue(kpi: Pick<Kpi, "type" | "unit">, value: number) {
  switch (kpi.type) {
    case "moeda":
      return currencyFmt.format(value);
    case "percentual":
    case "conversao":
      return `${decimalFmt.format(value)}%`;
    case "tempo":
      return `${decimalFmt.format(value)} ${kpi.unit}`;
    case "media":
      return `${decimalFmt.format(value)}${kpi.unit ? " " + kpi.unit : ""}`;
    case "quantidade":
    case "numero":
    default:
      return `${numberFmt.format(Math.round(value))}${
        kpi.unit ? " " + kpi.unit : ""
      }`;
  }
}

export function formatCompactCurrency(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `R$ ${decimalFmt.format(value / 1_000_000)} M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `R$ ${decimalFmt.format(value / 1_000)} mil`;
  }
  return currencyFmt.format(value);
}

export function formatPercent(value: number, digits = 0) {
  return `${value.toFixed(digits)}%`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function formatDateFull(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeTime(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `há ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `há ${diffD}d`;
  return formatDate(date);
}

export type KpiStatusKey = "atingida" | "no_ritmo" | "atencao" | "abaixo";

export const KPI_STATUS_LABEL: Record<KpiStatusKey, string> = {
  atingida: "Meta atingida",
  no_ritmo: "No ritmo",
  atencao: "Atenção",
  abaixo: "Abaixo da meta",
};

export function computeKpiStatus(
  value: number,
  target: number,
  higherIsBetter: boolean
): KpiStatusKey {
  if (target <= 0) return "no_ritmo";
  const ratio = higherIsBetter ? value / target : value <= 0 ? 1 : target / value;
  if (ratio >= 1) return "atingida";
  if (ratio >= 0.85) return "no_ritmo";
  if (ratio >= 0.6) return "atencao";
  return "abaixo";
}

export function computeAtingimento(
  value: number,
  target: number,
  higherIsBetter: boolean
) {
  if (target <= 0) return null;
  const ratio = higherIsBetter ? value / target : value <= 0 ? 1 : target / value;
  return Math.round(ratio * 100);
}

export const TASK_STATUS_META = {
  no_ritmo: { label: "No ritmo", dot: "🟢" },
  atencao: { label: "Atenção / risco", dot: "🟡" },
  atrasada: { label: "Atrasada", dot: "🔴" },
  pausada: { label: "Pausada", dot: "⚪" },
  cancelada: { label: "Cancelada", dot: "⚫" },
  concluida: { label: "Concluída", dot: "✅" },
} as const;

export const PERIODICITY_LABEL: Record<"diaria" | "semanal" | "mensal", string> = {
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
};

export const TASK_PRIORITY_META = {
  baixa: { label: "Baixa", order: 0 },
  media: { label: "Média", order: 1 },
  alta: { label: "Alta", order: 2 },
  urgente: { label: "Urgente", order: 3 },
} as const;

export const PROJECT_STATUS_META = {
  no_ritmo: { label: "No ritmo" },
  risco: { label: "Em risco" },
  atrasado: { label: "Atrasado" },
  pausado: { label: "Pausado" },
  concluido: { label: "Concluído" },
} as const;
