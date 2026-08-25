"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createCsTaskAction, type ActionState } from "@/lib/actions/cs";

const initialState: ActionState = {};

const RECURRENCE_OPTIONS = ["Avulsa", "Semanal", "Mensal", "Trimestral"];

export function CreateCsTaskForm({
  members,
  customers,
  defaultCustomerId,
}: {
  members: { id: string; name: string }[];
  customers: { id: string; name: string }[];
  defaultCustomerId?: string;
}) {
  const [open, setOpen] = useState(Boolean(defaultCustomerId));
  const [state, formAction, pending] = useActionState(createCsTaskAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="self-start text-[12.5px] font-medium text-brand hover:underline">
        + Nova tarefa
      </button>
    );
  }

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4">
      <input
        name="title"
        required
        placeholder="O que precisa ser feito?"
        className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <textarea
        name="description"
        placeholder="Descrição (opcional)"
        rows={2}
        className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none"
      />
      <div className="flex flex-wrap gap-2.5">
        <select name="assigneeId" required defaultValue="" className="h-9 flex-1 min-w-[160px] rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          <option value="" disabled>Responsável…</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select name="customerId" defaultValue={defaultCustomerId ?? ""} className="h-9 flex-1 min-w-[160px] rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          <option value="">Sem cliente vinculado</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input name="deadline" type="date" required className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <div className="flex flex-wrap gap-2.5">
        <select name="priority" defaultValue="media" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          <option value="baixa">Baixa</option>
          <option value="media">Média</option>
          <option value="alta">Alta</option>
          <option value="urgente">Crítica</option>
        </select>
        <select name="recurrence" defaultValue="" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          <option value="">Avulsa</option>
          {RECURRENCE_OPTIONS.slice(1).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Criando…" : "Criar tarefa"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
