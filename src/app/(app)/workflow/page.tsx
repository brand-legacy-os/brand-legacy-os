import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { visibleAreaSlugs, isAdmin, isLeaderOf, canManageAnyAreaTask } from "@/lib/permissions";
import { formatDate, TASK_STATUS_META, TASK_PRIORITY_META } from "@/lib/format";
import { StatusPill, taskStatusTone, priorityTone } from "@/components/ui/status-pill";
import { WorkflowFilterBar } from "@/components/workflow/workflow-filter-bar";
import { WorkflowCreateTaskForm } from "@/components/workflow/workflow-create-task-form";
import { DeleteTaskButton } from "@/components/workflow/delete-task-button";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import type { TaskStatus, TaskPriority } from "@prisma/client";

export default async function WorkflowPage({
  searchParams,
}: PageProps<"/workflow">) {
  const user = await requireUser();
  const sp = await searchParams;

  const visible = visibleAreaSlugs(user);
  const areaFilter = typeof sp.area === "string" ? sp.area : "";
  const respFilter = typeof sp.responsavel === "string" ? sp.responsavel : "";
  const statusFilter = typeof sp.status === "string" ? (sp.status as TaskStatus) : "";
  const priorityFilter =
    typeof sp.prioridade === "string" ? (sp.prioridade as TaskPriority) : "";

  const allowedAreaSlugs =
    visible === "all"
      ? areaFilter
        ? [areaFilter]
        : undefined
      : areaFilter && visible.includes(areaFilter)
        ? [areaFilter]
        : visible;

  const tasks = await prisma.task.findMany({
    where: {
      area: allowedAreaSlugs ? { slug: { in: allowedAreaSlugs } } : undefined,
      assigneeId: respFilter || undefined,
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
    },
    include: { area: true, assignee: true, project: true },
    orderBy: { deadline: "asc" },
  });

  const allAreasForFilter = await prisma.area.findMany({
    where: visible === "all" ? undefined : { slug: { in: visible } },
    select: { slug: true, name: true },
    orderBy: { order: "asc" },
  });

  const responsibleOptions =
    visible === "all"
      ? await prisma.user.findMany({
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        })
      : await prisma.user.findMany({
          where: { memberships: { some: { area: { slug: { in: visible } } } } },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        });

  const now = new Date();

  const manageableAreaSlugs = canManageAnyAreaTask(user)
    ? "all"
    : allAreasForFilter
        .filter((a) => isLeaderOf(user, a.slug))
        .map((a) => a.slug);
  const manageableAreas = await prisma.area.findMany({
    where: manageableAreaSlugs === "all" ? undefined : { slug: { in: manageableAreaSlugs } },
    orderBy: { order: "asc" },
    include: {
      memberships: { include: { user: true } },
      projects: { select: { id: true, name: true } },
    },
  });

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="O que não está visível, não está sob controle."
        subtitle="Cada tarefa com dono e prazo claro é combinado cumprido — é assim que a operação inteira confia na entrega do time."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Operações
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Workflow
          </h1>
          <p className="text-[13px] text-ink-soft">
            Visão macro de tudo o que está em execução — clique numa linha para
            abrir o card completo.
          </p>
        </div>
        <WorkflowFilterBar
          areaOptions={allAreasForFilter.map((a) => ({
            value: a.slug,
            label: a.name,
          }))}
          responsibleOptions={responsibleOptions.map((r) => ({
            value: r.id,
            label: r.name,
          }))}
        />
      </div>

      {manageableAreas.length > 0 && (
        <WorkflowCreateTaskForm
          areas={manageableAreas.map((a) => ({
            id: a.id,
            name: a.name,
            members: a.memberships.map((m) => ({ id: m.user.id, name: m.user.name })),
            projects: a.projects,
          }))}
        />
      )}

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[920px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">O que</th>
              <th className="px-4 py-3 font-medium">Responsável</th>
              <th className="px-4 py-3 font-medium">Departamento</th>
              <th className="px-4 py-3 font-medium">Prazo</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Prioridade</th>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Observações</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => {
              const overdue = t.deadline < now && !["concluida", "cancelada"].includes(t.status);
              const canManage =
                isAdmin(user) || isLeaderOf(user, t.area.slug) || t.assigneeId === user.id;
              return (
                <tr
                  key={t.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-muted"
                >
                  <td className="max-w-[260px] px-4 py-3">
                    <Link
                      href={`/workflow/${t.id}`}
                      className="font-medium text-ink hover:text-brand-deep hover:underline"
                    >
                      {t.title}
                    </Link>
                    {t.project && (
                      <p className="mt-0.5 truncate text-[11.5px] text-ink-faint">
                        {t.project.name}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-muted text-[10px] font-medium text-ink-soft">
                        {t.assignee.avatarInitials}
                      </span>
                      <span className="text-ink-soft">{t.assignee.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{t.area.name}</td>
                  <td
                    className={`tnum px-4 py-3 ${overdue ? "font-medium text-critical" : "text-ink-soft"}`}
                  >
                    {formatDate(t.deadline)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      label={TASK_STATUS_META[t.status].label}
                      tone={taskStatusTone(t.status)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill
                      label={TASK_PRIORITY_META[t.priority].label}
                      tone={priorityTone(t.priority)}
                    />
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{t.product ?? "—"}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink-faint">
                    {t.note ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canManage && <DeleteTaskButton taskId={t.id} />}
                  </td>
                </tr>
              );
            })}
            {tasks.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink-faint">
                  Nenhuma tarefa encontrada com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
