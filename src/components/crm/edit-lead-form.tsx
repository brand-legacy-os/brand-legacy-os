"use client";

import { useActionState, useState } from "react";
import { updateLeadAction, type ActionState } from "@/lib/actions/crm";
import { LEAD_FUNNEL_META, LEAD_ORIGIN_META, FUNNEL_STAGES } from "@/lib/crm";
import type { LeadFunnel, LeadOrigin } from "@prisma/client";

const initialState: ActionState = {};

export type LeadDefaults = {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  instagram: string | null;
  value: number | null;
  origin: LeadOrigin;
  funnel: LeadFunnel;
  stageKey: string;
  disqualified: boolean;
  assignedToId: string | null;
  notes: string | null;
};

export function EditLeadForm({
  defaults,
  members,
}: {
  defaults: LeadDefaults;
  members: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [funnel, setFunnel] = useState<LeadFunnel>(defaults.funnel);
  const [state, formAction, pending] = useActionState(updateLeadAction, initialState);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="w-fit text-[12px] font-medium text-brand hover:underline">
        Editar lead
      </button>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <input type="hidden" name="leadId" value={defaults.id} />
      <div className="flex items-center justify-between">
        <h2 className="text-[14px] font-medium text-ink">Editar lead</h2>
        <button type="button" onClick={() => setOpen(false)} className="text-[12px] text-ink-faint hover:underline">
          Fechar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <input name="name" required defaultValue={defaults.name} placeholder="Nome" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="company" defaultValue={defaults.company ?? ""} placeholder="Empresa" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="value" inputMode="decimal" defaultValue={defaults.value ?? ""} placeholder="Valor estimado" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <select
          name="funnel"
          value={funnel}
          onChange={(e) => setFunnel(e.target.value as LeadFunnel)}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          {Object.entries(LEAD_FUNNEL_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <select name="stageKey" defaultValue={defaults.stageKey} key={funnel} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          {FUNNEL_STAGES[funnel].map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
        <select name="origin" defaultValue={defaults.origin} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
          {Object.entries(LEAD_ORIGIN_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <input name="email" type="email" defaultValue={defaults.email ?? ""} placeholder="E-mail" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="phone" defaultValue={defaults.phone ?? ""} placeholder="Telefone" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
        <input name="instagram" defaultValue={defaults.instagram ?? ""} placeholder="Instagram" className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none" />
      </div>

      <select name="assignedToId" defaultValue={defaults.assignedToId ?? ""} className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none">
        <option value="">Sem closer atribuído</option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
          </option>
        ))}
      </select>

      <textarea name="notes" rows={2} defaultValue={defaults.notes ?? ""} placeholder="Observações" className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none" />

      <label className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
        <input type="checkbox" name="disqualified" defaultChecked={defaults.disqualified} />
        Marcar como desqualificado
      </label>

      <div className="flex items-center gap-2.5 border-t border-border pt-3">
        <button type="submit" disabled={pending} className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar alterações"}
        </button>
        {state.error && <span className="text-[12px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
