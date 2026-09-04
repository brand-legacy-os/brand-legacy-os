import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewSponsors, canManageSponsors } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { formatCompactCurrency, formatCurrency } from "@/lib/format";
import { sponsorPaidValue, sponsorshipGoalFor } from "@/lib/sponsors";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { PatrociniosTabs } from "@/components/patrocinios/patrocinios-tabs";
import { CreateSponsorForm } from "@/components/patrocinios/create-sponsor-form";

const MONTH_LABELS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default async function PatrociniosPage({
  searchParams,
}: PageProps<"/patrocinios">) {
  const user = await requireUser();
  if (!canViewSponsors(user)) notFound();
  const sp = await searchParams;
  const canManage = canManageSponsors(user);

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);
  const year = Number(sp.ano as string) || new Date().getFullYear();

  const [sponsors, events, imersoes] = await Promise.all([
    prisma.sponsor.findMany({ include: { installments: true } }),
    prisma.event.findMany({ orderBy: { startDate: "desc" }, select: { id: true, name: true } }),
    prisma.event.findMany({
      where: { type: "Imersão" },
      orderBy: { startDate: "asc" },
      select: { id: true, name: true, budgetPlanned: true, sponsors: { select: { totalValue: true } } },
    }),
  ]);

  const inPeriod = sponsors.filter(
    (s) => s.createdAt >= period.start && s.createdAt <= period.end
  );
  const totalContratado = inPeriod.reduce((s, sp) => s + sp.totalValue, 0);
  const totalRecebido = inPeriod.reduce((s, sp) => s + sponsorPaidValue(sp), 0);

  // Recebido x Aberto mês a mês no ano selecionado.
  const recebidoPorMes = Array(12).fill(0);
  const abertoPorMes = Array(12).fill(0);
  for (const s of sponsors) {
    if (s.paymentPlan === "parcelado") {
      for (const inst of s.installments) {
        if (inst.dueDate.getFullYear() !== year) continue;
        const m = inst.dueDate.getMonth();
        if (inst.paid) recebidoPorMes[m] += inst.amount;
        else abertoPorMes[m] += inst.amount;
      }
    } else if (s.createdAt.getFullYear() === year) {
      const m = s.createdAt.getMonth();
      const paid = sponsorPaidValue(s);
      recebidoPorMes[m] += paid;
      abertoPorMes[m] += s.totalValue - paid;
    }
  }

  const ranking = [...sponsors]
    .map((s) => ({ ...s, paid: sponsorPaidValue(s) }))
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 8);

  const imersaoChart = imersoes.map((e) => ({
    name: e.name,
    contratado: e.sponsors.reduce((s, sp) => s + sp.totalValue, 0),
    meta: sponsorshipGoalFor(e.budgetPlanned),
  }));

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Patrocínios
        </h1>
      </div>

      <PatrociniosTabs />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterBar areaOptions={[]} responsibleOptions={[]} />
        {canManage && <CreateSponsorForm events={events} />}
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Total contratado · {period.label.toLowerCase()}</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {formatCurrency(totalContratado)}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Total recebido · {period.label.toLowerCase()}</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-positive">
            {formatCurrency(totalRecebido)}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium text-ink-soft">Recebido x Aberto — mês a mês</h2>
          <div className="flex items-center gap-1.5">
            {[year - 1, year, year + 1].map((y) => (
              <Link
                key={y}
                href={`/patrocinios?${new URLSearchParams({ ...(sp as Record<string, string>), ano: String(y) }).toString()}`}
                className={`rounded-full px-3 py-1 text-[12px] font-medium ${
                  y === year ? "bg-brand-deep text-gold-soft" : "bg-surface-muted text-ink-soft"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>
        <GroupedBarChart
          categories={MONTH_LABELS}
          series={[
            { label: "Recebido", values: recebidoPorMes },
            { label: "Aberto", values: abertoPorMes },
          ]}
          formatValue={formatCompactCurrency}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">Patrocínio por imersão — contratado × meta</h2>
        {imersaoChart.length > 0 ? (
          <GroupedBarChart
            categories={imersaoChart.map((e) => e.name)}
            series={[
              { label: "Contratado", values: imersaoChart.map((e) => e.contratado) },
              { label: "Meta", values: imersaoChart.map((e) => e.meta) },
            ]}
            formatValue={formatCompactCurrency}
          />
        ) : (
          <p className="text-[12.5px] text-ink-faint">Nenhuma Imersão cadastrada ainda.</p>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">Ranking de maiores patrocinadores</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ranking.map((s) => (
            <Link
              key={s.id}
              href={`/patrocinios/${s.id}`}
              className="flex items-center justify-between rounded-(--radius-s) bg-surface-muted px-3 py-2 hover:bg-border/30"
            >
              <div className="flex flex-col">
                <span className="text-[12.5px] font-medium text-ink">{s.name}</span>
                <span className="text-[11px] text-ink-faint">Recebido: {formatCompactCurrency(s.paid)}</span>
              </div>
              <span className="tnum text-[13px] font-medium text-ink">{formatCompactCurrency(s.totalValue)}</span>
            </Link>
          ))}
          {ranking.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhum patrocinador cadastrado ainda.</p>
          )}
        </div>
      </section>
    </>
  );
}
