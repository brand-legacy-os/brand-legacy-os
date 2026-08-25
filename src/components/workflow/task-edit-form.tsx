"use client";

import { useActionState } from "react";
import { updateTaskAction, type ActionState } from "@/lib/actions/tasks";
import { TASK_STATUS_META, TASK_PRIORITY_META } from "@/lib/format";
import type { TaskStatus, TaskPriority } from "@prisma/client";

const initialState: ActionState = {};

const STATUS_ORDER: TaskStatus[] = [
  "no_ritmo",
  "atencao",
  "atrasada",
  "pausada",
  "concluida",
  "cancelada",
];
const PRIORITY_ORDER: TaskPriority[] = ["baixa", "media", "alta", "urgente"];

export function TaskEditForm({
  taskId,
  status,
  priority,
  deadline,
  note,
}: {
  taskId: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  note: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateTaskAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="taskId" value={taskId} />

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
          Status
        </label>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((s) => (
            <label key={s} className="cursor-pointer">
              <input
                type="radio"
                name="status"
                value={s}
                defaultChecked={s === status}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-border px-2.5 py-1 text-[12px] text-ink-soft peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-gold-soft">
                {TASK_STATUS_META[s].dot} {TASK_STATUS_META[s].label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
          Prioridade
        </label>
        <div className="flex flex-wrap gap-1.5">
          {PRIORITY_ORDER.map((p) => (
            <label key={p} className="cursor-pointer">
              <input
                type="radio"
                name="priority"
                value={p}
                defaultChecked={p === priority}
                className="peer sr-only"
              />
              <span className="inline-block rounded-full border border-border px-2.5 py-1 text-[12px] text-ink-soft peer-checked:border-brand-deep peer-checked:bg-brand-deep peer-checked:text-gold-soft">
                {TASK_PRIORITY_META[p].label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
          Deadline
        </label>
        <input
          type="date"
          name="deadline"
          defaultValue={deadline}
          className="h-9 w-44 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
          Observação
        </label>
        <textarea
          name="note"
          defaultValue={note ?? ""}
          rows={2}
          placeholder="Contexto rápido sobre o status atual…"
          className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none focus:border-brand-deep-2"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
        {state.error && (
          <span className="text-[12px] text-critical">{state.error}</span>
        )}
        {state.success && (
          <span className="text-[12px] text-positive">Atualizado.</span>
        )}
      </div>
    </form>
  );
}
