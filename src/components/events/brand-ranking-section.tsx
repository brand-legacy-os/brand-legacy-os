"use client";

import { useMemo, useState } from "react";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { formatCurrency } from "@/lib/format";
import { parseRevenueBand, sortByIcpFit, type RevenueBand } from "@/lib/events-icp";

type Attendee = {
  id: string;
  name: string;
  empresa: string | null;
  instagram: string | null;
  revenueRange: string | null;
  segmento: string | null;
  phone: string | null;
  email: string | null;
  checkins: { date: string | Date; present: boolean }[];
  negotiations: { value: number | null }[];
  sales: { value: number }[];
};

type BrandRow = {
  key: string;
  empresa: string;
  instagram: string | null;
  revenueRange: string | null;
  revenueBand: RevenueBand | null;
  segmento: string | null;
  members: Attendee[];
};

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function groupByBrand(attendees: Attendee[]): BrandRow[] {
  const groups = new Map<string, BrandRow>();
  for (const a of attendees) {
    const empresa = a.empresa?.trim();
    if (!empresa) continue;
    const key = normalize(empresa);
    const existing = groups.get(key);
    if (existing) {
      existing.members.push(a);
      if (!existing.instagram && a.instagram) existing.instagram = a.instagram;
      if (!existing.revenueRange && a.revenueRange) {
        existing.revenueRange = a.revenueRange;
        existing.revenueBand = parseRevenueBand(a.revenueRange);
      }
      if (!existing.segmento && a.segmento) existing.segmento = a.segmento;
    } else {
      groups.set(key, {
        key,
        empresa,
        instagram: a.instagram,
        revenueRange: a.revenueRange,
        revenueBand: parseRevenueBand(a.revenueRange),
        segmento: a.segmento,
        members: [a],
      });
    }
  }
  return [...groups.values()];
}

const ICP_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "club", label: "Club" },
  { value: "master", label: "Master" },
] as const;

export function BrandRankingSection({ attendees, exportHref }: { attendees: Attendee[]; exportHref?: string }) {
  const [icp, setIcp] = useState<"" | "club" | "master">("");

  const rows = useMemo(() => {
    const grouped = groupByBrand(attendees);
    return sortByIcpFit(grouped, icp || null);
  }, [attendees, icp]);

  if (rows.length === 0) return null;

  return (
    <CollapsibleSection
      title={`Ranking de marcas — mapa comercial (${rows.length})`}
      right={
        exportHref ? (
          <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
        ) : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11.5px] text-ink-faint">ICP:</span>
        {ICP_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setIcp(opt.value)}
            className={`rounded-full px-3 py-1 text-[11.5px] font-medium ${
              icp === opt.value ? "bg-brand-deep text-gold-soft" : "bg-surface-muted text-ink-soft"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-2 text-[10.5px] text-ink-faint">
          (ICP Club: faturamento acima de 500 mil/mês · ICP Master: 150 mil a 500 mil/mês — marcas fora do ICP
          continuam na lista, só mais abaixo)
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] text-ink-faint">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Marca</th>
              <th className="py-2 pr-2">Instagram</th>
              <th className="py-2 pr-2">Faturamento</th>
              <th className="py-2 pr-2">Segmento</th>
              <th className="py-2 pr-2">Confirmado(s)</th>
              <th className="py-2 pr-2">Contato(s)</th>
              <th className="py-2 pr-2">Presença diária</th>
              <th className="py-2 pr-2">Negociações</th>
              <th className="py-2 pr-2">Vendas</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const negotiations = row.members.flatMap((m) => m.negotiations);
              const negotiationTotal = negotiations.reduce((s, n) => s + (n.value ?? 0), 0);
              const sales = row.members.flatMap((m) => m.sales);
              const salesTotal = sales.reduce((s, sale) => s + sale.value, 0);
              return (
                <tr key={row.key} className="border-b border-border align-top">
                  <td className="py-2 pr-2 tnum text-ink-faint">{i + 1}</td>
                  <td className="py-2 pr-2 font-medium text-ink">{row.empresa}</td>
                  <td className="py-2 pr-2 text-ink-soft">{row.instagram ?? "—"}</td>
                  <td className="py-2 pr-2 text-ink-soft">{row.revenueRange ?? "—"}</td>
                  <td className="py-2 pr-2 text-ink-soft">{row.segmento ?? "—"}</td>
                  <td className="py-2 pr-2 text-ink-soft">{row.members.map((m) => m.name).join(", ")}</td>
                  <td className="py-2 pr-2 text-ink-soft">
                    {row.members.map((m) => m.phone ?? m.email).filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-2 text-ink-soft">
                    {row.members
                      .map((m) => {
                        const present = m.checkins.filter((c) => c.present).length;
                        return m.checkins.length > 0 ? `${m.name}: ${present}/${m.checkins.length}` : null;
                      })
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-2 tnum text-ink-soft">
                    {negotiations.length > 0 ? `${negotiations.length} · ${formatCurrency(negotiationTotal)}` : "—"}
                  </td>
                  <td className="py-2 pr-2 tnum text-ink-soft">
                    {sales.length > 0 ? `${sales.length} · ${formatCurrency(salesTotal)}` : "—"}
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
