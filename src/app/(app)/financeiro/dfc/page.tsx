import Link from "next/link";
import { requireFinanceAccess } from "@/lib/finance-auth";
import { prisma } from "@/lib/db";
import { summarizeDre, periodKeyLabel, monthKey } from "@/lib/finance";
import { formatCompactCurrency } from "@/lib/format";
import { FinanceEntryForm } from "@/components/finance/finance-entry-form";
import { FinanceTabs } from "@/components/finance/finance-tabs";

function shiftPeriod(periodKey: string, delta: number) {
  const [y, m] = periodKey.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export default async function DfcPage({
  searchParams,
}: PageProps<"/financeiro/dfc">) {
  await requireFinanceAccess();
  const sp = await searchParams;
  const period =
    typeof sp.periodo === "string" ? sp.periodo : monthKey(new Date());
  const prevPeriod = shiftPeriod(period, -1);

  const categories = await prisma.financeCategory.findMany({
    include: { entries: true },
    orderBy: { order: "asc" },
  });

  const current = summarizeDre(categories, period);
  const previous = summarizeDre(categories, prevPeriod);

  const receitaLines = current.lines.filter((l) => l.kind === "receita");
  const despesaLines = current.lines.filter((l) => l.kind === "despesa");

  const deltaResultado =
    previous.resultadoRealizado !== 0
      ? ((current.resultadoRealizado - previous.resultadoRealizado) /
          Math.abs(previous.resultadoRealizado)) *
        100
      : null;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Financeiro
          </p>
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">
            DFC
          </h1>
          <p className="text-[13px] text-ink-soft">
            {periodKeyLabel(period)} · planejado × realizado
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/financeiro/dfc?periodo=${prevPeriod}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-ink-soft hover:bg-surface-muted"
          >
            ←
          </Link>
          <span className="text-[13px] font-medium text-ink">
            {periodKeyLabel(period)}
          </span>
          <Link
            href={`/financeiro/dfc?periodo=${shiftPeriod(period, 1)}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-ink-soft hover:bg-surface-muted"
          >
            →
          </Link>
          <form action="/financeiro/dfc" className="flex items-center gap-1.5">
            <input
              type="month"
              name="periodo"
              defaultValue={period}
              className="h-9 rounded-full border border-border bg-surface px-3 text-[12.5px] text-ink-soft outline-none"
            />
            <button
              type="submit"
              className="h-9 rounded-full border border-border bg-surface px-3 text-[12.5px] font-medium text-ink-soft hover:bg-surface-muted"
            >
              Ir
            </button>
          </form>
        </div>
      </div>

      <FinanceTabs />

      <FinanceEntryForm
        categories={categories.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
        defaultPeriodKey={period}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Receita</p>
          <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">
            {formatCompactCurrency(current.receitaRealizado)}
          </p>
          <p className="text-[11.5px] text-ink-faint">
            previsto {formatCompactCurrency(current.receitaPrevisto)}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Despesas</p>
          <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">
            {formatCompactCurrency(current.despesaRealizado)}
          </p>
          <p className="text-[11.5px] text-ink-faint">
            previsto {formatCompactCurrency(current.despesaPrevisto)}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Resultado</p>
          <p
            className={`tnum font-(family-name:--font-display) text-[22px] ${current.resultadoRealizado >= 0 ? "text-ink" : "text-critical"}`}
          >
            {formatCompactCurrency(current.resultadoRealizado)}
          </p>
          {deltaResultado !== null && (
            <p
              className={`text-[11.5px] font-medium ${deltaResultado >= 0 ? "text-positive" : "text-critical"}`}
            >
              {deltaResultado >= 0 ? "▲" : "▼"} {Math.abs(Math.round(deltaResultado))}%
              vs. {periodKeyLabel(prevPeriod)}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-1 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="mb-2 text-[13px] font-medium text-ink-soft">
            Receita por categoria
          </h2>
          {receitaLines.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between border-t border-border py-2 first:border-t-0"
            >
              <span className="text-[13px] text-ink">{l.name}</span>
              <span className="tnum text-[12.5px] text-ink-soft">
                {formatCompactCurrency(l.realizado ?? 0)}
                {l.previsto !== null ? ` / ${formatCompactCurrency(l.previsto)}` : ""}
              </span>
            </div>
          ))}
          {receitaLines.length === 0 && (
            <p className="py-3 text-[12.5px] text-ink-faint">
              Sem lançamentos de receita neste período.
            </p>
          )}
        </section>

        <section className="flex flex-col gap-1 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="mb-2 text-[13px] font-medium text-ink-soft">
            Despesas por categoria
          </h2>
          {despesaLines.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between border-t border-border py-2 first:border-t-0"
            >
              <span className="text-[13px] text-ink">{l.name}</span>
              <span className="tnum text-[12.5px] text-ink-soft">
                {formatCompactCurrency(l.realizado ?? 0)}
                {l.previsto !== null ? ` / ${formatCompactCurrency(l.previsto)}` : ""}
              </span>
            </div>
          ))}
          {despesaLines.length === 0 && (
            <p className="py-3 text-[12.5px] text-ink-faint">
              Sem lançamentos de despesa neste período.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
