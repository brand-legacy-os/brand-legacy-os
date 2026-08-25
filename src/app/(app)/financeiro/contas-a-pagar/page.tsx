import { requireFinanceAccess } from "@/lib/finance-auth";
import { prisma } from "@/lib/db";
import { payableStatus, PAYABLE_STATUS_META } from "@/lib/finance";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { StatusPill, payableStatusTone } from "@/components/ui/status-pill";
import { CreatePayableForm } from "@/components/finance/create-payable-form";
import { markPayablePaidAction } from "@/lib/actions/finance";
import { FinanceTabs } from "@/components/finance/finance-tabs";

export default async function ContasAPagarPage() {
  await requireFinanceAccess();

  const payables = await prisma.payable.findMany({
    orderBy: { vencimento: "asc" },
  });

  const totalAVencer = payables
    .filter((p) => !p.pagamento && !p.cancelled)
    .reduce((s, p) => s + p.valorPrevisto, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Financeiro
          </p>
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">
            Contas a pagar
          </h1>
          <p className="text-[13px] text-ink-soft">
            Em aberto: <span className="tnum font-medium text-ink">{formatCompactCurrency(totalAVencer)}</span>
          </p>
        </div>
        <CreatePayableForm />
      </div>

      <FinanceTabs />

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">Fornecedor</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {payables.map((p) => {
              const status = payableStatus(p);
              return (
                <tr key={p.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-ink">{p.fornecedor}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.descricao}</td>
                  <td className="px-4 py-3 text-ink-soft">{p.categoria}</td>
                  <td className="tnum px-4 py-3 text-ink-soft">{formatDate(p.vencimento)}</td>
                  <td className="tnum px-4 py-3 text-ink">{formatCompactCurrency(p.valorRealizado ?? p.valorPrevisto)}</td>
                  <td className="px-4 py-3">
                    <StatusPill label={PAYABLE_STATUS_META[status].label} tone={payableStatusTone(status)} />
                  </td>
                  <td className="px-4 py-3">
                    <form action={markPayablePaidAction}>
                      <input type="hidden" name="id" value={p.id} />
                      <button className="text-[12px] font-medium text-brand hover:underline">
                        {p.pagamento ? "Desmarcar" : "Marcar pago"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {payables.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
                  Nenhuma conta a pagar cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
