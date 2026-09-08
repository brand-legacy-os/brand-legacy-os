"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

export function CalendarMonthNav({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(y: number, m: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ano", String(y));
    params.set("mes", String(m));
    params.delete("dia");
    router.push(`${pathname}?${params.toString()}`);
  }

  function shift(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    goTo(d.getFullYear(), d.getMonth() + 1);
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => shift(-1)}
        className="flex h-8 w-8 items-center justify-center rounded-(--radius-s) border border-border text-ink-soft hover:bg-surface-muted"
      >
        ←
      </button>
      <select
        value={month}
        onChange={(e) => goTo(year, Number(e.target.value))}
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12.5px] outline-none"
      >
        {MONTH_NAMES.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </select>
      <select
        value={year}
        onChange={(e) => goTo(Number(e.target.value), month)}
        className="h-8 rounded-(--radius-s) border border-border bg-surface px-2 text-[12.5px] outline-none"
      >
        {Array.from({ length: 5 }, (_, i) => year - 2 + i).map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
      <button
        onClick={() => shift(1)}
        className="flex h-8 w-8 items-center justify-center rounded-(--radius-s) border border-border text-ink-soft hover:bg-surface-muted"
      >
        →
      </button>
    </div>
  );
}
