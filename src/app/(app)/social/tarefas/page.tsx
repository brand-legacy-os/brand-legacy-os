import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea, isAdmin } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { SocialTabs } from "@/components/social/social-tabs";
import { TaskRow } from "@/components/area/task-row";
import { CreateTaskForm } from "@/components/area/create-task-form";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { SOCIAL_TASK_CATEGORIES } from "@/lib/social";
import { notFound } from "next/navigation";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function SocialTarefasPage({
  searchParams,
}: PageProps<"/social/tarefas">) {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const sp = await searchParams;

  const area = await prisma.area.findUnique({
    where: { slug: "social" },
    include: {
      tasks: {
        include: { assignee: true, project: true },
        orderBy: { deadline: "asc" },
      },
      projects: true,
      memberships: { include: { user: true } },
    },
  });
  if (!area) notFound();

  const canEdit = canEditAreaKpis(user, "social");

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  // --- Mini dashboard "por colaborador": planejado × realizado no período ---
  type Row = { planejado: number; realizado: number };
  const dashByPerson = new Map<string, { name: string; seat: string; categories: Map<string, Row>; total: Row }>();
  for (const m of area.memberships) {
    dashByPerson.set(m.userId, { name: m.user.name, seat: m.title, categories: new Map(), total: { planejado: 0, realizado: 0 } });
  }
  for (const t of area.tasks) {
    const entry = dashByPerson.get(t.assigneeId);
    if (!entry) continue;
    const category = t.product ?? "Sem categoria";
    const plannedInPeriod = t.deadline >= period.start && t.deadline <= period.end;
    const completedInPeriod =
      t.status === "concluida" && t.completedAt && t.completedAt >= period.start && t.completedAt <= period.end;
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
  const teamTotal = [...dashByPerson.values()].reduce(
    (acc, p) => ({ planejado: acc.planejado + p.total.planejado, realizado: acc.realizado + p.total.realizado }),
    { planejado: 0, realizado: 0 }
  );
  const AVATAR_PALETTE = ["bg-brand-deep text-gold-soft", "bg-gold text-brand-deep", "bg-[#2166AC]/[0.12] text-[#2166AC]", "bg-[#B0473A]/[0.12] text-[#B0473A]"];

  // --- Lista de tarefas por colaborador, ranqueada por prazo ---
  const byPerson = new Map<string, { name: string; tasks: typeof area.tasks }>();
  for (const m of area.memberships) {
    byPerson.set(m.userId, { name: m.user.name, tasks: [] });
  }
  for (const t of area.tasks) {
    const entry = byPerson.get(t.assigneeId);
    if (entry) entry.tasks.push(t);
  }
  const groups = [...byPerson.entries()].sort(([, a], [, b]) => b.tasks.length - a.tasks.length);

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
            Tarefas por colaborador, ranqueadas por prazo — categorias reais do
            controle interno deles (Produto - EAD, Rotina, Produto Mentoria,
            Produto SAAS).
          </p>
        </div>
        <FilterBar areaOptions={[]} responsibleOptions={[]} />
      </div>

      <SocialTabs />

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Por colaborador · {period.label.toLowerCase()}
        </h2>
        <div className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium text-ink-soft">Time</span>
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
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[...dashByPerson.entries()].map(([userId, p], i) => {
            const initials = p.name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");
            return (
              <div key={userId} className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold ${AVATAR_PALETTE[i % AVATAR_PALETTE.length]}`}>
                      {initials || "?"}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[13.5px] font-medium text-ink">{p.name}</span>
                      <span className="text-[11px] text-ink-faint">{p.seat}</span>
                    </div>
                  </div>
                  <span className="tnum text-[12.5px] font-medium text-ink">
                    {p.total.realizado}/{p.total.planejado}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[...p.categories.entries()].map(([category, row]) => (
                    <div key={category} className="flex flex-col gap-1">
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="text-ink-soft">{category}</span>
                        <span className="tnum text-ink-faint">
                          {row.realizado} realizado / {row.planejado} planejado
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{ width: `${row.planejado > 0 ? Math.min(100, Math.round((row.realizado / row.planejado) * 100)) : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  {p.categories.size === 0 && (
                    <p className="text-[12px] text-ink-faint">Nenhuma tarefa no período selecionado.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col gap-6">
        {groups.map(([userId, p]) => (
          <section key={userId} className="flex flex-col gap-2">
            <h2 className="text-[13px] font-medium text-ink-soft">
              {p.name} ({p.tasks.length})
            </h2>
            <div className="rounded-(--radius-l) border border-border bg-surface px-4">
              {p.tasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  assigneeName={p.name}
                  assigneeInitials={t.assignee.avatarInitials}
                  projectName={t.project?.name}
                  canManage={isAdmin(user) || canEdit || t.assigneeId === user.id}
                />
              ))}
              {p.tasks.length === 0 && (
                <p className="py-4 text-[13px] text-ink-faint">Nenhuma tarefa por aqui ainda.</p>
              )}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="text-[13px] text-ink-faint">Nenhum colaborador na área ainda.</p>
        )}
      </div>

      {canEdit && (
        <CreateTaskForm
          areaId={area.id}
          members={area.memberships.map((m) => ({ id: m.user.id, name: m.user.name }))}
          projects={area.projects.map((p) => ({ id: p.id, name: p.name }))}
          productSuggestions={SOCIAL_TASK_CATEGORIES}
        />
      )}
    </>
  );
}
