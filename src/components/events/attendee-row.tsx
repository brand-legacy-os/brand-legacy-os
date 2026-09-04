"use client";

import { useTransition, useState, useActionState, useEffect } from "react";
import {
  toggleAttendeeCheckedInAction,
  setAttendeeNpsAction,
  updateAttendeeAction,
  deleteAttendeeAction,
  type ActionState,
} from "@/lib/actions/events";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";
import { AttendeeFormFields } from "./attendee-form-fields";

const initialState: ActionState = {};

export function AttendeeRow({
  attendee,
  canManage,
}: {
  attendee: {
    id: string;
    name: string;
    empresa: string | null;
    category: keyof typeof ATTENDEE_CATEGORY_META;
    ticketType: string | null;
    email: string | null;
    phone: string | null;
    cpfRg: string | null;
    instagram: string | null;
    dynamicChoice: string | null;
    dynamicOther: string | null;
    checkedIn: boolean;
    npsScore: number | null;
  };
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const [state, formAction, savePending] = useActionState(updateAttendeeAction, initialState);

  useEffect(() => {
    if (state.success) setEditing(false);
  }, [state.success]);

  return (
    <div className="border-t border-border py-2 first:border-t-0">
      <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-3">
        <div className="flex flex-col">
          <span className="text-[13px] text-ink">
            {attendee.name}
            {attendee.empresa && (
              <span className="text-ink-faint"> · {attendee.empresa}</span>
            )}
          </span>
          <span className="text-[11px] text-ink-faint">
            {ATTENDEE_CATEGORY_META[attendee.category].label}
            {attendee.ticketType ? ` · Ingresso ${attendee.ticketType}` : ""}
          </span>
        </div>
        <select
          defaultValue={attendee.npsScore ?? ""}
          disabled={!canManage || pending}
          onChange={(e) => {
            const fd = new FormData();
            fd.set("attendeeId", attendee.id);
            fd.set("score", e.target.value);
            startTransition(() => {
              setAttendeeNpsAction(fd);
            });
          }}
          className="h-8 w-16 rounded-(--radius-s) border border-border bg-surface text-[12px] outline-none"
        >
          <option value="">NPS</option>
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <label
          className={`text-[11.5px] ${canManage ? "cursor-pointer" : ""} ${pending ? "opacity-60" : ""}`}
        >
          <input
            type="checkbox"
            defaultChecked={attendee.checkedIn}
            disabled={!canManage || pending}
            onChange={() => {
              const fd = new FormData();
              fd.set("attendeeId", attendee.id);
              startTransition(() => {
                toggleAttendeeCheckedInAction(fd);
              });
            }}
            className="mr-1.5 accent-brand-deep"
          />
          Presente
        </label>
        {canManage && (
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setEditing((v) => !v)}
              className="text-[11.5px] font-medium text-brand hover:underline"
            >
              {editing ? "fechar" : "editar"}
            </button>
            <form
              action={deleteAttendeeAction}
              onSubmit={(e) => {
                if (!confirm(`Remover "${attendee.name}" da lista de confirmados?`)) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="attendeeId" value={attendee.id} />
              <button type="submit" className="text-[11.5px] text-ink-faint hover:text-critical">
                excluir
              </button>
            </form>
          </div>
        )}
      </div>

      {editing && (
        <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-(--radius-s) bg-surface-muted p-3">
          <input type="hidden" name="attendeeId" value={attendee.id} />
          <AttendeeFormFields
            defaults={{
              name: attendee.name,
              empresa: attendee.empresa,
              category: attendee.category,
              ticketType: attendee.ticketType,
              email: attendee.email,
              phone: attendee.phone,
              cpfRg: attendee.cpfRg,
              instagram: attendee.instagram,
              dynamicChoice: attendee.dynamicChoice,
              dynamicOther: attendee.dynamicOther,
            }}
          />
          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              disabled={savePending}
              className="h-8 rounded-(--radius-s) bg-brand-deep px-3.5 text-[12px] font-medium text-gold-soft disabled:opacity-60"
            >
              {savePending ? "Salvando…" : "Salvar"}
            </button>
            {state.error && <span className="text-[11px] text-critical">{state.error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
