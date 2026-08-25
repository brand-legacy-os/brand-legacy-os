import { requireFinanceAccess } from "@/lib/finance-auth";
import { prisma } from "@/lib/db";
import { cashPositionAt, receivableStatus, summarizeDre, monthKey, periodKeyLabel } from "@/lib/finance";
import { formatCompactCurrency, formatPercent } from "@/lib/format";
import { FinanceTabs } from "@/components/finance/finance-tabs";

export default async function FinanceiroIndicadoresPage({
  searchParams,
}: PageProps<"/financeiro/indicadores">) {
  await requireFinanceAccess();
  const sp = await searchParams;
  const mes = typeof sp.mes === "string" ? sp.mes : monthKey(new Date());

  const [categories, receivables, accounts, movements] = await Promise.all([
    prisma.financeCategory.findMany({ include: { entries: true } }),
    prisma.receivable.findMany({ where: { cancelled: false } }),
    prisma.cashAccount.findMany(),
    prisma.cashMovement.findMany(),
  ]);

  const dfc = summarizeDre(categories, mes);
  const margemLiquidaPct =
    dfc.receitaRealizado > 0
      ? (dfc.resultadoRealizado / dfc.receitaRealizado) * 100
      : null;

  const receivablesInMonth = receivables.filter(
    (r) => monthKey(r.vencimento) === mes
  );
  const totalEsperado = receivablesInMonth.reduce((s, r) => s + r.valor, 0);
  const totalEmAtraso = receivablesInMonth
    .filter((r) => receivableStatus(r) === "atrasado")
    .reduce((s, r) => s + (r.valor - r.valorRecebido), 0);
  const inadimplenciaPct = totalEsperado > 0 ? (totalEmAtraso / totalEsperado) * 100 : null;

  const saldoCaixa = cashPositionAt(accounts, movements, new Date());

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Financeiro
          </p>
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">
            Indicadores
          </h1>
          <p className="text-[13px] text-ink-soft">
            Margem, inadimplência e saldo — calculados direto do DFC e do Caixa, {periodKeyLabel(mes)}.
          </p>
        </div>
        <form action="/financeiro/indicadores" className="flex items-center gap-1.5">
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
      </div>

      <FinanceTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Margem líquida</p>
          <p className="tnum font-(family-name:--font-display) text-[26px] text-ink">
            {margemLiquidaPct !== null ? formatPercent(margemLiquidaPct, 1) : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            resultado ÷ receita do mês, do DFC
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Inadimplência</p>
          <p className="tnum font-(family-name:--font-display) text-[26px] text-ink">
            {inadimplenciaPct !== null ? formatPercent(inadimplenciaPct, 1) : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            {totalEsperado > 0
              ? `${formatCompactCurrency(totalEmAtraso)} em atraso de ${formatCompactCurrency(totalEsperado)} esperado`
              : "sem contas a receber com vencimento no mês"}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Saldo de caixa</p>
          <p className="tnum font-(family-name:--font-display) text-[26px] text-ink">
            {formatCompactCurrency(saldoCaixa)}
          </p>
          <p className="text-[11px] text-ink-faint">posição em tempo real</p>
        </div>
      </div>
    </>
  );
}
