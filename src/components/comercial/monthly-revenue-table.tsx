"use client";

import { useState } from "react";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import type { loadCustomersByMonth } from "@/lib/comercial";

type MonthlyData = Awaited<ReturnType<typeof loadCustomersByMonth>>;

export function MonthlyRevenueTable({ months }: { months: MonthlyData }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
      <table className="w-full min-w-[820px] border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-border text-left text-ink-faint">
            <th className="py-2 pl-3 pr-3 font-medium">Mês</th>
            <th className="px-2 py-2 text-right font-medium">Vendas</th>
            <th className="px-2 py-2 text-right font-medium">Faturamento</th>
            <th className="px-2 py-2 text-right font-medium">Ticket médio</th>
            <th className="px-2 py-2 text-right font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => {
            const isOpen = expanded === m.monthKey;
            return (
              <>
                <tr
                  key={m.monthKey}
                  className="cursor-pointer border-b border-border last:border-b-0 hover:bg-surface-muted"
                  onClick={() => setExpanded(isOpen ? null : m.monthKey)}
                >
                  <td className="py-2 pl-3 pr-3 text-ink">{m.label}</td>
                  <td className="tnum px-2 py-2 text-right text-ink-soft">{m.count || "—"}</td>
                  <td className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.revenue > 0 ? formatCompactCurrency(m.revenue) : "—"}
                  </td>
                  <td className="tnum px-2 py-2 text-right text-ink-soft">
                    {m.avgTicket > 0 ? formatCompactCurrency(m.avgTicket) : "—"}
                  </td>
                  <td className="px-2 py-2 text-right text-ink-faint">{m.count > 0 ? (isOpen ? "▲" : "▼") : ""}</td>
                </tr>
                {isOpen && m.customers.length > 0 && (
                  <tr key={`${m.monthKey}-detail`} className="border-b border-border bg-surface-muted last:border-b-0">
                    <td colSpan={5} className="px-3 py-3">
                      <div className="flex flex-col gap-1.5">
                        {m.customers.map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-[12px]">
                            <span className="text-ink">
                              {c.name} <span className="text-ink-faint">· {c.product}</span>
                            </span>
                            <span className="tnum text-ink-soft">
                              {formatCompactCurrency(c.value)} · {formatDate(c.date)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
