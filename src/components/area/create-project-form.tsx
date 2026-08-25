"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createProjectAction, type ActionState } from "@/lib/actions/projects";

const initialState: ActionState = {};

export function CreateProjectForm({
  areaId,
  members,
}: {
  areaId: string;
  members: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createProjectAction,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  const today = new Date().toISOString().slice(0, 10);

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
        + Novo projeto
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
        name="name"
        required
        placeholder="Nome do projeto"
        className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <textarea
        name="description"
        placeholder="Descrição (opcional)"
        rows={2}
        className="rounded-(--radius-s) border border-border bg-canvas px-2.5 py-2 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <div className="flex flex-wrap gap-2.5">
        <select
          name="ownerId"
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
          name="startDate"
          type="date"
          required
          defaultValue={today}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="deadline"
          type="date"
          required
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Criando…" : "Criar projeto"}
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
