import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewSponsors, canManageSponsors } from "@/lib/permissions";
import { formatCompactCurrency } from "@/lib/format";
import { SPONSOR_TIER_META, SPONSOR_DEAL_STATUS_META, sponsorPaidValue } from "@/lib/sponsors";
import { StatusPill } from "@/components/ui/status-pill";
import { PatrociniosTabs } from "@/components/patrocinios/patrocinios-tabs";
import { toggleSponsorPaidAction } from "@/lib/actions/sponsors";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function PatrociniosBasePage() {
  const user = await requireUser();
  if (!canViewSponsors(user)) notFound();
  const canManage = canManageSponsors(user);

  const sponsors = await prisma.sponsor.findMany({
    include: { event: { select: { id: true, name: true, startDate: true } }, installments: true },
    orderBy: { createdAt: "desc" },
  });

  const byEvent = new Map<string, { eventId: string | null; eventName: string; startDate: Date | null; sponsors: typeof sponsors }>();
  for (const s of sponsors) {
    const key = s.event?.id ?? (s.isAnnual ? "__anual__" : "__sem_evento__");
    const label = s.event?.name ?? (s.isAnnual ? "Anual / recorrente" : "Sem evento vinculado");
    const entry = byEvent.get(key) ?? { eventId: s.event?.id ?? null, eventName: label, startDate: s.event?.startDate ?? null, sponsors: [] };
    entry.sponsors.push(s);
    byEvent.set(key, entry);
  }
  const groups = [...byEvent.values()].sort((a, b) => {
    if (a.startDate && b.startDate) return b.startDate.getTime() - a.startDate.getTime();
    if (a.startDate) return -1;
    if (b.startDate) return 1;
    return a.eventName.localeCompare(b.eventName);
  });

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Patrocínio de verdade é parceria — não é só verba."
        subtitle="Cada marca que assina com a gente vira parte da história. Contrato bem cuidado hoje é renovação garantida amanhã."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Patrocínios
        </h1>
      </div>

      <PatrociniosTabs />

      <p className="max-w-[72ch] text-[13px] text-ink-soft">
        Base de patrocinadores ({sponsors.length}), agrupada por evento — clique no
        nome pra ver o perfil completo, parcelas, histórico de interações, vendas de
        leads e tarefas.
      </p>

      <div className="flex flex-col gap-6">
        {groups.map((g) => (
          <section key={g.eventId ?? g.eventName} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[13.5px] font-medium text-ink">
                {g.eventId ? (
                  <Link href={`/eventos/${g.eventId}`} className="hover:text-brand-deep hover:underline">
                    {g.eventName}
                  </Link>
                ) : (
                  g.eventName
                )}
              </h2>
              <span className="text-[11.5px] text-ink-faint">
                {g.sponsors.length} patrocinador{g.sponsors.length === 1 ? "" : "es"} ·{" "}
                {formatCompactCurrency(g.sponsors.reduce((s, sp) => s + sp.totalValue, 0))}
              </span>
            </div>
            <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
              <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-[0.04em] text-ink-faint">
                    <th className="px-3 py-2 font-medium">Patrocinador</th>
                    <th className="px-3 py-2 font-medium">Cota</th>
                    <th className="px-3 py-2 font-medium">Valor</th>
                    <th className="px-3 py-2 font-medium">Recebido</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {g.sponsors.map((s) => {
                    const tierMeta = SPONSOR_TIER_META[s.tier];
                    const statusMeta = SPONSOR_DEAL_STATUS_META[s.status];
                    const paid = sponsorPaidValue(s);
                    const isPaidAvista = s.paymentPlan === "avista" && (s.status === "pago_integralmente" || s.status === "pago_parcialmente");
                    return (
                      <tr key={s.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted">
                        <td className="px-3 py-2">
                          <Link href={`/patrocinios/${s.id}`} className="font-medium text-ink hover:text-brand-deep hover:underline">
                            {s.name}
                          </Link>
                          <p className="text-[11px] text-ink-faint">{s.contactName}</p>
                        </td>
                        <td className="px-3 py-2 text-ink-soft">{tierMeta.label}</td>
                        <td className="tnum px-3 py-2 text-ink-soft">{formatCompactCurrency(s.totalValue)}</td>
                        <td className="tnum px-3 py-2 text-ink-soft">{formatCompactCurrency(paid)}</td>
                        <td className="px-3 py-2">
                          <StatusPill label={statusMeta.label} tone={statusMeta.tone} />
                        </td>
                        <td className="px-3 py-2">
                          {s.paymentPlan === "avista" ? (
                            canManage ? (
                              <form action={toggleSponsorPaidAction}>
                                <input type="hidden" name="sponsorId" value={s.id} />
                                <button
                                  type="submit"
                                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                                    isPaidAvista ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"
                                  }`}
                                >
                                  {isPaidAvista ? "Pago" : "Marcar como pago"}
                                </button>
                              </form>
                            ) : (
                              <span className="text-[11px] text-ink-faint">{isPaidAvista ? "Pago" : "Em aberto"}</span>
                            )
                          ) : (
                            <span className="text-[11px] text-ink-faint">Parcelado — ver ficha</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
            Nenhum patrocinador cadastrado ainda.
          </p>
        )}
      </div>
    </>
  );
}
