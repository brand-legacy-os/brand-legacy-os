import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewArea } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { SocialTabs } from "@/components/social/social-tabs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { notFound } from "next/navigation";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function SocialColaboradoresPage({
  searchParams,
}: PageProps<"/social/colaboradores">) {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const sp = await searchParams;

  const area = await prisma.area.findUnique({
    where: { slug: "social" },
    include: { memberships: { include: { user: true } } },
  });
  if (!area) notFound();

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const tasks = await prisma.task.findMany({
    where: { areaId: area.id },
    include: { assignee: true },
  });

  type Row = { planejado: number; realizado: number };
  const byPerson = new Map<string, { name: string; seat: string; categories: Map<string, Row>; total: Row }>();

  for (const m of area.memberships) {
    byPerson.set(m.userId, {
      name: m.user.name,
      seat: m.title,
      categories: new Map(),
      total: { planejado: 0, realizado: 0 },
    });
  }

  for (const t of tasks) {
    const entry = byPerson.get(t.assigneeId);
    if (!entry) continue;
    const category = t.product ?? "Sem categoria";

    const plannedInPeriod = t.deadline >= period.start && t.deadline <= period.end;
    const completedInPeriod =
      t.status === "concluida" &&
      t.completedAt &&
      t.completedAt >= period.start &&
      t.completedAt <= period.end;

    if (plannedInPeriod || completedInPeriod) {
      const row = entry.categories.get(category) ?? { planejado: 0, realizado: 0 };
      if (plannedInPeriod) {
        row.planejado += 1;
        entry.total.planejado += 1;
      }
      if (completedInPeriod) {
        row.realizado += 1;
        entry.total.realizado += 1;
      }
      entry.categories.set(category, row);
    }
  }

  const teamTotal = [...byPerson.values()].reduce(
    (acc, p) => ({ planejado: acc.planejado + p.total.planejado, realizado: acc.realizado + p.total.realizado }),
    { planejado: 0, realizado: 0 }
  );
  const AVATAR_PALETTE = ["bg-brand-deep text-gold-soft", "bg-gold text-brand-deep", "bg-[#2166AC]/[0.12] text-[#2166AC]", "bg-[#B0473A]/[0.12] text-[#B0473A]"];

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
            Indicadores por colaborador — planejado × realizado, por
            cadeira/categoria, calculado direto das tarefas do Workflow.
          </p>
        </div>
        <FilterBar areaOptions={[]} responsibleOptions={[]} />
      </div>

      <SocialTabs />

      <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-medium text-ink-soft">Time · {period.label.toLowerCase()}</span>
          <span className="tnum text-[15px] font-medium text-ink">
            {teamTotal.realizado} / {teamTotal.planejado} entregas
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
          <span
            className="block h-full rounded-full bg-gold"
            style={{ width: `${teamTotal.planejado > 0 ? Math.min(100, Math.round((teamTotal.realizado / teamTotal.planejado) * 100)) : 0}%` }}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {[...byPerson.entries()].map(([userId, p], i) => {
          const initials = p.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
          return (
          <div
            key={userId}
            className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[12.5px] font-semibold ${AVATAR_PALETTE[i % AVATAR_PALETTE.length]}`}>
                  {initials || "?"}
                </span>
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-ink">{p.name}</span>
                  <span className="text-[11.5px] text-ink-faint">{p.seat}</span>
                </div>
              </div>
              <span className="tnum text-[13px] font-medium text-ink">
                {p.total.realizado}/{p.total.planejado}
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {[...p.categories.entries()].map(([category, row]) => (
                <div key={category} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[12.5px]">
                    <span className="text-ink-soft">{category}</span>
                    <span className="tnum text-ink-faint">
                      {row.realizado} realizado / {row.planejado} planejado
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{
                        width: `${row.planejado > 0 ? Math.min(100, Math.round((row.realizado / row.planejado) * 100)) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
              {p.categories.size === 0 && (
                <p className="text-[12.5px] text-ink-faint">
                  Nenhuma tarefa no período selecionado.
                </p>
              )}
            </div>
          </div>
          );
        })}
      </div>
    </>
  );
}
