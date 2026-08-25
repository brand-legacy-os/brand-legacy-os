"use client";

import { useTransition } from "react";
import { updateEventStatusAction } from "@/lib/actions/events";
import { EVENT_STATUS_META } from "@/lib/events";

export function EventStatusSelect({
  eventId,
  status,
}: {
  eventId: string;
  status: keyof typeof EVENT_STATUS_META;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={status}
      disabled={pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("eventId", eventId);
        fd.set("status", e.target.value);
        startTransition(() => {
          updateEventStatusAction(fd);
        });
      }}
      className="h-8 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-ink-soft outline-none"
    >
      {Object.entries(EVENT_STATUS_META).map(([key, meta]) => (
        <option key={key} value={key}>
          {meta.label}
        </option>
      ))}
    </select>
  );
}
