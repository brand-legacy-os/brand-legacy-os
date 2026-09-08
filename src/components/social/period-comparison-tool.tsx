"use client";

import { useMemo, useState } from "react";

function formatCompactNumber(v: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(v);
}

type Post = {
  id: string;
  postedAt: Date | string | null;
  alcance: number | null;
  curtidas: number | null;
  comentarios: number | null;
  salvamentos: number | null;
  compartilhamentos: number | null;
};

function todayInput() {
  return new Date().toISOString().slice(0, 10);
}
function firstOfMonthInput() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
function firstOfPrevMonthInput() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() - 1, 1).toISOString().slice(0, 10);
}
function lastOfPrevMonthInput() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 0).toISOString().slice(0, 10);
}

function summarize(posts: Post[], from: string, to: string) {
  if (!from || !to) return null;
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59`);
  const inRange = posts.filter((p) => {
    if (!p.postedAt) return false;
    const d = new Date(p.postedAt);
    return d >= start && d <= end;
  });
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const alcance = inRange.reduce((s, p) => s + (p.alcance ?? 0), 0);
  const interactions = inRange.reduce(
    (s, p) => s + (p.curtidas ?? 0) + (p.comentarios ?? 0) + (p.salvamentos ?? 0) + (p.compartilhamentos ?? 0),
    0
  );
  return {
    postCount: inRange.length,
    alcance,
    alcanceMedioPorPost: inRange.length > 0 ? alcance / inRange.length : 0,
    alcanceMedioDiario: alcance / days,
    interactions,
    engagementPct: alcance > 0 ? (interactions / alcance) * 100 : null,
  };
}

export function PeriodComparisonTool({ profileId, posts }: { profileId: string; posts: Post[] }) {
  const [fromA, setFromA] = useState(firstOfMonthInput());
  const [toA, setToA] = useState(todayInput());
  const [fromB, setFromB] = useState(firstOfPrevMonthInput());
  const [toB, setToB] = useState(lastOfPrevMonthInput());

  const summaryA = useMemo(() => summarize(posts, fromA, toA), [posts, fromA, toA]);
  const summaryB = useMemo(() => summarize(posts, fromB, toB), [posts, fromB, toB]);

  function delta(a: number | null, b: number | null) {
    if (a === null || b === null || b === 0) return null;
    return ((a - b) / b) * 100;
  }

  const rows: { label: string; format: (v: number) => string; a: number | null; b: number | null }[] = summaryA && summaryB
    ? [
        { label: "Posts no período", format: (v) => String(Math.round(v)), a: summaryA.postCount, b: summaryB.postCount },
        { label: "Alcance total", format: formatCompactNumber, a: summaryA.alcance, b: summaryB.alcance },
        { label: "Alcance médio por post", format: formatCompactNumber, a: summaryA.alcanceMedioPorPost, b: summaryB.alcanceMedioPorPost },
        { label: "Alcance médio diário", format: formatCompactNumber, a: summaryA.alcanceMedioDiario, b: summaryB.alcanceMedioDiario },
        { label: "Interações totais", format: formatCompactNumber, a: summaryA.interactions, b: summaryB.interactions },
        { label: "Engajamento por alcance", format: (v) => `${v.toFixed(1)}%`, a: summaryA.engagementPct, b: summaryB.engagementPct },
      ]
    : [];

  return (
    <section key={profileId} className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-[13px] font-medium text-ink-soft">Comparar períodos</h2>
        <p className="text-[11px] text-ink-faint">
          Ex.: alcance médio diário de setembro contra agosto — escolha dois intervalos e compare
          lado a lado. Calculado a partir dos posts capturados (data real de cada post).
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 rounded-(--radius-s) bg-surface-muted p-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">Período A</span>
          <div className="flex items-center gap-2">
            <input type="date" value={fromA} onChange={(e) => setFromA(e.target.value)} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
            <span className="text-ink-faint">–</span>
            <input type="date" value={toA} onChange={(e) => setToA(e.target.value)} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 rounded-(--radius-s) bg-surface-muted p-3">
          <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">Período B</span>
          <div className="flex items-center gap-2">
            <input type="date" value={fromB} onChange={(e) => setFromB(e.target.value)} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
            <span className="text-ink-faint">–</span>
            <input type="date" value={toB} onChange={(e) => setToB(e.target.value)} className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12px] outline-none" />
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
                <th className="py-2 pr-3 font-medium">Métrica</th>
                <th className="px-2 py-2 text-right font-medium">A</th>
                <th className="px-2 py-2 text-right font-medium">B</th>
                <th className="px-2 py-2 text-right font-medium">Variação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const d = delta(r.a, r.b);
                return (
                  <tr key={r.label} className="border-b border-border last:border-b-0">
                    <td className="py-2 pr-3 text-ink">{r.label}</td>
                    <td className="tnum px-2 py-2 text-right text-ink-soft">{r.a !== null ? r.format(r.a) : "—"}</td>
                    <td className="tnum px-2 py-2 text-right text-ink-soft">{r.b !== null ? r.format(r.b) : "—"}</td>
                    <td className={`tnum px-2 py-2 text-right font-medium ${d !== null && d < 0 ? "text-critical" : d !== null && d > 0 ? "text-positive" : "text-ink-faint"}`}>
                      {d !== null ? `${d > 0 ? "▲" : "▼"} ${Math.abs(d).toFixed(1)}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
