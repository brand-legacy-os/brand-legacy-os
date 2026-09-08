import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { resolvePeriod } from "@/lib/period";
import { SocialTabs } from "@/components/social/social-tabs";
import { CreateSocialLeadForm } from "@/components/social/create-social-lead-form";
import { LeadSaleCell } from "@/components/social/lead-sale-cell";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { updateSocialLeadStatusAction, deleteSocialLeadAction } from "@/lib/actions/social";
import { SOCIAL_LEAD_STATUS_META } from "@/lib/social";
import { StatTile } from "@/components/dashboard/stat-tile";
import { formatDate, formatCompactCurrency } from "@/lib/format";
import { notFound } from "next/navigation";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function SocialCrmPage() {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const canEdit = canEditAreaKpis(user, "social");

  const [leads, allUsers] = await Promise.all([
    prisma.socialSellingLead.findMany({
      include: { salesperson: true },
      orderBy: { meetingDate: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  const period = resolvePeriod("mes");
  const closedInPeriod = leads.filter(
    (l) => l.saleValue && l.saleDate && l.saleDate >= period.start && l.saleDate <= period.end
  );
  const revenueTotal = closedInPeriod.reduce((s, l) => s + (l.saleValue ?? 0), 0);
  const allClosed = leads.filter((l) => l.saleValue);
  const ticketMedio = allClosed.length > 0 ? allClosed.reduce((s, l) => s + (l.saleValue ?? 0), 0) / allClosed.length : 0;

  // Receita por semana dentro do mês corrente.
  const weekBuckets = new Map<number, number>();
  for (const l of closedInPeriod) {
    const week = Math.ceil(new Date(l.saleDate!).getDate() / 7);
    weekBuckets.set(week, (weekBuckets.get(week) ?? 0) + (l.saleValue ?? 0));
  }
  const revenueByWeek = [...weekBuckets.entries()].sort(([a], [b]) => a - b);

  // Vendas por produto (todo o histórico).
  const byProduct = new Map<string, { count: number; value: number }>();
  for (const l of allClosed) {
    const key = l.saleProduct ?? "Outro";
    const entry = byProduct.get(key) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += l.saleValue ?? 0;
    byProduct.set(key, entry);
  }

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Marca forte não acontece por acaso — se constrói todo dia."
        subtitle="Consistência, autenticidade e presença — cada post é um tijolo na autoridade da marca."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Social
        </h1>
        <p className="max-w-[62ch] text-[13px] text-ink-soft">
          Funil de Social Selling — pipeline de leads e vendas fechadas por
          esse canal.
        </p>
      </div>

      <SocialTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label={`Receita do mês (${period.label.toLowerCase()})`} value={formatCompactCurrency(revenueTotal)} />
        <StatTile label="Ticket médio" value={formatCompactCurrency(ticketMedio)} />
        <StatTile label="Vendas fechadas (total)" value={String(allClosed.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Receita por semana ({period.label.toLowerCase()})</h2>
          {revenueByWeek.length > 0 ? (
            revenueByWeek.map(([week, value]) => (
              <div key={week} className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink">Semana {week}</span>
                <span className="tnum text-ink-soft">{formatCompactCurrency(value)}</span>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-ink-faint">Nenhuma venda fechada esse mês ainda.</p>
          )}
        </section>
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Vendas por produto (histórico)</h2>
          {byProduct.size > 0 ? (
            [...byProduct.entries()].map(([product, { count, value }]) => (
              <div key={product} className="flex items-center justify-between text-[12.5px]">
                <span className="text-ink">
                  {product} <span className="text-ink-faint">· {count}</span>
                </span>
                <span className="tnum text-ink-soft">{formatCompactCurrency(value)}</span>
              </div>
            ))
          ) : (
            <p className="text-[12px] text-ink-faint">Nenhuma venda registrada ainda.</p>
          )}
        </section>
      </div>

      {canEdit && (
        <CreateSocialLeadForm
          salespeople={allUsers.map((u) => ({ id: u.id, name: u.name }))}
        />
      )}

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[960px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Reunião</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Venda</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-border last:border-b-0">
                <td className="px-4 py-3 text-ink">{lead.leadName}</td>
                <td className="px-4 py-3 text-ink-soft">{lead.companyName ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{lead.contactPerson ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">{lead.salesperson?.name ?? "—"}</td>
                <td className="tnum px-4 py-3 text-ink-soft">
                  {lead.meetingDate ? formatDate(lead.meetingDate) : "—"}
                </td>
                <td className="px-4 py-3">
                  {canEdit ? (
                    <AutoSubmitSelect
                      action={updateSocialLeadStatusAction}
                      hiddenName="leadId"
                      hiddenValue={lead.id}
                      name="status"
                      defaultValue={lead.status}
                      options={Object.entries(SOCIAL_LEAD_STATUS_META).map(([key, meta]) => ({
                        value: key,
                        label: meta.label,
                      }))}
                    />
                  ) : (
                    <span className="text-ink-soft">{SOCIAL_LEAD_STATUS_META[lead.status].label}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <LeadSaleCell
                    leadId={lead.id}
                    saleProduct={lead.saleProduct}
                    saleValue={lead.saleValue}
                    saleDate={lead.saleDate}
                    canEdit={canEdit}
                  />
                </td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <form action={deleteSocialLeadAction}>
                      <input type="hidden" name="leadId" value={lead.id} />
                      <button className="text-[11.5px] text-critical hover:underline">Excluir</button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-faint">
                  Nenhum lead cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
