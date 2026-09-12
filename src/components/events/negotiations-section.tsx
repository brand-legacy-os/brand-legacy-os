"use client";

import { useMemo, useState } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatCurrency, formatDate } from "@/lib/format";

type Negotiation = {
  id: string;
  negotiationDate: string | Date;
  value: number | null;
  paymentConditions: string | null;
  leadInfo: string | null;
  notes: string | null;
  seller: { id: string; name: string } | null;
};
type Attendee = {
  id: string;
  name: string;
  empresa: string | null;
  sales: { id: string }[];
  negotiations: Negotiation[];
};

type Filter = "todos" | "negociando" | "comprou";

export function NegotiationsSection({
  attendees,
  exportHref,
}: {
  eventId: string;
  attendees: Attendee[];
  users: { id: string; name: string }[];
  canManage: boolean;
  exportHref?: string;
}) {
  const [filter, setFilter] = useState<Filter>("todos");

  const rows = useMemo(() => {
    const withNegotiations = attendees.filter((a) => a.negotiations.length > 0 || a.sales.length > 0);
    return withNegotiations.filter((a) => {
      if (filter === "negociando") return a.sales.length === 0 && a.negotiations.length > 0;
      if (filter === "comprou") return a.sales.length > 0;
      return true;
    });
  }, [attendees, filter]);

  if (attendees.every((a) => a.negotiations.length === 0 && a.sales.length === 0)) return null;

  return (
    <CollapsibleSection
      title="Negociações do evento"
      right={
        exportHref ? (
          <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["todos", "Todos"],
            ["negociando", "Em negociação"],
            ["comprou", "Já comprou"],
          ] as [Filter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
              filter === key ? "bg-brand-deep text-gold-soft" : "bg-surface-muted text-ink-soft"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        {rows.map((a) => (
          <div key={a.id} className="flex flex-col gap-1 border-t border-border py-2.5 first:border-t-0">
            <span className="text-[12.5px] text-ink">
              {a.name}
              {a.empresa ? ` · ${a.empresa}` : ""}
              {a.sales.length > 0 && (
                <span className="ml-2 rounded-full bg-positive-bg px-2 py-0.5 text-[10.5px] font-medium text-positive">
                  Comprou
                </span>
              )}
            </span>
            {a.negotiations.map((n) => (
              <div key={n.id} className="text-[11.5px] text-ink-faint">
                {formatDate(new Date(n.negotiationDate))}
                {n.value !== null ? ` · ${formatCurrency(n.value)}` : ""}
                {n.seller ? ` · ${n.seller.name}` : ""}
                {n.paymentConditions ? ` · ${n.paymentConditions}` : ""}
                {n.leadInfo ? ` · ${n.leadInfo}` : ""}
                {n.notes ? ` · ${n.notes}` : ""}
              </div>
            ))}
          </div>
        ))}
        {rows.length === 0 && <p className="py-2 text-[12.5px] text-ink-faint">Nada nesse filtro ainda.</p>}
      </div>
    </CollapsibleSection>
  );
}
