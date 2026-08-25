import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewCsDepartment } from "@/lib/permissions";
import { CsTabs } from "@/components/cs/cs-tabs";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { DonutChart } from "@/components/charts/donut-chart";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import {
  computeMrrArr,
  computeArpu,
  computeTicketMedio,
  computeMonthlyChurn,
  computeAnnualChurn,
  computeLtv,
  computeAverageTenureMonths,
  computeEnps,
  computeHealthScore,
  summarizeRenewals,
  buildAlerts,
  CHURN_ANNUAL_TARGET_PCT,
  HEALTH_TIER_META,
  type HealthTier,
} from "@/lib/cs";
import { formatCompactCurrency } from "@/lib/format";
import { createTaskFromAlertAction } from "@/lib/actions/cs";
import { MONTH_LABELS } from "@/lib/finance";

const YEAR = 2026;

export default async function CsDashboardPage({
  searchParams,
}: PageProps<"/cs">) {
  const user = await requireUser();
  if (!canViewCsDepartment(user)) notFound();
  const sp = await searchParams;
  const carteiraFilter = typeof sp.carteira === "string" ? sp.carteira : "";

  const [allCustomers, csReps, renewals, experiences, attendances, csTasks] =
    await Promise.all([
      prisma.customer.findMany({ include: { cs: true } }),
      prisma.membership.findMany({
        where: { area: { slug: "cs" } },
        include: { user: true },
      }),
      prisma.customerRenewal.findMany(),
      prisma.customerExperience.findMany(),
      prisma.eventAttendee.findMany({ where: { customerId: { not: null } } }),
      prisma.task.findMany({ where: { customerId: { not: null } } }),
    ]);

  const customers = carteiraFilter
    ? allCustomers.filter((c) => c.csId === carteiraFilter)
    : allCustomers;

  const now = new Date();

  // --- Mapas auxiliares por cliente (evita N+1) ---
  const attendancesByCustomer = new Map<string, typeof attendances>();
  for (const a of attendances) {
    if (!a.customerId) continue;
    attendancesByCustomer.set(a.customerId, [...(attendancesByCustomer.get(a.customerId) ?? []), a]);
  }
  const experienceScoresByCustomer = new Map<string, number[]>();
  const allExperienceScores: number[] = [];
  for (const e of experiences) {
    if (e.score === null) continue;
    experienceScoresByCustomer.set(e.customerId, [...(experienceScoresByCustomer.get(e.customerId) ?? []), e.score]);
    allExperienceScores.push(e.score);
  }
  const openHighPriorityByCustomer = new Map<string, number>();
  const overdueByCustomer = new Map<string, number>();
  for (const t of csTasks) {
    if (!t.customerId) continue;
    if (!["concluida", "cancelada"].includes(t.status) && ["alta", "urgente"].includes(t.priority)) {
      openHighPriorityByCustomer.set(t.customerId, (openHighPriorityByCustomer.get(t.customerId) ?? 0) + 1);
    }
    if (t.deadline < now && !["concluida", "cancelada"].includes(t.status)) {
      overdueByCustomer.set(t.customerId, (overdueByCustomer.get(t.customerId) ?? 0) + 1);
    }
  }

  const healthByCustomer = customers.map((c) => ({
    customer: c,
    health: computeHealthScore({
      now,
      customer: c,
      lastInteractionAt: c.lastContactAt,
      attendances: attendancesByCustomer.get(c.id) ?? [],
      experienceScores: experienceScoresByCustomer.get(c.id) ?? [],
      openHighPriorityTasks: openHighPriorityByCustomer.get(c.id) ?? 0,
    }),
  }));

  const tierCounts: Record<HealthTier, number> = { saudavel: 0, atencao: 0, risco: 0, sem_dados: 0 };
  for (const h of healthByCustomer) tierCounts[h.health.tier]++;

  // --- KPIs principais ---
  const active = customers.filter((c) => c.status === "ativo");
  const { mrr, arr } = computeMrrArr(customers);
  const arpu = computeArpu(customers);
  const ticketMedio = computeTicketMedio(customers);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  const monthlyChurn = computeMonthlyChurn(customers, monthStart, monthEnd);
  const annualChurn = computeAnnualChurn(customers, YEAR);
  const averageTenureMonths = computeAverageTenureMonths(customers, now);
  const ltv = computeLtv(arpu, averageTenureMonths);
  const newThisMonth = customers.filter((c) => c.entryDate >= monthStart && c.entryDate <= monthEnd).length;
  const renewalSummary = summarizeRenewals(renewals);
  const enps = computeEnps(allExperienceScores);

  const annualChurnStatus =
    annualChurn.pct === null ? null : annualChurn.pct <= CHURN_ANNUAL_TARGET_PCT ? "🟢" : annualChurn.pct <= CHURN_ANNUAL_TARGET_PCT * 1.5 ? "🟡" : "🔴";

  // --- Distribuição por produto ---
  const byProduct = new Map<string, number>();
  for (const c of active) byProduct.set(c.product, (byProduct.get(c.product) ?? 0) + 1);
  const donutData = [...byProduct.entries()].map(([label, value]) => ({ label, value }));

  // --- Novos x churn mensal (ano inteiro) ---
  const monthlyNovos: number[] = [];
  const monthlyChurnCounts: number[] = [];
  for (let m = 0; m < 12; m++) {
    const mStart = new Date(YEAR, m, 1);
    const mEnd = new Date(YEAR, m + 1, 0, 23, 59, 59);
    monthlyNovos.push(customers.filter((c) => c.entryDate >= mStart && c.entryDate <= mEnd).length);
    monthlyChurnCounts.push(computeMonthlyChurn(customers, mStart, mEnd).churned);
  }

  // --- Renovações mensais (ano inteiro) ---
  const renewalsPlanned: number[] = [];
  const renewalsRealized: number[] = [];
  for (let m = 0; m < 12; m++) {
    const mStart = new Date(YEAR, m, 1);
    const mEnd = new Date(YEAR, m + 1, 0, 23, 59, 59);
    const inMonth = renewals.filter((r) => r.dueDate >= mStart && r.dueDate <= mEnd);
    const s = summarizeRenewals(inMonth);
    renewalsPlanned.push(s.planned);
    renewalsRealized.push(s.realized);
  }

  // --- Performance por carteira ---
  const carteiras = [
    { id: "", name: "Geral" },
    ...csReps.map((m) => ({ id: m.userId, name: m.user.name })),
  ];

  // --- eNPS por carteira ---
  const enpsByCarteira = csReps.map((m) => {
    const scores = experiences
      .filter((e) => e.score !== null && allCustomers.find((c) => c.id === e.customerId)?.csId === m.userId)
      .map((e) => e.score as number);
    return { name: m.user.name, enps: computeEnps(scores) };
  });

  // --- Alertas ---
  const lastInteractionMap = new Map(customers.filter((c) => c.lastContactAt).map((c) => [c.id, c.lastContactAt as Date]));
  const alerts = buildAlerts({
    now,
    customers: customers
      .filter((c) => c.status !== "cancelado")
      .map((c) => ({
        id: c.id,
        name: c.name,
        renewalDate: c.renewalDate,
        contractUrl: c.contractUrl,
        csId: c.csId,
        healthTier: healthByCustomer.find((h) => h.customer.id === c.id)?.health.tier ?? "sem_dados",
      })),
    lastInteractionByCustomer: lastInteractionMap,
    overdueTasksByCustomer: overdueByCustomer,
  });
  const criticalAlerts = alerts.filter((a) => a.severity === "critico");

  // --- Insights ---
  const in60 = new Date(now.getTime() + 60 * 86400000);
  const renewingSoon = customers.filter((c) => c.renewalDate && c.renewalDate >= now && c.renewalDate <= in60).length;
  const in90 = new Date(now.getTime() + 90 * 86400000);
  const availableIn90 = renewals
    .filter((r) => r.status === "disponivel" && r.dueDate >= now && r.dueDate <= in90)
    .reduce((s, r) => s + r.plannedValue, 0);
  const riskCount = tierCounts.risco;
  const insights: string[] = [];
  if (renewingSoon > 0) insights.push(`${renewingSoon} cliente${renewingSoon > 1 ? "s" : ""} entram em janela de renovação nos próximos 60 dias.`);
  if (riskCount > 0) insights.push(`${riskCount} cliente${riskCount > 1 ? "s" : ""} apresenta${riskCount > 1 ? "m" : ""} risco elevado de churn.`);
  if (availableIn90 > 0) insights.push(`${formatCompactCurrency(availableIn90)} estão disponíveis para renovação nos próximos 90 dias.`);
  const bestEnps = enpsByCarteira.filter((e) => e.enps).sort((a, b) => (b.enps?.score ?? -999) - (a.enps?.score ?? -999))[0];
  if (bestEnps?.enps && enps && bestEnps.enps.score > enps.score) {
    insights.push(`A carteira da ${bestEnps.name} apresenta eNPS superior à média geral.`);
  }

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Cliente satisfeito é a prova real do que entregamos."
        subtitle="Renovação não se pede — se conquista, mentoria após mentoria, resultado após resultado."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Customer Success
          </h1>
          <p className="max-w-[62ch] text-[13px] text-ink-soft">
            A base de mentorados é a fonte única de verdade — todo indicador
            abaixo é calculado ao vivo a partir dela.
          </p>
        </div>
      </div>

      <CsTabs />

      {insights.length > 0 && (
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-gold bg-gold-tint/40 p-4">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.05em] text-gold-ink">
            O que a base está dizendo
          </h2>
          <ul className="flex flex-col gap-1">
            {insights.map((text, i) => (
              <li key={i} className="text-[13px] text-ink">
                • {text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* KPIs principais */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Mentorados ativos</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">{active.length}</p>
          <p className="text-[11px] text-ink-faint">{newThisMonth} novos este mês</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Churn mensal</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {monthlyChurn.pct !== null ? `${monthlyChurn.pct.toFixed(1)}%` : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">{monthlyChurn.churned} de {monthlyChurn.eligible} elegíveis</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Churn anual · target &lt;{CHURN_ANNUAL_TARGET_PCT}%</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {annualChurnStatus} {annualChurn.pct !== null ? `${annualChurn.pct.toFixed(1)}%` : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">{annualChurn.churned} saídas em {YEAR}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">eNPS geral</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {enps ? enps.score : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            {enps ? `${enps.responses} respostas` : "sem respostas ainda"}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">MRR</p>
          <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">{formatCompactCurrency(mrr)}</p>
          <p className="text-[11px] text-ink-faint">ARR {formatCompactCurrency(arr)}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">ARPU</p>
          <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">
            {arpu !== null ? formatCompactCurrency(arpu) : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            Ticket médio {ticketMedio !== null ? formatCompactCurrency(ticketMedio) : "—"}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">LTV</p>
          <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">
            {ltv !== null ? formatCompactCurrency(ltv) : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            ARPU × {averageTenureMonths !== null ? `${averageTenureMonths.toFixed(1)} meses (permanência média)` : "—"}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Taxa de renovação (ano)</p>
          <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">
            {renewalSummary.pct !== null ? `${renewalSummary.pct.toFixed(0)}%` : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            {formatCompactCurrency(renewalSummary.realized)} / {formatCompactCurrency(renewalSummary.planned)}
          </p>
        </div>
      </section>

      {/* Distribuição por produto */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">Mentorados por produto</h2>
          <DonutChart data={donutData} formatValue={(v) => `${v}`} />
        </section>

        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">Health Score da carteira</h2>
          <div className="flex flex-col gap-2">
            {(["saudavel", "atencao", "risco", "sem_dados"] as HealthTier[]).map((tier) => (
              <Link
                key={tier}
                href={`/cs/mentorados?health=${tier}${carteiraFilter ? `&carteira=${carteiraFilter}` : ""}`}
                className="flex items-center justify-between rounded-(--radius-s) bg-surface-muted px-3 py-2 hover:bg-border-strong/20"
              >
                <span className="text-[12.5px] text-ink">{HEALTH_TIER_META[tier].label}</span>
                <span className="tnum text-[13px] font-medium text-ink">{tierCounts[tier]}</span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      {/* Novos x Churn */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">Novos mentorados × Churn — {YEAR}</h2>
        <GroupedBarChart
          categories={MONTH_LABELS.map((m) => m.slice(0, 3))}
          series={[
            { label: "Novos", values: monthlyNovos },
            { label: "Churn", values: monthlyChurnCounts },
          ]}
          formatValue={(v) => `${v}`}
        />
      </section>

      {/* Renovações */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium text-ink-soft">Renovações — {YEAR}</h2>
          <span className="text-[12px] text-ink-faint">
            Em aberto: {formatCompactCurrency(renewalSummary.open)}
          </span>
        </div>
        <GroupedBarChart
          categories={MONTH_LABELS.map((m) => m.slice(0, 3))}
          series={[
            { label: "Disponível", values: renewalsPlanned },
            { label: "Realizado", values: renewalsRealized },
          ]}
          formatValue={formatCompactCurrency}
        />
      </section>

      {/* Performance por carteira */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">Performance das carteiras</h2>
        <div className="flex flex-wrap gap-1.5">
          {carteiras.map((c) => (
            <Link
              key={c.id || "geral"}
              href={c.id ? `/cs?carteira=${c.id}` : "/cs"}
              className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors ${
                carteiraFilter === c.id
                  ? "bg-brand-deep text-gold-soft"
                  : "border border-border bg-surface text-ink-soft hover:bg-surface-muted"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-(--radius-l) border border-border bg-surface p-5 sm:grid-cols-4">
          <div>
            <p className="text-[11px] text-ink-faint">Clientes</p>
            <p className="tnum text-[16px] font-medium text-ink">{customers.length}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-faint">MRR</p>
            <p className="tnum text-[16px] font-medium text-ink">{formatCompactCurrency(mrr)}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-faint">Churn (mês)</p>
            <p className="tnum text-[16px] font-medium text-ink">{monthlyChurn.pct !== null ? `${monthlyChurn.pct.toFixed(1)}%` : "—"}</p>
          </div>
          <div>
            <p className="text-[11px] text-ink-faint">Em risco</p>
            <p className="tnum text-[16px] font-medium text-ink">{tierCounts.risco}</p>
          </div>
        </div>
      </section>

      {/* eNPS por carteira */}
      {enpsByCarteira.length > 0 && (
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">eNPS por carteira</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {enpsByCarteira.map((e) => (
              <div key={e.name} className="flex items-center justify-between rounded-(--radius-s) bg-surface-muted px-3 py-2.5">
                <span className="text-[13px] text-ink">{e.name}</span>
                <span className="tnum text-[13px] font-medium text-ink">
                  {e.enps ? `${e.enps.score} (${e.enps.responses})` : "sem dados"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Alertas */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Alertas ({alerts.length}) · {criticalAlerts.length} críticos
          </h2>
          <Link href="/cs/mentorados" className="text-[12px] font-medium text-brand hover:underline">
            Ver base completa →
          </Link>
        </div>
        <div className="flex flex-col">
          {alerts.slice(0, 12).map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
              <div className="flex items-center gap-2.5">
                <span className={`h-2 w-2 rounded-full ${a.severity === "critico" ? "bg-critical" : "bg-warning"}`} />
                <Link href={`/cs/mentorados/${a.customerId}`} className="text-[13px] text-ink hover:underline">
                  {a.customerName}
                </Link>
                <span className="text-[12.5px] text-ink-faint">{a.message}</span>
              </div>
              <form action={createTaskFromAlertAction}>
                <input type="hidden" name="customerId" value={a.customerId} />
                <input type="hidden" name="title" value={a.message} />
                <button className="text-[11.5px] font-medium text-brand hover:underline">
                  Criar tarefa
                </button>
              </form>
            </div>
          ))}
          {alerts.length === 0 && (
            <p className="py-3 text-[13px] text-ink-faint">Nenhum alerta no momento.</p>
          )}
        </div>
      </section>
    </>
  );
}
