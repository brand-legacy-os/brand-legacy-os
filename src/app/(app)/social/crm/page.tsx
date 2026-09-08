import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { monthKey, periodKeyLabel } from "@/lib/finance";
import { SocialTabs } from "@/components/social/social-tabs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { CreateSocialLeadForm } from "@/components/social/create-social-lead-form";
import { LeadSaleCell } from "@/components/social/lead-sale-cell";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { updateSocialLeadStatusAction, deleteSocialLeadAction } from "@/lib/actions/social";
import { SOCIAL_LEAD_STATUS_META } from "@/lib/social";
import { StatTile } from "@/components/dashboard/stat-tile";
import { TrendChart } from "@/components/finance/trend-chart";
import { formatDate, formatCompactCurrency } from "@/lib/format";
import { notFound } from "next/navigation";
import { CultureBanner } from "@/components/dashboard/culture-banner";

function lastNMonthKeys(n: number, endKey: string) {
  const [y, m] = endKey.split("-").map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) keys.push(monthKey(new Date(y, m - 1 - i, 1)));
  return keys;
}

export default async function SocialCrmPage({
  searchParams,
}: PageProps<"/social/crm">) {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const canEdit = canEditAreaKpis(user, "social");
  const sp = await searchParams;

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const [leads, allUsers] = await Promise.all([
    prisma.socialSellingLead.findMany({
      include: { salesperson: true },
      orderBy: { meetingDate: "desc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  // --- Card do período filtrado ---
  const leadsInPeriod = leads.filter((l) => l.createdAt >= period.start && l.createdAt <= period.end);
  const closedInPeriod = leads.filter(
    (l) => l.saleValue && l.saleDate && l.saleDate >= period.start && l.saleDate <= period.end
  );
  const revenuePeriod = closedInPeriod.reduce((s, l) => s + (l.saleValue ?? 0), 0);
  const ticketPeriod = closedInPeriod.length > 0 ? revenuePeriod / closedInPeriod.length : 0;

  // --- Mês a mês no ano da data filtrada ---
  const year = period.start.getFullYear();
  const monthsOfYear = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const inMonth = (d: Date, mk: string) => monthKey(d) === mk;

  const revenueByMonth = monthsOfYear.map((mk) => ({
    label: periodKeyLabel(mk).slice(0, 3),
    value: leads.filter((l) => l.saleValue && l.saleDate && inMonth(l.saleDate, mk)).reduce((s, l) => s + (l.saleValue ?? 0), 0),
  }));
  const salesByMonth = monthsOfYear.map((mk) => ({
    label: periodKeyLabel(mk).slice(0, 3),
    value: leads.filter((l) => l.saleValue && l.saleDate && inMonth(l.saleDate, mk)).length,
  }));
  const ticketByMonth = monthsOfYear.map((mk, i) => ({
    label: revenueByMonth[i].label,
    value: salesByMonth[i].value > 0 ? revenueByMonth[i].value / salesByMonth[i].value : 0,
  }));
  const leadsByMonth = monthsOfYear.map((mk) => ({
    label: periodKeyLabel(mk).slice(0, 3),
    value: leads.filter((l) => inMonth(l.createdAt, mk)).length,
  }));

  // --- Receita por semana + leads por semana, dentro do período filtrado ---
  const weekOf = (d: Date) => Math.ceil(d.getDate() / 7);
  const revenueByWeek = new Map<number, number>();
  for (const l of closedInPeriod) {
    const w = weekOf(new Date(l.saleDate!));
    revenueByWeek.set(w, (revenueByWeek.get(w) ?? 0) + (l.saleValue ?? 0));
  }
  const leadsByWeek = new Map<number, number>();
  for (const l of leadsInPeriod) {
    const w = weekOf(l.createdAt);
    leadsByWeek.set(w, (leadsByWeek.get(w) ?? 0) + 1);
  }

  // --- Vendas por produto — período filtrado + mês a mês no ano ---
  const closedInYear = leads.filter((l) => l.saleValue && l.saleDate && l.saleDate.getFullYear() === year);
  const productsSet = [...new Set(closedInYear.map((l) => l.saleProduct ?? "Outro"))];
  const byProductPeriod = new Map<string, { count: number; value: number }>();
  for (const l of closedInPeriod) {
    const key = l.saleProduct ?? "Outro";
    const entry = byProductPeriod.get(key) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += l.saleValue ?? 0;
    byProductPeriod.set(key, entry);
  }
  const productByMonth = productsSet.map((product) => ({
    product,
    months: monthsOfYear.map(
      (mk) =>
        closedInYear
          .filter((l) => l.saleProduct === product || (!l.saleProduct && product === "Outro"))
          .filter((l) => inMonth(l.saleDate!, mk))
          .reduce((s, l) => s + (l.saleValue ?? 0), 0)
    ),
  }));

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Marca forte não acontece por acaso — se constrói todo dia."
        subtitle="Consistência, autenticidade e presença — cada post é um tijolo na autoridade da marca."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Social
          </h1>
          <p className="max-w-[62ch] text-[13px] text-ink-soft">
            Funil de Social Selling — pipeline de leads e vendas fechadas por
            esse canal. Os leads são cadastrados aqui por enquanto; os números
            deste dashboard virão futuramente direto do CRM.
          </p>
        </div>
        <FilterBar areaOptions={[]} responsibleOptions={[]} />
      </div>

      <SocialTabs />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label={`Receita gerada (${period.label.toLowerCase()})`} value={formatCompactCurrency(revenuePeriod)} />
        <StatTile label={`Ticket médio (${period.label.toLowerCase()})`} value={formatCompactCurrency(ticketPeriod)} />
        <StatTile label={`Vendas fechadas (${period.label.toLowerCase()})`} value={String(closedInPeriod.length)} />
        <StatTile label={`Leads gerados (${period.label.toLowerCase()})`} value={String(leadsInPeriod.length)} />
        <StatTile label="Ano de referência" value={String(year)} />
        <StatTile label="Vendas fechadas (ano)" value={String(closedInYear.length)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Receita — mês a mês ({year})</h2>
          <TrendChart points={revenueByMonth} formatValue={formatCompactCurrency} />
        </section>
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Vendas fechadas — mês a mês ({year})</h2>
          <TrendChart points={salesByMonth} formatValue={(v) => String(Math.round(v))} />
        </section>
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Ticket médio — mês a mês ({year})</h2>
          <TrendChart points={ticketByMonth} formatValue={formatCompactCurrency} />
        </section>
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Leads gerados — mês a mês ({year})</h2>
          <TrendChart points={leadsByMonth} formatValue={(v) => String(Math.round(v))} />
        </section>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Receita por semana ({period.label.toLowerCase()})</h2>
          {[...revenueByWeek.entries()].sort(([a], [b]) => a - b).map(([week, value]) => (
            <div key={week} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink">Semana {week}</span>
              <span className="tnum text-ink-soft">{formatCompactCurrency(value)}</span>
            </div>
          ))}
          {revenueByWeek.size === 0 && <p className="text-[12px] text-ink-faint">Nenhuma venda fechada nesse período.</p>}
        </section>
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Leads gerados por semana ({period.label.toLowerCase()})</h2>
          {[...leadsByWeek.entries()].sort(([a], [b]) => a - b).map(([week, value]) => (
            <div key={week} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink">Semana {week}</span>
              <span className="tnum text-ink-soft">{value}</span>
            </div>
          ))}
          {leadsByWeek.size === 0 && <p className="text-[12px] text-ink-faint">Nenhum lead gerado nesse período.</p>}
        </section>
      </div>

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[12.5px] font-medium text-ink-soft">
          Vendas por produto ({period.label.toLowerCase()})
        </h2>
        {[...byProductPeriod.entries()].map(([product, { count, value }]) => (
          <div key={product} className="flex items-center justify-between text-[12.5px]">
            <span className="text-ink">
              {product} <span className="text-ink-faint">· {count}</span>
            </span>
            <span className="tnum text-ink-soft">{formatCompactCurrency(value)}</span>
          </div>
        ))}
        {byProductPeriod.size === 0 && <p className="text-[12px] text-ink-faint">Nenhuma venda nesse período.</p>}
      </section>

      {productByMonth.length > 0 && (
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[12.5px] font-medium text-ink-soft">Vendas por produto — mês a mês ({year})</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-border text-left text-ink-faint">
                  <th className="py-2 pr-3 font-medium">Produto</th>
                  {monthsOfYear.map((mk) => (
                    <th key={mk} className="px-2 py-2 text-right font-medium">
                      {periodKeyLabel(mk).slice(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productByMonth.map((row) => (
                  <tr key={row.product} className="border-b border-border last:border-b-0">
                    <td className="py-2 pr-3 text-ink">{row.product}</td>
                    {row.months.map((v, i) => (
                      <td key={i} className="tnum px-2 py-2 text-right text-ink-soft">
                        {v > 0 ? formatCompactCurrency(v) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

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
