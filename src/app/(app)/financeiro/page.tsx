import Link from "next/link";
import { requireFinanceAccess } from "@/lib/finance-auth";
import { prisma } from "@/lib/db";
import {
  cashPositionAt,
  cashMovementsBetween,
  summarizeDre,
  monthKey,
  periodKeyLabel,
} from "@/lib/finance";
import { payableStatus, receivableStatus } from "@/lib/finance";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { FinanceTabs } from "@/components/finance/finance-tabs";
import { TrendChart } from "@/components/finance/trend-chart";

function shiftPeriod(periodKey: string, delta: number) {
  const [y, m] = periodKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

function lastNMonthKeys(n: number, endKey: string) {
  const [y, m] = endKey.split("-").map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(monthKey(new Date(y, m - 1 - i, 1)));
  }
  return keys;
}

export default async function FinanceiroPage({
  searchParams,
}: PageProps<"/financeiro">) {
  await requireFinanceAccess();
  const sp = await searchParams;

  const now = new Date();
  const mes = typeof sp.mes === "string" ? sp.mes : monthKey(now);
  const prevMes = shiftPeriod(mes, -1);

  const [accounts, movements, categories, payables, receivables] =
    await Promise.all([
      prisma.cashAccount.findMany(),
      prisma.cashMovement.findMany(),
      prisma.financeCategory.findMany({ include: { entries: true } }),
      prisma.payable.findMany(),
      prisma.receivable.findMany(),
    ]);

  const currentPosition = cashPositionAt(accounts, movements, now);
  const in7 = new Date(now.getTime() + 7 * 86400000);
  const upcoming = cashMovementsBetween(movements, now, in7);
  const positionIn7Days = cashPositionAt(accounts, movements, in7);

  const dfc = summarizeDre(categories, mes);
  const dfcPrev = summarizeDre(categories, prevMes);

  const deltaEntradas =
    dfcPrev.receitaRealizado !== 0
      ? ((dfc.receitaRealizado - dfcPrev.receitaRealizado) /
          Math.abs(dfcPrev.receitaRealizado)) *
        100
      : null;
  const deltaResultado =
    dfcPrev.resultadoRealizado !== 0
      ? ((dfc.resultadoRealizado - dfcPrev.resultadoRealizado) /
          Math.abs(dfcPrev.resultadoRealizado)) *
        100
      : null;

  const overduePayables = payables.filter((p) => payableStatus(p) === "atrasado");
  const overdueReceivables = receivables.filter((r) => receivableStatus(r) === "atrasado");

  const trendMonths = lastNMonthKeys(6, mes);
  const receitaTrend = trendMonths.map((m) => ({
    label: periodKeyLabel(m).slice(0, 3),
    value: summarizeDre(categories, m).receitaRealizado,
  }));
  const resultadoTrend = trendMonths.map((m) => ({
    label: periodKeyLabel(m).slice(0, 3),
    value: summarizeDre(categories, m).resultadoRealizado,
  }));

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Financeiro
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Visão geral
          </h1>
          <p className="text-[13px] text-ink-soft">
            Entradas, resultado e caixa — {periodKeyLabel(mes)}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/financeiro?mes=${prevMes}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-ink-soft hover:bg-surface-muted"
          >
            ←
          </Link>
          <span className="text-[13px] font-medium text-ink">
            {periodKeyLabel(mes)}
          </span>
          <Link
            href={`/financeiro?mes=${shiftPeriod(mes, 1)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-ink-soft hover:bg-surface-muted"
          >
            →
          </Link>
          <form action="/financeiro" className="flex items-center gap-1.5">
            <input
              type="month"
              name="mes"
              defaultValue={mes}
              className="h-9 rounded-full border border-border bg-surface px-3 text-[12.5px] text-ink-soft outline-none"
            />
            <button
              type="submit"
              className="h-9 rounded-full border border-border bg-surface px-3 text-[12.5px] font-medium text-ink-soft hover:bg-surface-muted"
            >
              Ir
            </button>
          </form>
          <Link
            href={`/financeiro/dfc?periodo=${mes}`}
            className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft hover:opacity-90"
          >
            Ver DFC completo
          </Link>
        </div>
      </div>

      <FinanceTabs />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Entradas do mês</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {formatCompactCurrency(dfc.receitaRealizado)}
          </p>
          {deltaEntradas !== null ? (
            <p className={`text-[11px] font-medium ${deltaEntradas >= 0 ? "text-positive" : "text-critical"}`}>
              {deltaEntradas >= 0 ? "▲" : "▼"} {Math.abs(Math.round(deltaEntradas))}% vs. {periodKeyLabel(prevMes)}
            </p>
          ) : (
            <p className="text-[11px] text-ink-faint">fluxo de caixa (DFC)</p>
          )}
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Resultado do mês</p>
          <p
            className={`tnum font-(family-name:--font-display) text-[24px] ${dfc.resultadoRealizado >= 0 ? "text-ink" : "text-critical"}`}
          >
            {formatCompactCurrency(dfc.resultadoRealizado)}
          </p>
          {deltaResultado !== null ? (
            <p className={`text-[11px] font-medium ${deltaResultado >= 0 ? "text-positive" : "text-critical"}`}>
              {deltaResultado >= 0 ? "▲" : "▼"} {Math.abs(Math.round(deltaResultado))}% vs. {periodKeyLabel(prevMes)}
            </p>
          ) : (
            <p className="text-[11px] text-ink-faint">entradas − saídas (DFC)</p>
          )}
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Saldo de caixa hoje</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {formatCompactCurrency(currentPosition)}
          </p>
          <p className="text-[11px] text-ink-faint">
            projeção 7d {formatCompactCurrency(positionIn7Days)}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Pede atenção</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {overduePayables.length + overdueReceivables.length}
          </p>
          <p className="text-[11px] text-ink-faint">contas em atraso</p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Receita — últimos 6 meses
          </h2>
          <TrendChart points={receitaTrend} formatValue={formatCompactCurrency} />
        </section>
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Resultado (DFC) — últimos 6 meses
          </h2>
          <TrendChart
            points={resultadoTrend}
            formatValue={formatCompactCurrency}
            color="var(--color-gold-ink)"
          />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Próximas movimentações (7 dias)
            </h2>
            <Link
              href="/financeiro/caixa"
              className="text-[12px] font-medium text-brand hover:underline"
            >
              Ver tudo →
            </Link>
          </div>
          <div className="flex flex-col">
            {upcoming.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border-t border-border py-2 first:border-t-0"
              >
                <div className="flex flex-col">
                  <span className="text-[12.5px] text-ink">{m.description}</span>
                  <span className="text-[11px] text-ink-faint">
                    {formatDate(m.date)}
                  </span>
                </div>
                <span
                  className={`tnum text-[12.5px] font-medium ${m.amount >= 0 ? "text-positive" : "text-critical"}`}
                >
                  {formatCompactCurrency(m.amount)}
                </span>
              </div>
            ))}
            {upcoming.length === 0 && (
              <p className="py-3 text-[12.5px] text-ink-faint">
                Nenhuma movimentação prevista nos próximos 7 dias.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Pede atenção
          </h2>
          <div className="flex flex-col gap-2.5">
            {overduePayables.length === 0 && overdueReceivables.length === 0 && (
              <p className="text-[12.5px] text-ink-faint">
                Nenhuma conta em atraso no momento.
              </p>
            )}
            {overduePayables.length > 0 && (
              <Link
                href="/financeiro/contas-a-pagar"
                className="flex items-center justify-between rounded-(--radius-s) bg-critical-bg px-3 py-2 hover:opacity-90"
              >
                <span className="text-[13px] text-critical">
                  {overduePayables.length} conta
                  {overduePayables.length > 1 ? "s" : ""} a pagar em atraso
                </span>
                <span className="tnum text-[12.5px] text-critical">
                  {formatCompactCurrency(
                    overduePayables.reduce((s, p) => s + p.valorPrevisto, 0)
                  )}
                </span>
              </Link>
            )}
            {overdueReceivables.length > 0 && (
              <Link
                href="/financeiro/contas-a-receber"
                className="flex items-center justify-between rounded-(--radius-s) bg-warning-bg px-3 py-2 hover:opacity-90"
              >
                <span className="text-[13px] text-warning">
                  {overdueReceivables.length} conta
                  {overdueReceivables.length > 1 ? "s" : ""} a receber em
                  atraso
                </span>
                <span className="tnum text-[12.5px] text-warning">
                  {formatCompactCurrency(
                    overdueReceivables.reduce((s, r) => s + (r.valor - r.valorRecebido), 0)
                  )}
                </span>
              </Link>
            )}
          </div>

          <div className="mt-2 border-t border-border pt-3">
            <p className="mb-2 text-[11px] uppercase tracking-[0.05em] text-ink-faint">
              DFC do mês — planejado × realizado
            </p>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-soft">Receita</span>
              <span className="tnum text-ink">
                {formatCompactCurrency(dfc.receitaRealizado)} /{" "}
                {formatCompactCurrency(dfc.receitaPrevisto)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-soft">Despesas</span>
              <span className="tnum text-ink">
                {formatCompactCurrency(dfc.despesaRealizado)} /{" "}
                {formatCompactCurrency(dfc.despesaPrevisto)}
              </span>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
