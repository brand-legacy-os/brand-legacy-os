"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createTaskAction, type ActionState } from "@/lib/actions/tasks";

const initialState: ActionState = {};

type AreaOption = {
  id: string;
  name: string;
  members: { id: string; name: string }[];
  projects: { id: string; name: string }[];
};

export function WorkflowCreateTaskForm({ areas }: { areas: AreaOption[] }) {
  const [open, setOpen] = useState(false);
  const [areaId, setAreaId] = useState(areas[0]?.id ?? "");
  const [state, formAction, pending] = useActionState(
    createTaskAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (areas.length === 0) return null;

  const selectedArea = areas.find((a) => a.id === areaId) ?? areas[0];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft transition-opacity hover:opacity-90"
      >
        + Nova tarefa
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <input
        name="title"
        required
        placeholder="O que precisa ser feito?"
        className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <div className="flex flex-wrap gap-2.5">
        <select
          name="areaId"
          value={areaId}
          onChange={(e) => setAreaId(e.target.value)}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        <select
          name="assigneeId"
          required
          className="h-9 flex-1 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="">Responsável…</option>
          {selectedArea.members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <input
          name="deadline"
          type="date"
          required
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <select
          name="priority"
          defaultValue="media"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Urgente</option>
        </select>
        {selectedArea.projects.length > 0 && (
          <select
            name="projectId"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          >
            <option value="">Sem projeto</option>
            {selectedArea.projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar tarefa"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-[12.5px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && (
          <span className="text-[12px] text-critical">{state.error}</span>
        )}
      </div>
    </form>
  );
}
