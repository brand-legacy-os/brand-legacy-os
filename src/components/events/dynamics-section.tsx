"use client";

import { useMemo, useState } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { EVENT_DYNAMIC_META } from "@/lib/sponsors";

type Attendee = {
  id: string;
  name: string;
  empresa: string | null;
  instagram: string | null;
  instagramPersonal: string | null;
  segmento: string | null;
  revenueRange: string | null;
  dynamicChoice: string | null;
  dynamicOther: string | null;
};

function dynamicLabel(a: Attendee) {
  if (!a.dynamicChoice) return null;
  if (a.dynamicChoice === "outro") return a.dynamicOther || "Outro";
  return EVENT_DYNAMIC_META[a.dynamicChoice as keyof typeof EVENT_DYNAMIC_META]?.label ?? a.dynamicChoice;
}

export function DynamicsSection({ attendees, exportHref }: { attendees: Attendee[]; exportHref?: string }) {
  const [dynamicFilter, setDynamicFilter] = useState("");

  const participants = useMemo(() => attendees.filter((a) => a.dynamicChoice), [attendees]);

  const dynamicsPresent = useMemo(() => {
    const set = new Set(participants.map((a) => a.dynamicChoice as string));
    return [...set];
  }, [participants]);

  const filtered = useMemo(
    () => (dynamicFilter ? participants.filter((a) => a.dynamicChoice === dynamicFilter) : participants),
    [participants, dynamicFilter]
  );

  // Sem filtro: agrupado por marca (mais de uma pessoa por marca aparece
  // junto). Com filtro: participação individual, uma linha por pessoa.
  const groupedByBrand = useMemo(() => {
    if (dynamicFilter) return null;
    const groups = new Map<string, Attendee[]>();
    for (const a of filtered) {
      const key = (a.empresa ?? a.name).trim().toLowerCase();
      groups.set(key, [...(groups.get(key) ?? []), a]);
    }
    return [...groups.values()];
  }, [filtered, dynamicFilter]);

  if (participants.length === 0) return null;

  return (
    <CollapsibleSection
      title={`Dinâmicas (${participants.length})`}
      right={
        exportHref ? (
          <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setDynamicFilter("")}
          className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
            dynamicFilter === "" ? "bg-brand-deep text-gold-soft" : "bg-surface-muted text-ink-soft"
          }`}
        >
          Todas (agrupado por marca)
        </button>
        {dynamicsPresent.map((d) => (
          <button
            key={d}
            onClick={() => setDynamicFilter(d)}
            className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
              dynamicFilter === d ? "bg-brand-deep text-gold-soft" : "bg-surface-muted text-ink-soft"
            }`}
          >
            {EVENT_DYNAMIC_META[d as keyof typeof EVENT_DYNAMIC_META]?.label ?? d}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] text-ink-faint">
              <th className="py-2 pr-2">Marca</th>
              <th className="py-2 pr-2">IG da marca</th>
              <th className="py-2 pr-2">Participante(s)</th>
              <th className="py-2 pr-2">IG do(s) participante(s)</th>
              <th className="py-2 pr-2">Segmento</th>
              <th className="py-2 pr-2">Faturamento</th>
              <th className="py-2 pr-2">Dinâmica</th>
            </tr>
          </thead>
          <tbody>
            {dynamicFilter
              ? filtered.map((a) => (
                  <tr key={a.id} className="border-b border-border align-top">
                    <td className="py-2 pr-2 font-medium text-ink">{a.empresa ?? "—"}</td>
                    <td className="py-2 pr-2 text-ink-soft">{a.instagram ?? "—"}</td>
                    <td className="py-2 pr-2 text-ink-soft">{a.name}</td>
                    <td className="py-2 pr-2 text-ink-soft">{a.instagramPersonal ?? "—"}</td>
                    <td className="py-2 pr-2 text-ink-soft">{a.segmento ?? "—"}</td>
                    <td className="py-2 pr-2 text-ink-soft">{a.revenueRange ?? "—"}</td>
                    <td className="py-2 pr-2 text-ink-soft">{dynamicLabel(a)}</td>
                  </tr>
                ))
              : groupedByBrand?.map((group) => {
                  const first = group[0];
                  return (
                    <tr key={first.id} className="border-b border-border align-top">
                      <td className="py-2 pr-2 font-medium text-ink">{first.empresa ?? "—"}</td>
                      <td className="py-2 pr-2 text-ink-soft">{first.instagram ?? "—"}</td>
                      <td className="py-2 pr-2 text-ink-soft">{group.map((a) => a.name).join(", ")}</td>
                      <td className="py-2 pr-2 text-ink-soft">
                        {group.map((a) => a.instagramPersonal).filter(Boolean).join(", ") || "—"}
                      </td>
                      <td className="py-2 pr-2 text-ink-soft">{first.segmento ?? "—"}</td>
                      <td className="py-2 pr-2 text-ink-soft">{first.revenueRange ?? "—"}</td>
                      <td className="py-2 pr-2 text-ink-soft">
                        {[...new Set(group.map((a) => dynamicLabel(a)))].join(", ")}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
