import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import { EVENT_STATUS_META, computeEventStats } from "@/lib/events";
import { formatCompactCurrency, formatDate } from "@/lib/format";
import { CreateEventForm } from "@/components/events/create-event-form";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { StatTile } from "@/components/dashboard/stat-tile";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { TrendChart } from "@/components/finance/trend-chart";

export default async function EventosPage() {
  const user = await requireUser();
  const canManage = isAdmin(user) || isLeaderOf(user, "eventos");

  const events = await prisma.event.findMany({
    include: {
      attendees: true,
      sponsors: { include: { installments: true } },
      budgetLines: true,
    },
    orderBy: { startDate: "asc" },
  });

  const totalBudgetPlanned = events.reduce(
    (s, e) => s + (e.budgetPlanned ?? 0),
    0
  );
  const totalBudgetActual = events.reduce(
    (s, e) => s + computeEventStats(e).budgetActual,
    0
  );
  const totalSponsorRealized = events.reduce(
    (s, e) => s + computeEventStats(e).sponsorRevenueRealized,
    0
  );

  const budgetedEvents = events.filter((e) => e.budgetPlanned);
  const enpsEvents = events.filter((e) => computeEventStats(e).npsAverage !== null);

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Experiência inesquecível é entrega, não sorte."
        subtitle="Cada detalhe planejado é respeito por quem confiou na Brand Legacy para estar na sala."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Eventos
          </h1>
          <p className="text-[13px] text-ink-soft">
            Imersões, summits, experiences e jantares — budget, confirmados e
            patrocínios de cada evento.
          </p>
          <Link
            href="/areas/eventos"
            className="mt-1 w-fit text-[12.5px] font-medium text-brand hover:underline"
          >
            Ver tarefas e projetos da área →
          </Link>
        </div>
        {canManage && <CreateEventForm />}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Budget previsto (total)" value={formatCompactCurrency(totalBudgetPlanned)} />
        <StatTile label="Gasto real (total)" value={formatCompactCurrency(totalBudgetActual)} />
        <StatTile label="Patrocínio recebido (total)" value={formatCompactCurrency(totalSponsorRealized)} />
        <StatTile label="Eventos cadastrados" value={String(events.length)} />
      </div>

      {(budgetedEvents.length > 0 || enpsEvents.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {budgetedEvents.length > 0 && (
            <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
              <h2 className="text-[13px] font-medium text-ink-soft">Previsto x realizado por evento</h2>
              <GroupedBarChart
                categories={budgetedEvents.map((e) => e.name)}
                series={[
                  { label: "Previsto", values: budgetedEvents.map((e) => e.budgetPlanned ?? 0) },
                  { label: "Realizado", values: budgetedEvents.map((e) => computeEventStats(e).budgetActual) },
                ]}
                formatValue={formatCompactCurrency}
              />
            </section>
          )}
          {enpsEvents.length > 0 && (
            <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
              <h2 className="text-[13px] font-medium text-ink-soft">Histórico de eNPS</h2>
              <TrendChart
                points={enpsEvents.map((e) => ({
                  label: e.name.length > 14 ? `${e.name.slice(0, 14)}…` : e.name,
                  value: Math.round(computeEventStats(e).npsAverage ?? 0),
                }))}
                formatValue={(v) => String(Math.round(v))}
              />
            </section>
          )}
        </div>
      )}

      {/* Budget e eNPS não são séries mensais — são propriedades de cada
          evento, então em vez de um filtro por período, aqui é uma
          comparação evento a evento. */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Budget e eNPS por evento
        </h2>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
                <th className="px-4 py-3 font-medium">Evento</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Budget realizado / previsto</th>
                <th className="px-4 py-3 font-medium">eNPS</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => {
                const stats = computeEventStats(event);
                const pct =
                  event.budgetPlanned && event.budgetPlanned > 0
                    ? Math.round((stats.budgetActual / event.budgetPlanned) * 100)
                    : null;
                return (
                  <tr
                    key={event.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-muted"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/eventos/${event.id}`}
                        className="font-medium text-ink hover:text-brand-deep hover:underline"
                      >
                        {event.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {EVENT_STATUS_META[event.status].label}
                    </td>
                    <td className="tnum px-4 py-3 text-ink-soft">
                      {event.budgetPlanned ? (
                        <>
                          {formatCompactCurrency(stats.budgetActual)} /{" "}
                          {formatCompactCurrency(event.budgetPlanned)}
                          {pct !== null && (
                            <span className={pct > 100 ? "ml-1.5 text-critical" : "ml-1.5 text-ink-faint"}>
                              ({pct}%)
                            </span>
                          )}
                        </>
                      ) : stats.budgetActual ? (
                        formatCompactCurrency(stats.budgetActual)
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="tnum px-4 py-3 text-ink-soft">
                      {stats.npsAverage !== null
                        ? `${Math.round(stats.npsAverage)}${stats.npsResponses ? ` (${stats.npsResponses} respostas)` : ""}`
                        : "—"}
                    </td>
                  </tr>
                );
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-faint">
                    Nenhum evento cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => {
          const stats = computeEventStats(event);
          const pct =
            event.budgetPlanned && event.budgetPlanned > 0
              ? Math.round((stats.budgetActual / event.budgetPlanned) * 100)
              : null;
          return (
            <Link
              key={event.id}
              href={`/eventos/${event.id}`}
              className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5 transition-shadow hover:shadow-[0_4px_16px_-8px_rgba(23,23,15,0.15)] hover:border-brand-deep-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="rounded-full bg-gold-tint px-2.5 py-0.5 text-[10.5px] font-medium text-gold-ink">
                  {event.type}
                </span>
                <span className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[10.5px] font-medium text-ink-soft">
                  {EVENT_STATUS_META[event.status].label}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-medium text-ink">
                  {event.name}
                </span>
                <span className="text-[12px] text-ink-faint">
                  {formatDate(event.startDate)}
                  {event.endDate.getTime() !== event.startDate.getTime()
                    ? ` – ${formatDate(event.endDate)}`
                    : ""}
                  {event.location ? ` · ${event.location}` : ""}
                </span>
              </div>

              <div className="mt-1 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11.5px] text-ink-faint">
                  <span>Budget</span>
                  <span className="tnum">
                    {event.budgetPlanned
                      ? `${formatCompactCurrency(stats.budgetActual)} / ${formatCompactCurrency(event.budgetPlanned)}`
                      : stats.budgetActual
                        ? formatCompactCurrency(stats.budgetActual)
                        : "sem budget definido"}
                  </span>
                </div>
                {pct !== null && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-surface-muted">
                    <span
                      className={`block h-full rounded-full ${pct > 100 ? "bg-critical" : "bg-brand"}`}
                      style={{ width: `${Math.min(100, Math.max(2, pct))}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-1 grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
                <div className="flex flex-col">
                  <span className="tnum text-[14px] font-medium text-ink">
                    {stats.registeredCount ?? "—"}
                  </span>
                  <span className="text-[10.5px] text-ink-faint">inscritos</span>
                </div>
                <div className="flex flex-col">
                  <span className="tnum text-[14px] font-medium text-ink">
                    {stats.sponsorCount ?? "—"}
                  </span>
                  <span className="text-[10.5px] text-ink-faint">
                    patrocinadores
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="tnum text-[14px] font-medium text-ink">
                    {stats.npsAverage !== null ? Math.round(stats.npsAverage) : "—"}
                  </span>
                  <span className="text-[10.5px] text-ink-faint">
                    NPS{stats.npsResponses ? ` (${stats.npsResponses})` : ""}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
