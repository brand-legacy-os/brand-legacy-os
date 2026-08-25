"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { updateTaskAction, type ActionState } from "@/lib/actions/tasks";
import { StatusPill, taskStatusTone } from "@/components/ui/status-pill";
import { TASK_STATUS_META, formatDate } from "@/lib/format";
import type { TaskStatus } from "@prisma/client";

const initialState: ActionState = {};

const STATUS_ORDER: TaskStatus[] = [
  "no_ritmo",
  "atencao",
  "atrasada",
  "pausada",
  "concluida",
  "cancelada",
];

export function TaskRow({
  task,
  assigneeName,
  assigneeInitials,
  projectName,
  customerName,
  customerHref,
  canManage,
}: {
  task: {
    id: string;
    title: string;
    deadline: Date;
    status: TaskStatus;
    note: string | null;
    product?: string | null;
  };
  assigneeName: string;
  assigneeInitials: string;
  projectName?: string | null;
  customerName?: string | null;
  customerHref?: string;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateTaskAction,
    initialState
  );

  return (
    <div className="border-t border-border py-3 first:border-t-0">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-muted text-[10.5px] font-medium text-ink-soft">
          {assigneeInitials}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13.5px] text-ink">{task.title}</span>
          <span className="text-[11.5px] text-ink-faint">
            {assigneeName} · {formatDate(task.deadline)}
            {projectName ? ` · ${projectName}` : ""}
            {task.product ? ` · ${task.product}` : ""}
            {customerName && customerHref ? (
              <>
                {" · "}
                <Link href={customerHref} className="text-brand hover:underline">
                  {customerName}
                </Link>
              </>
            ) : customerName ? (
              ` · ${customerName}`
            ) : (
              ""
            )}
          </span>
        </div>
        <StatusPill
          label={TASK_STATUS_META[task.status].label}
          tone={taskStatusTone(task.status)}
        />
        {canManage && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="text-[12px] font-medium text-brand hover:underline"
          >
            {open ? "Fechar" : "Atualizar"}
          </button>
        )}
      </div>

      {task.note && !open && (
        <p className="ml-10 mt-1.5 text-[12.5px] italic text-ink-soft">
          &ldquo;{task.note}&rdquo;
        </p>
      )}

      {open && canManage && (
        <form
          action={formAction}
          className="ml-10 mt-2.5 flex flex-col gap-2.5 rounded-(--radius-s) bg-surface-muted p-3"
        >
          <input type="hidden" name="taskId" value={task.id} />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_ORDER.map((s) => (
              <label key={s} className="cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={s}
                  defaultChecked={s === task.status}
                  className="peer sr-only"
                />
                <span className="inline-block rounded-full border border-border px-2.5 py-1 text-[11.5px] text-ink-soft peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-gold-soft">
                  {TASK_STATUS_META[s].dot} {TASK_STATUS_META[s].label}
                </span>
              </label>
            ))}
          </div>
          <textarea
            name="note"
            defaultValue={task.note ?? ""}
            placeholder="Por que está nesse status? Compartilhe o contexto…"
            rows={2}
            className="rounded-(--radius-s) border border-border bg-surface p-2.5 text-[13px] outline-none focus:border-brand-deep-2"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
            >
              {pending ? "Salvando…" : "Salvar"}
            </button>
            {state.error && (
              <span className="text-[12px] text-critical">{state.error}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
