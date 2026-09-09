"use client";

import { useActionState, useState } from "react";
import {
  updateSubtaskAction,
  deleteSubtaskAction,
  addSubtaskAttachmentAction,
  deleteSubtaskAttachmentAction,
  type ActionState,
} from "@/lib/actions/tasks";
import { TaskAttachmentGroup } from "@/components/social/task-attachment-group";
import { StatusPill, taskStatusTone, priorityTone } from "@/components/ui/status-pill";
import { TASK_STATUS_META, TASK_PRIORITY_META, formatDate } from "@/lib/format";
import type { TaskStatus, TaskPriority } from "@prisma/client";

const initialState: ActionState = {};

const STATUS_ORDER: TaskStatus[] = ["no_ritmo", "atencao", "atrasada", "pausada", "concluida", "cancelada"];
const PRIORITY_ORDER: TaskPriority[] = ["baixa", "media", "alta", "urgente"];

type Attachment = { id: string; label: string; url: string; kind: string };

export function SubtaskRow({
  subtask,
  assigneeName,
  assigneeInitials,
  canManage,
  members,
}: {
  subtask: {
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
  members: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(updateSubtaskAction, initialState);

  return (
    <div className="border-t border-border py-2.5 first:border-t-0">
      <div className="flex items-center gap-2.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10px] font-medium text-ink-soft">
          {assigneeInitials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] text-ink">{subtask.title}</span>
          <span className="text-[11px] text-ink-faint">
            {assigneeName} · atribuída {formatDate(subtask.createdAt)} · prazo {formatDate(subtask.deadline)}
            {subtask.completedAt ? ` · concluída ${formatDate(subtask.completedAt)}` : ""}
          </span>
        </div>
        <StatusPill label={TASK_PRIORITY_META[subtask.priority].label} tone={priorityTone(subtask.priority)} />
        <StatusPill label={TASK_STATUS_META[subtask.status].label} tone={taskStatusTone(subtask.status)} />
        {canManage && (
          <button onClick={() => setOpen((v) => !v)} className="text-[11.5px] font-medium text-brand hover:underline">
            {open ? "Fechar" : "Atualizar"}
          </button>
        )}
      </div>

      {subtask.note && !open && (
        <p className="ml-8 mt-1 text-[12px] italic text-ink-soft">&ldquo;{subtask.note}&rdquo;</p>
      )}

      <div className="ml-8 mt-1.5 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <TaskAttachmentGroup
          attachments={subtask.attachments}
          kind="referencia"
          label="Links importantes"
          addAction={addSubtaskAttachmentAction}
          deleteAction={deleteSubtaskAttachmentAction}
          hiddenFieldName="subtaskId"
          hiddenFieldValue={subtask.id}
          canManage={canManage}
          allowUpload={false}
        />
        <TaskAttachmentGroup
          attachments={subtask.attachments}
          kind="entrega"
          label="Arquivo de entrega"
          addAction={addSubtaskAttachmentAction}
          deleteAction={deleteSubtaskAttachmentAction}
          hiddenFieldName="subtaskId"
          hiddenFieldValue={subtask.id}
          canManage={canManage}
          allowUpload={true}
        />
      </div>

      {open && canManage && (
        <form action={formAction} className="ml-8 mt-2 flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-2.5">
          <input type="hidden" name="subtaskId" value={subtask.id} />
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">O que precisa ser feito</label>
            <input
              name="title"
              defaultValue={subtask.title}
              className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-ink-faint">Responsável</label>
            <select
              name="assigneeId"
              defaultValue={subtask.assigneeId}
              className="h-8 w-fit rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="radio" name="status" value={s} defaultChecked={s === subtask.status} className="peer sr-only" />
                <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-soft peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-gold-soft">
                  {TASK_STATUS_META[s].dot} {TASK_STATUS_META[s].label}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRIORITY_ORDER.map((p) => (
              <label key={p} className="cursor-pointer">
                <input type="radio" name="priority" value={p} defaultChecked={p === subtask.priority} className="peer sr-only" />
                <span className="inline-block rounded-full border border-border px-2 py-0.5 text-[11px] text-ink-soft peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-gold-soft">
                  {TASK_PRIORITY_META[p].label}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-ink-faint">Prazo de conclusão</label>
              <input
                name="deadline"
                type="date"
                defaultValue={new Date(subtask.deadline).toISOString().slice(0, 10)}
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-ink-faint">Data de conclusão</label>
              <input
                name="completedAt"
                type="date"
                defaultValue={subtask.completedAt ? new Date(subtask.completedAt).toISOString().slice(0, 10) : ""}
                className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
              />
            </div>
          </div>
          <textarea
            name="note"
            defaultValue={subtask.note ?? ""}
            placeholder="Observações…"
            rows={2}
            className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[12.5px] outline-none focus:border-brand-deep-2"
          />
          <div className="flex items-center gap-3">
            <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft disabled:opacity-60">
              {pending ? "Salvando…" : "Salvar"}
            </button>
            <form action={deleteSubtaskAction}>
              <input type="hidden" name="subtaskId" value={subtask.id} />
              <button className="text-[12px] font-medium text-critical hover:underline">Excluir</button>
            </form>
            {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
