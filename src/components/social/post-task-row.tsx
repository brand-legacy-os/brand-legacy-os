"use client";

import { useActionState, useState } from "react";
import {
  updateTaskAction,
  addTaskAttachmentAction,
  deleteTaskAttachmentAction,
  type ActionState,
} from "@/lib/actions/tasks";
import { DeleteTaskButton } from "@/components/workflow/delete-task-button";
import { TaskAttachmentGroup } from "@/components/social/task-attachment-group";
import { SubtaskRow } from "@/components/social/subtask-row";
import { AddSubtaskForm } from "@/components/social/add-subtask-form";
import { StatusPill, taskStatusTone, priorityTone } from "@/components/ui/status-pill";
import { TASK_STATUS_META, TASK_PRIORITY_META, formatDate } from "@/lib/format";
import type { TaskStatus, TaskPriority } from "@prisma/client";

const initialState: ActionState = {};

const STATUS_ORDER: TaskStatus[] = ["no_ritmo", "atencao", "atrasada", "pausada", "concluida", "cancelada"];
const PRIORITY_ORDER: TaskPriority[] = ["baixa", "media", "alta", "urgente"];

type Attachment = { id: string; label: string; url: string; kind: string };
type Subtask = {
  id: string;
  title: string;
  assigneeId: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: Date;
  createdAt: Date;
  completedAt: Date | null;
  note: string | null;
  attachments: Attachment[];
  assignee: { name: string };
};

export function PostTaskRow({
  task,
  assigneeName,
  assigneeInitials,
  canManage,
  members = [],
  canReassign = false,
}: {
  task: {
    id: string;
    title: string;
    assigneeId: string;
    status: TaskStatus;
    priority: TaskPriority;
    deadline: Date;
    createdAt: Date;
    completedAt: Date | null;
    note: string | null;
    attachments: Attachment[];
    subtasks: Subtask[];
  };
  assigneeName: string;
  assigneeInitials: string;
  canManage: boolean;
  members?: { id: string; name: string }[];
  canReassign?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateTaskAction, initialState);

  return (
    <div className="border-t border-border py-3 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10.5px] font-medium text-ink-soft">
          {assigneeInitials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13.5px] text-ink">{task.title}</span>
          <span className="text-[11.5px] text-ink-faint">
            {assigneeName} · atribuída {formatDate(task.createdAt)} · prazo {formatDate(task.deadline)}
            {task.completedAt ? ` · concluída ${formatDate(task.completedAt)}` : ""}
          </span>
        </div>
        <StatusPill label={TASK_PRIORITY_META[task.priority].label} tone={priorityTone(task.priority)} />
        <StatusPill label={TASK_STATUS_META[task.status].label} tone={taskStatusTone(task.status)} />
        {canManage && (
          <button onClick={() => setOpen((v) => !v)} className="text-[12px] font-medium text-brand hover:underline">
            {open ? "Fechar" : "Atualizar"}
          </button>
        )}
      </div>

      {task.note && !open && (
        <p className="ml-10 mt-1.5 text-[12.5px] italic text-ink-soft">&ldquo;{task.note}&rdquo;</p>
      )}

      <div className="ml-10 mt-1.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <TaskAttachmentGroup
          attachments={task.attachments}
          kind="referencia"
          label="Links importantes"
          addAction={addTaskAttachmentAction}
          deleteAction={deleteTaskAttachmentAction}
          hiddenFieldName="taskId"
          hiddenFieldValue={task.id}
          canManage={canManage}
          allowUpload={false}
        />
        <TaskAttachmentGroup
          attachments={task.attachments}
          kind="entrega"
          label="Arquivo de entrega"
          addAction={addTaskAttachmentAction}
          deleteAction={deleteTaskAttachmentAction}
          hiddenFieldName="taskId"
          hiddenFieldValue={task.id}
          canManage={canManage}
          allowUpload={true}
        />
      </div>

      {open && canManage && (
        <form action={formAction} className="ml-10 mt-2.5 flex flex-col gap-2.5 rounded-(--radius-s) bg-surface-muted p-3">
          <input type="hidden" name="taskId" value={task.id} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">O que precisa ser feito</label>
            <input
              name="title"
              defaultValue={task.title}
              className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
            />
          </div>
          {canReassign && members.length > 0 && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-ink-faint">Responsável</label>
              <select
                name="assigneeId"
                defaultValue={task.assigneeId}
                className="h-8 w-fit rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="radio" name="status" value={s} defaultChecked={s === task.status} className="peer sr-only" />
                <span className="inline-block rounded-full border border-border px-2.5 py-1 text-[11.5px] text-ink-soft peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-gold-soft">
                  {TASK_STATUS_META[s].dot} {TASK_STATUS_META[s].label}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITY_ORDER.map((p) => (
              <label key={p} className="cursor-pointer">
                <input type="radio" name="priority" value={p} defaultChecked={p === task.priority} className="peer sr-only" />
                <span className="inline-block rounded-full border border-border px-2.5 py-1 text-[11.5px] text-ink-soft peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-gold-soft">
                  {TASK_PRIORITY_META[p].label}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-ink-faint">Prazo de conclusão</label>
              <input
                name="deadline"
                type="date"
                defaultValue={new Date(task.deadline).toISOString().slice(0, 10)}
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-ink-faint">Data de conclusão</label>
              <input
                name="completedAt"
                type="date"
                defaultValue={task.completedAt ? new Date(task.completedAt).toISOString().slice(0, 10) : ""}
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
              />
            </div>
          </div>
          <textarea
            name="note"
            defaultValue={task.note ?? ""}
            placeholder="Observações sobre a tarefa…"
            rows={2}
            className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[13px] outline-none focus:border-brand-deep-2"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60">
              {pending ? "Salvando…" : "Salvar"}
            </button>
            <DeleteTaskButton taskId={task.id} />
            {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
          </div>
        </form>
      )}

      <div className="ml-10 mt-2.5 flex flex-col gap-1 border-t border-border pt-2.5">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.03em] text-ink-faint">
          Subtarefas ({task.subtasks.length})
        </span>
        <div className="flex flex-col">
          {task.subtasks.map((s) => {
            const initials = s.assignee.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("");
            return (
              <SubtaskRow
                key={s.id}
                subtask={s}
                assigneeName={s.assignee.name}
                assigneeInitials={initials || "?"}
                canManage={canManage}
                members={members}
              />
            );
          })}
        </div>
        {canManage && members.length > 0 && <AddSubtaskForm taskId={task.id} members={members} />}
      </div>
    </div>
  );
}
