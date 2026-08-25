import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageTask, canViewArea, canEditAreaKpis, isAdmin } from "@/lib/permissions";
import { formatDate, formatDateTime, relativeTime, TASK_STATUS_META, TASK_PRIORITY_META } from "@/lib/format";
import { StatusPill, taskStatusTone, priorityTone } from "@/components/ui/status-pill";
import { ChecklistItem } from "@/components/workflow/checklist-item";
import { AddChecklistItemForm } from "@/components/workflow/add-checklist-item-form";
import { TaskCommentForm } from "@/components/workflow/task-comment-form";
import { TaskEditForm } from "@/components/workflow/task-edit-form";
import { ReassignForm } from "@/components/workflow/reassign-form";
import { DeleteTaskButton } from "@/components/workflow/delete-task-button";

export default async function WorkflowCardPage({
  params,
}: PageProps<"/workflow/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      area: { include: { memberships: { include: { user: true } } } },
      assignee: true,
      project: true,
      checklist: { orderBy: { order: "asc" } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!task) notFound();
  if (!canViewArea(user, task.area.slug)) notFound();

  const canManage = canManageTask(user, {
    assigneeId: task.assigneeId,
    areaSlug: task.area.slug,
  });
  const canReassign = isAdmin(user) || canEditAreaKpis(user, task.area.slug);

  const auditEntries = await prisma.auditLog.findMany({
    where: { entityId: task.id, entityType: "Task" },
    include: { user: true },
    orderBy: { at: "desc" },
    take: 10,
  });

  const doneCount = task.checklist.filter((c) => c.done).length;

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          href="/workflow"
          className="w-fit text-[12.5px] font-medium text-ink-soft hover:text-brand-deep"
        >
          ← Workflow
        </Link>
        {canManage && (
          <DeleteTaskButton
            taskId={task.id}
            redirectTo="/workflow"
            label="Excluir tarefa"
          />
        )}
      </div>

      <div className="flex flex-col gap-6 rounded-(--radius-l) border border-border bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/areas/${task.area.slug}`}
                className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft hover:bg-border-strong/40"
              >
                {task.area.name}
              </Link>
              {task.product && (
                <span className="rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-medium text-gold-ink">
                  {task.product}
                </span>
              )}
              {task.project && (
                <Link
                  href={`/areas/${task.area.slug}`}
                  className="text-[11.5px] text-ink-faint hover:underline"
                >
                  {task.project.name}
                </Link>
              )}
            </div>
            <h1 className="font-(family-name:--font-display) text-[24px] leading-tight text-ink">
              {task.title}
            </h1>
            {task.description && (
              <p className="max-w-[62ch] text-[13.5px] leading-relaxed text-ink-soft">
                {task.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <StatusPill
              label={TASK_STATUS_META[task.status].label}
              tone={taskStatusTone(task.status)}
            />
            <StatusPill
              label={`Prioridade ${TASK_PRIORITY_META[task.priority].label}`}
              tone={priorityTone(task.priority)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 border-y border-border py-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.05em] text-ink-faint">
              Responsável
            </span>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-deep text-[10.5px] font-semibold text-gold-soft">
                {task.assignee.avatarInitials}
              </span>
              <Link
                href={`/perfil/${task.assignee.id}`}
                className="text-[13px] text-ink hover:underline"
              >
                {task.assignee.name}
              </Link>
            </div>
            {canReassign && (
              <ReassignForm
                taskId={task.id}
                currentAssigneeId={task.assigneeId}
                members={task.area.memberships.map((m) => ({
                  id: m.user.id,
                  name: m.user.name,
                }))}
              />
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.05em] text-ink-faint">
              Prazo
            </span>
            <span className="tnum text-[13px] text-ink">
              {formatDate(task.deadline)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] uppercase tracking-[0.05em] text-ink-faint">
              Checklist
            </span>
            <span className="tnum text-[13px] text-ink">
              {doneCount}/{task.checklist.length} concluídos
            </span>
          </div>
        </div>

        {(task.checklist.length > 0 || canManage) && (
          <div className="flex flex-col gap-1">
            <span className="mb-1 text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
              TO DOs
            </span>
            {task.checklist.map((item) => (
              <ChecklistItem
                key={item.id}
                id={item.id}
                label={item.label}
                done={item.done}
                canManage={canManage}
              />
            ))}
            {canManage && <AddChecklistItemForm taskId={task.id} />}
          </div>
        )}

        {canManage && (
          <div className="border-t border-border pt-5">
            <TaskEditForm
              taskId={task.id}
              status={task.status}
              priority={task.priority}
              deadline={task.deadline.toISOString().slice(0, 10)}
              note={task.note}
            />
          </div>
        )}

        {!canManage && task.note && (
          <div className="rounded-(--radius-s) bg-surface-muted p-3 text-[13px] text-ink-soft">
            <span className="font-medium text-ink">Observação: </span>
            {task.note}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-6">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Histórico de interações
        </h2>
        <div className="flex flex-col gap-3">
          {task.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-medium text-ink-soft">
                {c.author.avatarInitials}
              </span>
              <div className="flex flex-col">
                <p className="text-[13px] leading-snug text-ink">
                  <span className="font-medium">{c.author.name}</span>{" "}
                  {c.content}
                </p>
                <span className="text-[11px] text-ink-faint">
                  {relativeTime(c.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {auditEntries.map((a) => (
            <div key={a.id} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-ink-faint" />
              <div className="flex flex-col">
                <p className="text-[12.5px] text-ink-faint">
                  <span className="font-medium text-ink-soft">
                    {a.user.name}
                  </span>{" "}
                  alterou {a.field}: &ldquo;{a.oldValue ?? "—"}&rdquo; →{" "}
                  &ldquo;{a.newValue ?? "—"}&rdquo;
                </p>
                <span className="text-[11px] text-ink-faint">
                  {formatDateTime(a.at)}
                </span>
              </div>
            </div>
          ))}
          {task.comments.length === 0 && auditEntries.length === 0 && (
            <p className="text-[13px] text-ink-faint">
              Nenhuma movimentação registrada ainda.
            </p>
          )}
        </div>
        <TaskCommentForm taskId={task.id} />
      </div>
    </div>
  );
}
