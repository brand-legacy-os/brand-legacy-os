import { requireFinanceAccess } from "@/lib/finance-auth";
import { prisma } from "@/lib/db";
import { receivableStatus, RECEIVABLE_STATUS_META } from "@/lib/finance";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { StatusPill, receivableStatusTone } from "@/components/ui/status-pill";
import { CreateReceivableForm } from "@/components/finance/create-receivable-form";
import { markReceivableReceivedAction } from "@/lib/actions/finance";
import { FinanceTabs } from "@/components/finance/finance-tabs";

export default async function ContasAReceberPage() {
  await requireFinanceAccess();

  const receivables = await prisma.receivable.findMany({
    orderBy: { vencimento: "asc" },
  });

  const totalAReceber = receivables
    .filter((r) => !r.cancelled)
    .reduce((s, r) => s + (r.valor - r.valorRecebido), 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Financeiro
          </p>
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">
            Contas a receber
          </h1>
          <p className="text-[13px] text-ink-soft">
            Em aberto: <span className="tnum font-medium text-ink">{formatCompactCurrency(totalAReceber)}</span>
          </p>
        </div>
        <CreateReceivableForm />
      </div>

      <FinanceTabs />

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Vencimento</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {receivables.map((r) => {
              const status = receivableStatus(r);
              return (
                <tr key={r.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3 text-ink">{r.cliente}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.descricao}</td>
                  <td className="px-4 py-3 text-ink-soft">{r.produto ?? "—"}</td>
                  <td className="tnum px-4 py-3 text-ink-soft">{formatDate(r.vencimento)}</td>
                  <td className="tnum px-4 py-3 text-ink">
                    {formatCompactCurrency(r.valorRecebido)} / {formatCompactCurrency(r.valor)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill label={RECEIVABLE_STATUS_META[status].label} tone={receivableStatusTone(status)} />
                  </td>
                  <td className="px-4 py-3">
                    <form action={markReceivableReceivedAction}>
                      <input type="hidden" name="id" value={r.id} />
                      <button className="text-[12px] font-medium text-brand hover:underline">
                        {r.valorRecebido >= r.valor ? "Desmarcar" : "Marcar recebido"}
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
            {receivables.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
                  Nenhuma conta a receber cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
