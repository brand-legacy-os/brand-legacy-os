"use client";

import { useTransition, useState } from "react";
import { updateEventNpsAction } from "@/lib/actions/events";

export function EventNpsForm({
  eventId,
  npsAverage,
  npsResponses,
}: {
  eventId: string;
  npsAverage: number | null;
  npsResponses: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [average, setAverage] = useState(npsAverage?.toString() ?? "");
  const [responses, setResponses] = useState(npsResponses?.toString() ?? "");

  return (
    <form
      action={(fd) => startTransition(() => updateEventNpsAction(fd))}
      className="mt-2 flex items-center gap-1.5 border-t border-border pt-2"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input
        name="npsAverage"
        value={average}
        onChange={(e) => setAverage(e.target.value)}
        inputMode="decimal"
        placeholder="Nota média"
        className="h-7 w-20 rounded-(--radius-s) border border-border bg-canvas px-2 text-[11px] outline-none"
      />
      <input
        name="npsResponses"
        value={responses}
        onChange={(e) => setResponses(e.target.value)}
        inputMode="numeric"
        placeholder="Nº respostas"
        className="h-7 w-24 rounded-(--radius-s) border border-border bg-canvas px-2 text-[11px] outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-7 rounded-(--radius-s) bg-surface-muted px-2.5 text-[11px] font-medium text-ink-soft hover:bg-border-strong/30 disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Registrar eNPS"}
      </button>
    </form>
  );
}
