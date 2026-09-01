"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createTaskAction, type ActionState } from "@/lib/actions/tasks";

const initialState: ActionState = {};

export function AddContentPostTaskForm({
  postId,
  areaId,
  members,
}: {
  postId: string;
  areaId: string;
  members: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createTaskAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-fit text-[12px] font-medium text-brand hover:underline"
      >
        + Adicionar tarefa
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-2.5"
    >
      <input type="hidden" name="areaId" value={areaId} />
      <input type="hidden" name="contentPostId" value={postId} />
      <input
        name="title"
        required
        placeholder="O que precisa ser feito?"
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
      />
      <div className="flex flex-wrap gap-2">
        <select
          name="assigneeId"
          required
          defaultValue=""
          className="h-8 flex-1 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        >
          <option value="" disabled>
            Responsável…
          </option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          name="deadline"
          type="date"
          required
          defaultValue={today}
          className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <select
          name="priority"
          defaultValue="media"
          className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
      </div>
      <div className="flex items-center gap-2.5">
        <button
          type="submit"
          disabled={pending}
          className="h-7 rounded-(--radius-s) bg-brand-deep px-3 text-[11.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar tarefa"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[11px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && (
          <span className="text-[11px] text-critical">{state.error}</span>
        )}
      </div>
    </form>
  );
}
