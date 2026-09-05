import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewCsDepartment } from "@/lib/permissions";
import { CsTabs } from "@/components/cs/cs-tabs";
import { CreateCustomerForm } from "@/components/cs/create-customer-form";
import {
  CUSTOMER_STATUS_META,
  computeHealthScore,
  HEALTH_TIER_META,
  type HealthTier,
} from "@/lib/cs";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { StatusPill } from "@/components/ui/status-pill";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function CsMentoradosPage({
  searchParams,
}: PageProps<"/cs/mentorados">) {
  const user = await requireUser();
  if (!canViewCsDepartment(user)) notFound();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const productFilter = typeof sp.produto === "string" ? sp.produto : "";
  const carteiraFilter = typeof sp.carteira === "string" ? sp.carteira : "";
  const statusFilter = typeof sp.status === "string" ? sp.status : "";
  const healthFilter = typeof sp.health === "string" ? sp.health : "";

  const [allCustomers, csReps, attendances, experiences, tasks] = await Promise.all([
    prisma.customer.findMany({ include: { cs: true }, orderBy: { name: "asc" } }),
    prisma.membership.findMany({ where: { area: { slug: "cs" } }, include: { user: true } }),
    prisma.eventAttendee.findMany({ where: { customerId: { not: null } } }),
    prisma.customerExperience.findMany(),
    prisma.task.findMany({ where: { customerId: { not: null } } }),
  ]);

  const now = new Date();
  const attendancesByCustomer = new Map<string, typeof attendances>();
  for (const a of attendances) {
    if (!a.customerId) continue;
    attendancesByCustomer.set(a.customerId, [...(attendancesByCustomer.get(a.customerId) ?? []), a]);
  }
  const experienceScoresByCustomer = new Map<string, number[]>();
  for (const e of experiences) {
    if (e.score === null) continue;
    experienceScoresByCustomer.set(e.customerId, [...(experienceScoresByCustomer.get(e.customerId) ?? []), e.score]);
  }
  const openHighByCustomer = new Map<string, number>();
  for (const t of tasks) {
    if (!t.customerId) continue;
    if (!["concluida", "cancelada"].includes(t.status) && ["alta", "urgente"].includes(t.priority)) {
      openHighByCustomer.set(t.customerId, (openHighByCustomer.get(t.customerId) ?? 0) + 1);
    }
  }

  const rows = allCustomers.map((c) => ({
    customer: c,
    health: computeHealthScore({
      now,
      customer: c,
      lastInteractionAt: c.lastContactAt,
      attendances: attendancesByCustomer.get(c.id) ?? [],
      experienceScores: experienceScoresByCustomer.get(c.id) ?? [],
      openHighPriorityTasks: openHighByCustomer.get(c.id) ?? 0,
    }),
  }));

  const filtered = rows.filter(({ customer, health }) => {
    if (q && !customer.name.toLowerCase().includes(q) && !(customer.company ?? "").toLowerCase().includes(q)) return false;
    if (productFilter && customer.product !== productFilter) return false;
    if (carteiraFilter && customer.csId !== carteiraFilter) return false;
    if (statusFilter && customer.status !== statusFilter) return false;
    if (healthFilter && health.tier !== healthFilter) return false;
    return true;
  });

  const products = [...new Set(allCustomers.map((c) => c.product))];

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
          <p className="text-[13px] text-ink-soft">
            Base de mentorados — fonte única de verdade do departamento.
          </p>
        </div>
        <CreateCustomerForm csReps={csReps.map((m) => ({ id: m.userId, name: m.user.name }))} />
      </div>

      <CsTabs />

      <form className="flex flex-wrap items-center gap-2.5" method="get">
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por nome ou empresa…"
          className="h-9 min-w-[200px] flex-1 rounded-full border border-border bg-surface px-4 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <select name="produto" defaultValue={productFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Todos os produtos</option>
          {products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select name="carteira" defaultValue={carteiraFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Todos os CS</option>
          {csReps.map((m) => (
            <option key={m.userId} value={m.userId}>{m.user.name}</option>
          ))}
        </select>
        <select name="status" defaultValue={statusFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Todos os status</option>
          {Object.entries(CUSTOMER_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>
        <select name="health" defaultValue={healthFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Todo Health Score</option>
          {(["saudavel", "atencao", "risco", "sem_dados"] as HealthTier[]).map((t) => (
            <option key={t} value={t}>{HEALTH_TIER_META[t].label}</option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-full bg-surface-muted px-4 text-[12.5px] font-medium text-ink-soft hover:bg-border-strong/40">
          Filtrar
        </button>
      </form>

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[960px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">CS</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">MRR</th>
              <th className="px-4 py-3 font-medium">Renovação</th>
              <th className="px-4 py-3 font-medium">Health</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(({ customer: c, health }) => (
              <tr key={c.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted">
                <td className="px-4 py-3">
                  <Link href={`/cs/mentorados/${c.id}`} className="font-medium text-ink hover:text-brand-deep hover:underline">
                    {c.name}
                  </Link>
                  {c.company && <p className="text-[11.5px] text-ink-faint">{c.company}</p>}
                </td>
                <td className="px-4 py-3 text-ink-soft">{c.product}</td>
                <td className="px-4 py-3 text-ink-soft">{c.cs.name}</td>
                <td className="px-4 py-3">
                  <span className="text-ink-soft">{CUSTOMER_STATUS_META[c.status].label}</span>
                </td>
                <td className="tnum px-4 py-3 text-ink-soft">{c.mrr ? formatCompactCurrency(c.mrr) : "—"}</td>
                <td className="tnum px-4 py-3 text-ink-soft">{c.renewalDate ? formatDate(c.renewalDate) : "—"}</td>
                <td className="px-4 py-3">
                  <StatusPill
                    label={HEALTH_TIER_META[health.tier].label}
                    tone={health.tier === "saudavel" ? "positive" : health.tier === "atencao" ? "warning" : health.tier === "risco" ? "critical" : "neutral"}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link href={`/cs/mentorados/${c.id}`} className="text-[12px] font-medium text-brand hover:underline">
                    Abrir →
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-ink-faint">
                  Nenhum mentorado encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
