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
    prisma.sponsor.findMany({ include: { installments: true, event: { select: { startDate: true } } } }),
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

  // Recebido x Aberto mês a mês no ano selecionado. Recebido usa o mês em que
  // a parcela foi de fato PAGA (paidDate) — não o vencimento — porque é isso
  // que "recebido" significa; aberto (ainda não pago) usa o vencimento, já
  // que é quando o dinheiro é esperado. À vista não tem parcela pra ancorar —
  // usa a data do evento vinculado (é quando o patrocínio "acontece" de
  // fato), caindo pra createdAt só quando não há evento (anual/recorrente).
  const recebidoPorMes = Array(12).fill(0);
  const abertoPorMes = Array(12).fill(0);
  for (const s of sponsors) {
    if (s.paymentPlan === "parcelado") {
      for (const inst of s.installments) {
        if (inst.paid) {
          const paidDate = inst.paidDate ?? inst.dueDate;
          if (paidDate.getFullYear() === year) recebidoPorMes[paidDate.getMonth()] += inst.amount;
        } else if (inst.dueDate.getFullYear() === year) {
          abertoPorMes[inst.dueDate.getMonth()] += inst.amount;
        }
      }
    } else {
      const anchorDate = s.event?.startDate ?? s.createdAt;
      if (anchorDate.getFullYear() !== year) continue;
      const m = anchorDate.getMonth();
      const paid = sponsorPaidValue(s);
      recebidoPorMes[m] += paid;
      abertoPorMes[m] += s.totalValue - paid;
    }
  }

  // Agrupa por nome — o mesmo patrocinador costuma ter uma ficha por
  // evento/ano, então ranking por ficha individual sub-conta quem patrocina
  // mais de uma vez. Nome é normalizado (trim + minúsculo) só pra bater
  // "Empresa X" com " empresa x ", mas o label exibido usa a grafia original.
  const byName = new Map<string, { name: string; totalValue: number; paid: number; count: number }>();
  for (const s of sponsors) {
    const key = s.name.trim().toLowerCase();
    const cur = byName.get(key) ?? { name: s.name.trim(), totalValue: 0, paid: 0, count: 0 };
    cur.totalValue += s.totalValue;
    cur.paid += sponsorPaidValue(s);
    cur.count += 1;
    byName.set(key, cur);
  }
  const ranking = [...byName.values()]
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
          {ranking.map((s, i) => (
            <div
              key={s.name}
              className="flex items-center gap-3 rounded-(--radius-s) bg-surface-muted px-3 py-2"
            >
              <span className="tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-tint text-[11px] font-semibold text-gold-ink">
                {i + 1}º
              </span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12.5px] font-medium text-ink">{s.name}</span>
                <span className="text-[11px] text-ink-faint">
                  Recebido: {formatCompactCurrency(s.paid)}
                  {s.count > 1 ? ` · ${s.count} fichas` : ""}
                </span>
              </div>
              <span className="tnum shrink-0 text-[13px] font-medium text-ink">{formatCompactCurrency(s.totalValue)}</span>
            </div>
          ))}
          {ranking.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhum patrocinador cadastrado ainda.</p>
          )}
        </div>
      </section>
    </>
  );
}
