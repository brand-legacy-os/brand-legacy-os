import { formatCurrency, formatDate } from "@/lib/format";
import { toggleSponsorInstallmentPaidAction } from "@/lib/actions/sponsors";

export function SponsorInstallments({
  sponsorId,
  installments,
  canManage,
}: {
  sponsorId: string;
  installments: { id: string; number: number; amount: number; dueDate: Date; paid: boolean; paidDate: Date | null }[];
  canManage: boolean;
}) {
  if (installments.length === 0) {
    return <p className="text-[12.5px] text-ink-faint">Patrocínio à vista — sem parcelas.</p>;
  }

  return (
    <div className="flex flex-col gap-1.5">
      {installments.map((i) => (
        <form key={i.id} action={toggleSponsorInstallmentPaidAction} className="flex items-center justify-between rounded-(--radius-s) bg-surface-muted px-3 py-2">
          <input type="hidden" name="installmentId" value={i.id} />
          <input type="hidden" name="sponsorId" value={sponsorId} />
          <div className="flex flex-col">
            <span className="text-[12.5px] font-medium text-ink">Parcela {i.number}</span>
            <span className="text-[11px] text-ink-faint">
              Vence {formatDate(i.dueDate)}
              {i.paid && i.paidDate ? ` · pago em ${formatDate(i.paidDate)}` : ""}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="tnum text-[13px] font-medium text-ink">{formatCurrency(i.amount)}</span>
            {canManage ? (
              <button
                type="submit"
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  i.paid ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"
                }`}
              >
                {i.paid ? "Pago" : "Marcar como pago"}
              </button>
            ) : (
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${i.paid ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"}`}>
                {i.paid ? "Pago" : "Em aberto"}
              </span>
            )}
          </div>
        </form>
      ))}
    </div>
  );
}
