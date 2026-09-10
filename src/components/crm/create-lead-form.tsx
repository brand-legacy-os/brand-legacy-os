"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createLeadAction, type ActionState } from "@/lib/actions/crm";
import { LEAD_FUNNEL_META, LEAD_ORIGIN_META } from "@/lib/crm";
import type { LeadFunnel } from "@prisma/client";

const initialState: ActionState = {};

export function CreateLeadForm({
  funnel,
  members,
}: {
  funnel: LeadFunnel;
  members: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createLeadAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="h-9 rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft">
        + Novo lead
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex w-full flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <input name="name" required placeholder="Nome do lead" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="company" placeholder="Empresa (opcional)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="value" inputMode="decimal" placeholder="Valor estimado (opcional)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <select name="funnel" required defaultValue={funnel} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          {Object.entries(LEAD_FUNNEL_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select name="origin" required defaultValue="" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          <option value="" disabled>
            Origem
          </option>
          {Object.entries(LEAD_ORIGIN_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select name="assignedToId" defaultValue="" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          <option value="">Sem closer atribuído</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <input name="email" type="email" placeholder="E-mail (opcional)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="phone" placeholder="Telefone (opcional)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="instagram" placeholder="Instagram (opcional)" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>
      <textarea name="notes" rows={2} placeholder="Observações (opcional)" className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none" />
      <label className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
        <input type="checkbox" name="disqualified" />
        Marcar como desqualificado
      </label>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Criar lead"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="text-[12.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
