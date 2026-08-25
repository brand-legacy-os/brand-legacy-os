"use client";

import { useTransition } from "react";
import {
  toggleAttendeeCheckedInAction,
  setAttendeeNpsAction,
} from "@/lib/actions/events";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";

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
    checkedIn: boolean;
    npsScore: number | null;
  };
  canManage: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-3 border-t border-border py-2 first:border-t-0">
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
    </div>
  );
}
