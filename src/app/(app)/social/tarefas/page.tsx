import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea, isAdmin } from "@/lib/permissions";
import { SocialTabs } from "@/components/social/social-tabs";
import { TaskRow } from "@/components/area/task-row";
import { CreateTaskForm } from "@/components/area/create-task-form";
import { SOCIAL_TASK_CATEGORIES } from "@/lib/social";
import { notFound } from "next/navigation";

export default async function SocialTarefasPage() {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();

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
          Tarefas e TO-DOs do departamento — categorias reais do controle
          interno deles (Produto - EAD, Rotina, Produto Mentoria, Produto
          SAAS).
        </p>
      </div>

      <SocialTabs />

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Tarefas ({area.tasks.length})
        </h2>
        <div className="rounded-(--radius-l) border border-border bg-surface px-4">
          {area.tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              assigneeName={t.assignee.name}
              assigneeInitials={t.assignee.avatarInitials}
              projectName={t.project?.name}
              canManage={isAdmin(user) || canEdit || t.assigneeId === user.id}
            />
          ))}
          {area.tasks.length === 0 && (
            <p className="py-4 text-[13px] text-ink-faint">
              Nenhuma tarefa por aqui ainda.
            </p>
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
      </section>
    </>
  );
}
