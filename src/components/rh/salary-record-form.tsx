"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { upsertSalaryRecordAction, type ActionState } from "@/lib/actions/salary";

const initialState: ActionState = {};

type Defaults = {
  userId: string;
  fullName: string;
  cargo: string;
  areaLabel: string;
  salary: number;
};

export function SalaryRecordForm({
  users,
  defaults,
  onDone,
}: {
  users: { id: string; name: string }[];
  defaults?: Defaults;
  onDone?: () => void;
}) {
  const [state, formAction, pending] = useActionState(upsertSalaryRecordAction, initialState);
  const ref = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(Boolean(defaults));

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      onDone?.();
      if (!defaults) setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-9 w-fit rounded-full bg-brand-deep px-4 text-[12.5px] font-medium text-gold-soft transition-opacity hover:opacity-90"
      >
        + Cadastrar cargo e salário
      </button>
    );
  }

  return (
    <form
      ref={ref}
      action={formAction}
      className="flex flex-col gap-2.5 rounded-(--radius-s) bg-surface-muted p-3"
    >
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {defaults ? (
          <input type="hidden" name="userId" value={defaults.userId} />
        ) : (
          <select
            name="userId"
            required
            defaultValue=""
            className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
          >
            <option value="" disabled>
              Pessoa…
            </option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        )}
        <input
          name="fullName"
          required
          placeholder="Nome completo"
          defaultValue={defaults?.fullName}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="cargo"
          required
          placeholder="Cargo (ex.: Designer Pl.)"
          defaultValue={defaults?.cargo}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="areaLabel"
          required
          placeholder="Área (ex.: Social)"
          defaultValue={defaults?.areaLabel}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
        <input
          name="salary"
          type="number"
          step="0.01"
          required
          placeholder="Salário (R$)"
          defaultValue={defaults?.salary}
          className="h-9 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none"
        />
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12.5px] font-medium text-gold-soft disabled:opacity-60"
        >
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button
          type="button"
          onClick={() => (defaults ? onDone?.() : setOpen(false))}
          className="text-[11.5px] text-ink-faint hover:underline"
        >
          Cancelar
        </button>
        {state.error && <span className="text-[11.5px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}
