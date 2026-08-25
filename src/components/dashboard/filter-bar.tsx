"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/period";

type Option = { value: string; label: string };

export function FilterBar({
  areaOptions,
  responsibleOptions,
}: {
  areaOptions: Option[];
  responsibleOptions: Option[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPeriod = (searchParams.get("periodo") as PeriodKey) || "mes";
  const currentArea = searchParams.get("area") || "";
  const currentResp = searchParams.get("responsavel") || "";
  const currentFrom = searchParams.get("from") || "";
  const currentTo = searchParams.get("to") || "";

  const [customOpen, setCustomOpen] = useState(currentPeriod === "personalizado");
  const [from, setFrom] = useState(currentFrom);
  const [to, setTo] = useState(currentTo);

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function applyCustomRange() {
    if (!from || !to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("periodo", "personalizado");
    params.set("from", from);
    params.set("to", to);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex flex-wrap rounded-full border border-border bg-surface p-1">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => {
              setCustomOpen(false);
              update("periodo", opt.key);
            }}
            className={`rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
              currentPeriod === opt.key
                ? "bg-brand-deep font-medium text-gold-soft"
                : "text-ink-soft hover:bg-surface-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={() => setCustomOpen((v) => !v)}
          className={`rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
            currentPeriod === "personalizado"
              ? "bg-brand-deep font-medium text-gold-soft"
              : "text-ink-soft hover:bg-surface-muted"
          }`}
        >
          Período personalizado
        </button>
      </div>

      {customOpen && (
        <div className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-7 border-none bg-transparent text-[12.5px] text-ink-soft outline-none"
          />
          <span className="text-ink-faint">–</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-7 border-none bg-transparent text-[12.5px] text-ink-soft outline-none"
          />
          <button
            onClick={applyCustomRange}
            disabled={!from || !to}
            className="h-7 rounded-full bg-brand-deep px-3 text-[12px] font-medium text-gold-soft disabled:opacity-40"
          >
            Aplicar
          </button>
        </div>
      )}

      {areaOptions.length > 1 && (
        <select
          value={currentArea}
          onChange={(e) => update("area", e.target.value)}
          className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none"
        >
          <option value="">Todas as áreas</option>
          {areaOptions.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
      )}

      {responsibleOptions.length > 0 && (
        <select
          value={currentResp}
          onChange={(e) => update("responsavel", e.target.value)}
          className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none"
        >
          <option value="">Todos os responsáveis</option>
          {responsibleOptions.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
