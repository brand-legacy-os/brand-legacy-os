"use client";

import { useActionState, useState } from "react";
import {
  updateTaskAction,
  addTaskAttachmentAction,
  deleteTaskAttachmentAction,
  type ActionState,
} from "@/lib/actions/tasks";
import { DeleteTaskButton } from "@/components/workflow/delete-task-button";
import { StatusPill, taskStatusTone, priorityTone } from "@/components/ui/status-pill";
import { TASK_STATUS_META, TASK_PRIORITY_META, formatDate } from "@/lib/format";
import type { TaskStatus, TaskPriority } from "@prisma/client";

const initialState: ActionState = {};

const STATUS_ORDER: TaskStatus[] = ["no_ritmo", "atencao", "atrasada", "pausada", "concluida", "cancelada"];
const PRIORITY_ORDER: TaskPriority[] = ["baixa", "media", "alta", "urgente"];

type Attachment = { id: string; label: string; url: string };

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
  };
  assigneeName: string;
  assigneeInitials: string;
  canManage: boolean;
  members?: { id: string; name: string }[];
  canReassign?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [addingAttachment, setAddingAttachment] = useState(false);
  const [state, formAction, pending] = useActionState(updateTaskAction, initialState);
  const [attState, attFormAction, attPending] = useActionState(addTaskAttachmentAction, initialState);

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

      <div className="ml-10 mt-1.5 flex flex-wrap items-center gap-2">
        {task.attachments.map((a) => (
          <span key={a.id} className="flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px]">
            <a href={a.url} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">
              🔗 {a.label}
            </a>
            {canManage && (
              <form action={deleteTaskAttachmentAction}>
                <input type="hidden" name="attachmentId" value={a.id} />
                <button className="text-ink-faint hover:text-critical">×</button>
              </form>
            )}
          </span>
        ))}
        {canManage && !addingAttachment && (
          <button onClick={() => setAddingAttachment(true)} className="text-[11px] font-medium text-brand hover:underline">
            + link/arquivo
          </button>
        )}
      </div>

      {addingAttachment && canManage && (
        <form
          action={attFormAction}
          className="ml-10 mt-1.5 flex flex-wrap items-center gap-2 rounded-(--radius-s) bg-surface-muted p-2"
        >
          <input type="hidden" name="taskId" value={task.id} />
          <input name="label" required placeholder="Nome" className="h-7 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none" />
          <input name="url" placeholder="Link…" className="h-7 rounded-(--radius-s) border border-border bg-surface px-2 text-[11.5px] outline-none" />
          <span className="text-[11px] text-ink-faint">ou</span>
          <input name="file" type="file" className="text-[11px]" />
          <button type="submit" disabled={attPending} className="h-7 rounded-(--radius-s) bg-brand-deep px-2.5 text-[11px] font-medium text-gold-soft disabled:opacity-60">
            {attPending ? "…" : "Adicionar"}
          </button>
          <button type="button" onClick={() => setAddingAttachment(false)} className="text-[11px] text-ink-faint hover:underline">
            cancelar
          </button>
          {attState.error && <span className="text-[11px] text-critical">{attState.error}</span>}
        </form>
      )}

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
          <input
            name="deadline"
            type="date"
            defaultValue={new Date(task.deadline).toISOString().slice(0, 10)}
            className="h-8 w-44 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[13px] outline-none"
          />
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
    </div>
  );
}
