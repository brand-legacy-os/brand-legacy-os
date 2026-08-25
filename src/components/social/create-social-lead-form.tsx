"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { createSocialLeadAction, type ActionState } from "@/lib/actions/social";
import { SOCIAL_LEAD_STATUS_META } from "@/lib/social";

const initialState: ActionState = {};

export function CreateSocialLeadForm({
  salespeople,
}: {
  salespeople: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createSocialLeadAction,
    initialState
  );
  const ref = useRef<HTMLFormElement>(null);

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
        className="h-9 w-fit rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft hover:opacity-90"
      >
        + Novo lead
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-l) border border-border bg-surface p-4"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
        <input
          name="leadName"
          required
          placeholder="Nome do lead"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="companyName"
          placeholder="Empresa"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <input
          name="contactPerson"
          placeholder="Pessoa de contato"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        />
        <select
          name="salespersonId"
          defaultValue=""
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          <option value="">Vendedor responsável…</option>
          {salespeople.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <div className="flex flex-col gap-1">
          <label className="text-[11px] text-ink-faint">Data da reunião</label>
          <input
            name="meetingDate"
            type="date"
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
          />
        </div>
        <select
          name="status"
          defaultValue="sem_resposta"
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-2.5 text-[13px] outline-none"
        >
          {Object.entries(SOCIAL_LEAD_STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
      </div>
      <textarea
        name="notes"
        rows={2}
        placeholder="Observações (opcional)"
        className="rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[13px] outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-(--radius-s) bg-brand-deep px-4 text-[13px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Adicionar lead"}
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
