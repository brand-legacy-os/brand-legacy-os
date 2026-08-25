"use client";

import { useActionState, useRef, useEffect } from "react";
import { addChecklistItemAction, type ActionState } from "@/lib/actions/tasks";

const initialState: ActionState = {};

export function AddChecklistItemForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(
    addChecklistItemAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) ref.current?.reset();
  }, [state.success]);

  return (
    <form ref={ref} action={formAction} className="flex items-center gap-2 px-2 pt-1">
      <input type="hidden" name="taskId" value={taskId} />
      <input
        name="label"
        placeholder="+ Adicionar item ao checklist"
        className="h-8 flex-1 rounded-(--radius-s) border border-transparent bg-transparent px-1 text-[13px] outline-none focus:border-border focus:bg-surface"
      />
      <button
        type="submit"
        disabled={pending}
        className="text-[12px] font-medium text-brand disabled:opacity-50"
      >
        Adicionar
      </button>
      {state.error && (
        <span className="text-[11.5px] text-critical">{state.error}</span>
      )}
    </form>
  );
}
