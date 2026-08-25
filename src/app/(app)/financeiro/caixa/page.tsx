import Link from "next/link";
import { requireFinanceAccess } from "@/lib/finance-auth";
import { prisma } from "@/lib/db";
import { cashPositionAt } from "@/lib/finance";
import { formatCompactCurrency, formatDateFull } from "@/lib/format";
import { CashMovementForm } from "@/components/finance/cash-movement-form";
import { FinanceTabs } from "@/components/finance/finance-tabs";

type RangeKey = "hoje" | "amanha" | "7d" | "15d" | "30d" | "mes";

const RANGE_OPTIONS: { key: RangeKey; label: string }[] = [
  { key: "hoje", label: "Hoje" },
  { key: "amanha", label: "Amanhã" },
  { key: "7d", label: "Próximos 7 dias" },
  { key: "15d", label: "Próximos 15 dias" },
  { key: "30d", label: "Próximos 30 dias" },
  { key: "mes", label: "Este mês" },
];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function resolveRange(key: RangeKey, now: Date) {
  const today = startOfDay(now);
  switch (key) {
    case "amanha": {
      const d = new Date(today.getTime() + 86400000);
      return { start: d, end: d };
    }
    case "7d":
      return { start: today, end: new Date(today.getTime() + 6 * 86400000) };
    case "15d":
      return { start: today, end: new Date(today.getTime() + 14 * 86400000) };
    case "30d":
      return { start: today, end: new Date(today.getTime() + 29 * 86400000) };
    case "mes":
      return {
        start: today,
        end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
      };
    default:
      return { start: today, end: today };
  }
}

export default async function CaixaPage({
  searchParams,
}: PageProps<"/financeiro/caixa">) {
  await requireFinanceAccess();
  const sp = await searchParams;
  const customFrom = typeof sp.from === "string" ? sp.from : "";
  const customTo = typeof sp.to === "string" ? sp.to : "";
  const rangeKey = (typeof sp.range === "string" ? sp.range : "7d") as RangeKey;

  const [accounts, movements, events] = await Promise.all([
    prisma.cashAccount.findMany(),
    prisma.cashMovement.findMany({ orderBy: { date: "asc" }, include: { event: true } }),
    prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startDate: "desc" } }),
  ]);

  const now = new Date();
  // Date-only strings parse as UTC (ECMA-262) — anchoring to local noon
  // avoids the range shifting a day in timezones behind UTC.
  const { start, end } =
    customFrom && customTo
      ? {
          start: startOfDay(new Date(`${customFrom}T12:00:00`)),
          end: startOfDay(new Date(`${customTo}T12:00:00`)),
        }
      : resolveRange(rangeKey, now);

  const days: Date[] = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + 86400000)) {
    days.push(new Date(d));
  }

  const currentPosition = cashPositionAt(accounts, movements, now);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Financeiro
          </p>
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">
            Posição de caixa
          </h1>
          <p className="text-[13px] text-ink-soft">
            Saldo atual: <span className="tnum font-medium text-ink">{formatCompactCurrency(currentPosition)}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap rounded-full border border-border bg-surface p-1">
            {RANGE_OPTIONS.map((opt) => (
              <Link
                key={opt.key}
                href={`/financeiro/caixa?range=${opt.key}`}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] transition-colors ${
                  !customFrom && rangeKey === opt.key
                    ? "bg-brand-deep font-medium text-gold-soft"
                    : "text-ink-soft hover:bg-surface-muted"
                }`}
              >
                {opt.label}
              </Link>
            ))}
          </div>
          <form
            action="/financeiro/caixa"
            className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1"
          >
            <input
              type="date"
              name="from"
              defaultValue={customFrom}
              className="h-7 border-none bg-transparent text-[12.5px] text-ink-soft outline-none"
            />
            <span className="text-ink-faint">–</span>
            <input
              type="date"
              name="to"
              defaultValue={customTo}
              className="h-7 border-none bg-transparent text-[12.5px] text-ink-soft outline-none"
            />
            <button
              type="submit"
              className={`h-7 rounded-full px-3 text-[12px] font-medium ${
                customFrom
                  ? "bg-brand-deep text-gold-soft"
                  : "bg-surface-muted text-ink-soft"
              }`}
            >
              Aplicar
            </button>
          </form>
        </div>
      </div>

      <FinanceTabs />

      <CashMovementForm events={events} />

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[680px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Posição inicial</th>
              <th className="px-4 py-3 font-medium">Movimentação</th>
              <th className="px-4 py-3 font-medium">Posição final</th>
            </tr>
          </thead>
          <tbody>
            {days.map((day) => {
              const dayStart = startOfDay(day);
              const dayEnd = new Date(dayStart.getTime() + 86399999);
              const opening = cashPositionAt(
                accounts,
                movements,
                new Date(dayStart.getTime() - 1)
              );
              const closing = cashPositionAt(accounts, movements, dayEnd);
              const dayMovements = movements.filter(
                (m) => m.date >= dayStart && m.date <= dayEnd
              );
              const isToday = startOfDay(now).getTime() === dayStart.getTime();

              return (
                <tr
                  key={day.toISOString()}
                  className={`border-b border-border align-top last:border-b-0 ${isToday ? "bg-gold-tint/30" : ""}`}
                >
                  <td className="px-4 py-3 font-medium text-ink">
                    {formatDateFull(day)}
                    {isToday && (
                      <span className="ml-1.5 text-[11px] font-normal text-gold-ink">
                        hoje
                      </span>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 text-ink-soft">
                    {formatCompactCurrency(opening)}
                  </td>
                  <td className="px-4 py-3">
                    {dayMovements.length === 0 ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {dayMovements.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <span className="text-ink-soft">
                              {m.description}
                              {m.event && (
                                <Link
                                  href={`/eventos/${m.event.id}`}
                                  className="ml-1.5 rounded-full bg-gold-tint px-1.5 py-0.5 text-[10px] font-medium text-gold-ink hover:opacity-80"
                                >
                                  {m.event.name}
                                </Link>
                              )}
                            </span>
                            <span
                              className={`tnum whitespace-nowrap ${m.amount >= 0 ? "text-positive" : "text-critical"}`}
                            >
                              {formatCompactCurrency(m.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="tnum px-4 py-3 font-medium text-ink">
                    {formatCompactCurrency(closing)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
