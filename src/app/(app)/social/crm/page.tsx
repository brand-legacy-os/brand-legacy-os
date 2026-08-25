import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { resolvePeriod } from "@/lib/period";
import { computeKpiSnapshot } from "@/lib/kpi";
import { SocialTabs } from "@/components/social/social-tabs";
import { CreateSocialLeadForm } from "@/components/social/create-social-lead-form";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { updateSocialLeadStatusAction, deleteSocialLeadAction } from "@/lib/actions/social";
import { SOCIAL_LEAD_STATUS_META } from "@/lib/social";
import { formatDate, formatCompactCurrency } from "@/lib/format";
import { notFound } from "next/navigation";

export default async function SocialCrmPage() {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const canEdit = canEditAreaKpis(user, "social");

  const [leads, allUsers, receitaKpi] = await Promise.all([
    prisma.socialSellingLead.findMany({
      include: { salesperson: true },
      orderBy: { meetingDate: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.kpi.findFirst({
      where: { area: { slug: "comercial" }, name: "Receita" },
      include: { entries: true, targets: true },
    }),
  ]);

  const period = resolvePeriod("mes");
  const receitaSnapshot = receitaKpi
    ? computeKpiSnapshot(receitaKpi, receitaKpi.entries, period, receitaKpi.targets)
    : null;

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Social
        </h1>
        <p className="max-w-[62ch] text-[13px] text-ink-soft">
          Funil de Social Selling — pipeline de leads. O valor de venda
          fechado não é lançado aqui: vem ao vivo do Comercial, para não
          duplicar a fonte da receita.
        </p>
      </div>

      <SocialTabs />

      <div className="rounded-(--radius-l) border border-border bg-surface p-4">
        <p className="text-[12px] text-ink-soft">Receita do mês (Comercial, ao vivo)</p>
        <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">
          {receitaSnapshot?.hasData ? formatCompactCurrency(receitaSnapshot.value) : "—"}
        </p>
        <p className="text-[11px] text-ink-faint">
          {period.label} · fonte: KPI Receita do Comercial
        </p>
      </div>

      {canEdit && (
        <CreateSocialLeadForm
          salespeople={allUsers.map((u) => ({ id: u.id, name: u.name }))}
        />
      )}

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[820px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">Lead</th>
              <th className="px-4 py-3 font-medium">Empresa</th>
              <th className="px-4 py-3 font-medium">Contato</th>
              <th className="px-4 py-3 font-medium">Vendedor</th>
              <th className="px-4 py-3 font-medium">Reunião</th>
              <th className="px-4 py-3 font-medium">Status</th>
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
                <td colSpan={7} className="px-4 py-8 text-center text-ink-faint">
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
