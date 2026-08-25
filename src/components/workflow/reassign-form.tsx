"use client";

import { useActionState } from "react";
import { reassignTaskAction, type ActionState } from "@/lib/actions/tasks";

const initialState: ActionState = {};

export function ReassignForm({
  taskId,
  currentAssigneeId,
  members,
}: {
  taskId: string;
  currentAssigneeId: string;
  members: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    reassignTaskAction,
    initialState
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="taskId" value={taskId} />
      <select
        name="assigneeId"
        defaultValue={currentAssigneeId}
        className="h-8 rounded-(--radius-s) border border-border bg-canvas px-2 text-[12.5px] outline-none"
      >
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="text-[12px] font-medium text-brand disabled:opacity-50"
      >
        {pending ? "…" : "Reatribuir"}
      </button>
      {state.error && (
        <span className="text-[11.5px] text-critical">{state.error}</span>
      )}
    </form>
  );
}
