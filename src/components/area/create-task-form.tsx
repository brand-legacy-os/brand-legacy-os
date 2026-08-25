"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createTaskAction, type ActionState } from "@/lib/actions/tasks";

const initialState: ActionState = {};

export function CreateTaskForm({
  areaId,
  members,
  projects,
  productSuggestions,
}: {
  areaId: string;
  members: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  productSuggestions?: readonly string[];
}) {
  const [open, setOpen] = useState(false);
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

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start text-[12.5px] font-medium text-brand hover:underline"
      >
        + Nova tarefa
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <input type="hidden" name="areaId" value={areaId} />
      <input
        name="title"
        required
        placeholder="O que precisa ser feito?"
        className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <div className="flex flex-wrap gap-2.5">
        <select
          name="assigneeId"
          required
          className="h-9 flex-1 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="">Responsável…</option>
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
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        {projects.length > 0 && (
          <select
            name="projectId"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          >
            <option value="">Sem projeto</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
        {productSuggestions && productSuggestions.length > 0 && (
          <>
            <input
              name="product"
              list="product-suggestions"
              placeholder="Categoria/produto (opcional)"
              className="h-9 min-w-[180px] flex-1 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
            />
            <datalist id="product-suggestions">
              {productSuggestions.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </>
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
