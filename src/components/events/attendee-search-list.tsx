"use client";

import { useMemo, useState, type ComponentProps } from "react";
import { AttendeeRow } from "./attendee-row";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";

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
  const [category, setCategory] = useState("");
  const [focalPerson, setFocalPerson] = useState("");

  // só mostra no filtro os tipos que de fato existem entre os confirmados
  // desse evento, em vez das 9 categorias fixas do enum.
  const categoriesPresent = useMemo(() => {
    const set = new Set(attendees.map((a) => a.category));
    return [...set].sort((a, b) => ATTENDEE_CATEGORY_META[a].label.localeCompare(ATTENDEE_CATEGORY_META[b].label));
  }, [attendees]);

  // Pessoa focal = quem é responsável por aquele confirmado (e, por
  // extensão, pela venda/jantar dele) — mesmo campo já exibido no card.
  const focalPeoplePresent = useMemo(() => {
    const set = new Set(attendees.map((a) => a.focalPerson).filter((f): f is string => Boolean(f)));
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [attendees]);

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return attendees.filter((a) => {
      if (category && a.category !== category) return false;
      if (focalPerson && a.focalPerson !== focalPerson) return false;
      if (!q) return true;
      return normalize(a.name).includes(q) || normalize(a.empresa).includes(q);
    });
  }, [attendees, query, category, focalPerson]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou empresa…"
          className="h-9 w-full max-w-sm rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
        >
          <option value="">Todos os tipos</option>
          {categoriesPresent.map((c) => (
            <option key={c} value={c}>
              {ATTENDEE_CATEGORY_META[c].label}
            </option>
          ))}
        </select>
        {focalPeoplePresent.length > 0 && (
          <select
            value={focalPerson}
            onChange={(e) => setFocalPerson(e.target.value)}
            className="h-9 rounded-(--radius-s) border border-border bg-canvas px-3 text-[13px] outline-none focus:border-brand-deep-2"
          >
            <option value="">Todas as pessoas focais</option>
            {focalPeoplePresent.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="flex flex-col">
        {filtered.map((a) => (
          <AttendeeRow key={a.id} attendee={a} canManage={canManage} users={users} />
        ))}
        {filtered.length === 0 && (
          <p className="py-3 text-[12.5px] text-ink-faint">Nenhum confirmado encontrado.</p>
        )}
      </div>
    </div>
  );
}
