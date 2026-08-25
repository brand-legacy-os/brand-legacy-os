import type { CashAccount, CashMovement, FinanceCategory, FinanceEntry } from "@prisma/client";

export const MONTH_LABELS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function periodKeyLabel(periodKey: string) {
  const [year, month] = periodKey.split("-");
  const idx = Number(month) - 1;
  return `${MONTH_LABELS[idx] ?? month} ${year}`;
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Sums of a set of category entries for one period, split receita/despesa. */
export function summarizeDre(
  categories: (FinanceCategory & { entries: FinanceEntry[] })[],
  periodKey: string
) {
  let receitaRealizado = 0;
  let receitaPrevisto = 0;
  let despesaRealizado = 0;
  let despesaPrevisto = 0;

  const lines: {
    id: string;
    name: string;
    kind: "receita" | "despesa";
    realizado: number | null;
    previsto: number | null;
  }[] = [];

  for (const cat of categories) {
    const entry = cat.entries.find((e) => e.periodKey === periodKey);
    const realizado = entry?.realizado ?? null;
    const previsto = entry?.previsto ?? null;
    if (realizado === null && previsto === null) continue;

    lines.push({ id: cat.id, name: cat.name, kind: cat.kind, realizado, previsto });

    if (cat.kind === "receita") {
      receitaRealizado += realizado ?? 0;
      receitaPrevisto += previsto ?? 0;
    } else {
      despesaRealizado += realizado ?? 0;
      despesaPrevisto += previsto ?? 0;
    }
  }

  return {
    lines,
    receitaRealizado,
    receitaPrevisto,
    despesaRealizado,
    despesaPrevisto,
    resultadoRealizado: receitaRealizado - despesaRealizado,
    resultadoPrevisto: receitaPrevisto - despesaPrevisto,
  };
}

/**
 * Reconstructs the cash position for any date from the account snapshot
 * plus every movement between the snapshot and that date — never stores a
 * running total, so it can't drift from the ledger.
 */
export function cashPositionAt(
  accounts: CashAccount[],
  movements: CashMovement[],
  targetDate: Date
) {
  const snapshotTotal = accounts.reduce((s, a) => s + a.balance, 0);
  const snapshotDate = accounts[0]?.snapshotDate ?? targetDate;

  const applicable = movements
    .filter((m) => m.date > snapshotDate && m.date <= targetDate)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const total = applicable.reduce((s, m) => s + m.amount, 0) + snapshotTotal;
  return total;
}

export function cashMovementsBetween(
  movements: CashMovement[],
  start: Date,
  end: Date
) {
  return movements
    .filter((m) => m.date >= start && m.date <= end)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export type PayableStatus = "pago" | "atrasado" | "vencendo_hoje" | "a_vencer" | "cancelado";

export function payableStatus(p: {
  pagamento: Date | null;
  vencimento: Date;
  cancelled: boolean;
}): PayableStatus {
  if (p.cancelled) return "cancelado";
  if (p.pagamento) return "pago";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(p.vencimento);
  due.setHours(0, 0, 0, 0);
  if (due.getTime() === today.getTime()) return "vencendo_hoje";
  if (due < today) return "atrasado";
  return "a_vencer";
}

export const PAYABLE_STATUS_META: Record<PayableStatus, { label: string }> = {
  pago: { label: "Pago" },
  atrasado: { label: "Em atraso" },
  vencendo_hoje: { label: "Vencendo hoje" },
  a_vencer: { label: "A vencer" },
  cancelado: { label: "Cancelado" },
};

export type ReceivableStatus = "recebido" | "parcial" | "atrasado" | "a_receber" | "cancelado";

export function receivableStatus(r: {
  valor: number;
  valorRecebido: number;
  vencimento: Date;
  cancelled: boolean;
}): ReceivableStatus {
  if (r.cancelled) return "cancelado";
  if (r.valorRecebido >= r.valor && r.valor > 0) return "recebido";
  if (r.valorRecebido > 0) return "parcial";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(r.vencimento);
  due.setHours(0, 0, 0, 0);
  if (due < today) return "atrasado";
  return "a_receber";
}

export const RECEIVABLE_STATUS_META: Record<ReceivableStatus, { label: string }> = {
  recebido: { label: "Recebido" },
  parcial: { label: "Parcialmente recebido" },
  atrasado: { label: "Em atraso" },
  a_receber: { label: "A receber" },
  cancelado: { label: "Cancelado" },
};
