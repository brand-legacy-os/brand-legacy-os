"use client";

import { useActionState, useRef, useEffect } from "react";
import { addTaskCommentAction, type ActionState } from "@/lib/actions/tasks";

const initialState: ActionState = {};

export function TaskCommentForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(
    addTaskCommentAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="flex flex-col gap-1.5">
      <input type="hidden" name="taskId" value={taskId} />
      <div className="flex items-center gap-2">
        <input
          name="content"
          placeholder="Registrar uma atividade ou observação…"
          className="h-9 flex-1 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Enviando…" : "Enviar"}
        </button>
      </div>
      {state.error && (
        <span className="text-[11.5px] text-critical">{state.error}</span>
      )}
    </form>
  );
}
