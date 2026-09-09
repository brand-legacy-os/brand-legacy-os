"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { AttendeeRow } from "./attendee-row";

type Attendee = ComponentProps<typeof AttendeeRow>["attendee"];

function normalize(s: string | null | undefined) {
  return (s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function AttendeeSearchList({
  attendees,
  canManage,
  users,
}: {
  attendees: Attendee[];
  canManage: boolean;
  users: ComponentProps<typeof AttendeeRow>["users"];
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return attendees;
    return attendees.filter(
      (a) => normalize(a.name).includes(q) || normalize(a.empresa).includes(q)
    );
  }, [attendees, query]);

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nome ou empresa…"
        className="h-9 w-full max-w-sm rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
      />
      <div className="flex flex-col">
        {filtered.map((a) => (
          <AttendeeRow key={a.id} attendee={a} canManage={canManage} users={users} />
        ))}
        {filtered.length === 0 && (
          <p className="py-3 text-[12.5px] text-ink-faint">Nenhum confirmado encontrado para &quot;{query}&quot;.</p>
        )}
      </div>
    </div>
  );
}
