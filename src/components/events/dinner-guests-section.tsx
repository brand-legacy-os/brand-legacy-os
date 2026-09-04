"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  addDinnerGuestAction,
  updateDinnerGuestAction,
  deleteDinnerGuestAction,
  type ActionState,
} from "@/lib/actions/events";

const initialState: ActionState = {};

type Guest = { id: string; name: string; category: string | null; empresa: string | null; phone: string | null; email: string | null };

function EditGuestForm({ guest, onDone }: { guest: Guest; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateDinnerGuestAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
      <input type="hidden" name="guestId" value={guest.id} />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="name" required defaultValue={guest.name} placeholder="Nome" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
        <input name="category" defaultValue={guest.category ?? ""} placeholder="Categoria" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
        <input name="empresa" defaultValue={guest.empresa ?? ""} placeholder="Empresa" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
        <input name="phone" defaultValue={guest.phone ?? ""} placeholder="Telefone" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
        <input name="email" type="email" defaultValue={guest.email ?? ""} placeholder="E-mail" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none sm:col-span-2" />
      </div>
      <div className="flex items-center gap-2.5">
        <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
          {pending ? "Salvando…" : "Salvar"}
        </button>
        <button type="button" onClick={onDone} className="text-[11.5px] text-ink-faint hover:underline">
          Cancelar
        </button>
        {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
      </div>
    </form>
  );
}

export function DinnerGuestsSection({
  eventId,
  guests,
  canManage,
}: {
  eventId: string;
  guests: Guest[];
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(addDinnerGuestAction, initialState);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      ref.current?.reset();
      setOpen(false);
    }
  }, [state.success]);

  return (
    <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <h2 className="text-[13px] font-medium text-ink-soft">Jantar da imersão ({guests.length})</h2>
      <div className="flex flex-col">
        {guests.map((g) =>
          editingId === g.id ? (
            <div key={g.id} className="border-t border-border py-2 first:border-t-0">
              <EditGuestForm guest={g} onDone={() => setEditingId(null)} />
            </div>
          ) : (
            <div key={g.id} className="flex items-center justify-between border-t border-border py-2 first:border-t-0">
              <div className="flex flex-col">
                <span className="text-[12.5px] text-ink">{g.name}{g.empresa ? ` · ${g.empresa}` : ""}</span>
                <span className="text-[11px] text-ink-faint">
                  {[g.category, g.phone, g.email].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
              {canManage && (
                <div className="flex items-center gap-2.5">
                  <button onClick={() => setEditingId(g.id)} className="text-[11px] font-medium text-brand hover:underline">
                    editar
                  </button>
                  <form
                    action={deleteDinnerGuestAction}
                    onSubmit={(e) => {
                      if (!confirm(`Remover "${g.name}" do jantar?`)) e.preventDefault();
                    }}
                  >
                    <input type="hidden" name="guestId" value={g.id} />
                    <input type="hidden" name="eventId" value={eventId} />
                    <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                      remover
                    </button>
                  </form>
                </div>
              )}
            </div>
          )
        )}
        {guests.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Nenhum convidado ainda.</p>}
      </div>

      {canManage && (
        <>
          {open ? (
            <form ref={ref} action={formAction} className="flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
              <input type="hidden" name="eventId" value={eventId} />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input name="name" required placeholder="Nome" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
                <input name="category" placeholder="Categoria" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
                <input name="empresa" placeholder="Empresa" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
                <input name="phone" placeholder="Telefone" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none" />
                <input name="email" type="email" placeholder="E-mail" className="h-8 rounded-(--radius-s) border border-border bg-surface px-2.5 text-[12.5px] outline-none sm:col-span-2" />
              </div>
              <div className="flex items-center gap-2.5">
                <button type="submit" disabled={pending} className="h-8 rounded-(--radius-s) bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-60">
                  {pending ? "Salvando…" : "Adicionar"}
                </button>
                <button type="button" onClick={() => setOpen(false)} className="text-[11.5px] text-ink-faint hover:underline">
                  Cancelar
                </button>
                {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
              </div>
            </form>
          ) : (
            <button onClick={() => setOpen(true)} className="w-fit text-[12px] font-medium text-brand hover:underline">
              + Convidado
            </button>
          )}
        </>
      )}
    </section>
  );
}
