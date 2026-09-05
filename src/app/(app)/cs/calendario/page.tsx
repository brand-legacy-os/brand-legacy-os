import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewCsDepartment, canEditAreaKpis, isAdmin } from "@/lib/permissions";
import { CsTabs } from "@/components/cs/cs-tabs";
import { CreateCsActionForm } from "@/components/cs/create-cs-action-form";
import { MONTH_LABELS } from "@/lib/finance";
import { formatDate } from "@/lib/format";
import { CultureBanner } from "@/components/dashboard/culture-banner";

const EVENT_STATUS_LABEL: Record<string, string> = {
  planejamento: "Planejamento",
  confirmado: "Confirmado",
  em_andamento: "Em andamento",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default async function CsCalendarioPage({
  searchParams,
}: PageProps<"/cs/calendario">) {
  const user = await requireUser();
  if (!canViewCsDepartment(user)) notFound();
  const sp = await searchParams;
  const yearParam = typeof sp.ano === "string" ? Number(sp.ano) : new Date().getFullYear();
  const year = Number.isFinite(yearParam) ? yearParam : new Date().getFullYear();

  const events = await prisma.event.findMany({
    where: { startDate: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) } },
    include: {
      attendees: { where: { customerId: { not: null } } },
      responsible: true,
    },
    orderBy: { startDate: "asc" },
  });

  const byMonth = new Map<number, typeof events>();
  for (const e of events) {
    const m = e.startDate.getMonth();
    byMonth.set(m, [...(byMonth.get(m) ?? []), e]);
  }

  const [actionCalendarItems, csActions] = await Promise.all([
    prisma.csActionCalendarItem.findMany(),
    prisma.csAction.findMany({ include: { createdBy: true }, orderBy: { date: "desc" } }),
  ]);
  const canManageActions = isAdmin(user) || canEditAreaKpis(user, "cs");

  const actionsByMonth = new Map<string, typeof actionCalendarItems>();
  for (const item of actionCalendarItems) {
    actionsByMonth.set(item.month, [...(actionsByMonth.get(item.month) ?? []), item]);
  }

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Cliente satisfeito é a prova real do que entregamos."
        subtitle="Renovação não se pede — se conquista, mentoria após mentoria, resultado após resultado."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Customer Success
          </h1>
          <p className="text-[13px] text-ink-soft">
            Calendário de endomarketing — aulas, encontros, webinars, experiências e imersões, com participação de mentorados.
          </p>
        </div>
        <form className="flex items-center gap-2" method="get">
          <select
            name="ano"
            defaultValue={String(year)}
            className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none"
          >
            {[year - 1, year, year + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button type="submit" className="h-9 rounded-full bg-surface-muted px-4 text-[12.5px] font-medium text-ink-soft hover:bg-border-strong/40">
            Ver
          </button>
        </form>
      </div>

      <CsTabs />

      <div className="flex flex-col gap-5">
        {MONTH_LABELS.map((label, idx) => {
          const monthEvents = byMonth.get(idx) ?? [];
          if (monthEvents.length === 0) return null;
          return (
            <section key={idx} className="flex flex-col gap-2.5">
              <h2 className="text-[13px] font-medium uppercase tracking-[0.06em] text-ink-faint">
                {label} {year}
              </h2>
              <div className="flex flex-col gap-2">
                {monthEvents.map((e) => {
                  const confirmed = e.attendees.filter((a) => a.confirmed).length;
                  const present = e.attendees.filter((a) => a.checkedIn).length;
                  return (
                    <Link
                      key={e.id}
                      href={`/cs/calendario/${e.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-(--radius-l) border border-border bg-surface p-4 hover:border-brand-deep-2"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">{e.name}</span>
                          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] font-medium text-ink-soft">
                            {e.type}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-ink-faint">
                          {formatDate(e.startDate)} · {EVENT_STATUS_LABEL[e.status] ?? e.status} · Responsável {e.responsible.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-ink-soft">
                        <span className="tnum">{e.attendees.length} mentorados convidados</span>
                        <span className="tnum">{confirmed} confirmados</span>
                        <span className="tnum">{present} presentes</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
        {events.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
            Nenhum evento com participação de mentorados encontrado em {year}.
          </p>
        )}
      </div>

      {/* Calendário de ações (referência real do time, somente leitura) */}
      <section className="flex flex-col gap-3">
        <div>
          <h2 className="text-[15px] font-medium text-ink">Calendário de ações</h2>
          <p className="text-[12.5px] text-ink-faint">
            Importado do calendário real do time (webinários, jantares, aulas de mentoria, hotseats) — referência, não editável aqui.
          </p>
        </div>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[720px] border-collapse text-[12.5px]">
            <thead>
              <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-[0.04em] text-ink-faint">
                <th className="px-3 py-2.5 font-medium">Data</th>
                <th className="px-3 py-2.5 font-medium">Ação</th>
                <th className="px-3 py-2.5 font-medium">Responsável</th>
                <th className="px-3 py-2.5 font-medium">Público</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {[...actionsByMonth.entries()].map(([month, items]) => (
                <Fragment key={month}>
                  <tr className="bg-surface-muted">
                    <td colSpan={5} className="px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-[0.04em] text-ink-faint">
                      {month}
                    </td>
                  </tr>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-b-0">
                      <td className="tnum px-3 py-2 text-ink-soft">{item.date}{item.time ? ` · ${item.time}` : ""}</td>
                      <td className="px-3 py-2 text-ink">{item.eventName}</td>
                      <td className="px-3 py-2 text-ink-soft">{item.responsible || "—"}</td>
                      <td className="px-3 py-2 text-ink-soft">{item.audience || "—"}</td>
                      <td className="px-3 py-2 text-ink-soft">{item.status || "—"}</td>
                    </tr>
                  ))}
                </Fragment>
              ))}
              {actionCalendarItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-ink-faint">Nenhum item importado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ações com mentorados criadas pelo time de CS */}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-[15px] font-medium text-ink">Ações com mentorados</h2>
            <p className="text-[12.5px] text-ink-faint">O que, como, onde, link e materiais — planejadas pelo time de CS.</p>
          </div>
          {canManageActions && <CreateCsActionForm />}
        </div>
        <div className="flex flex-col gap-2">
          {csActions.map((a) => (
            <div key={a.id} className="rounded-(--radius-l) border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-ink">{a.title}</span>
                <span className="text-[11.5px] text-ink-faint">{formatDate(a.date)} · {a.createdBy.name}</span>
              </div>
              {a.description && <p className="mt-1 text-[12.5px] text-ink-soft">{a.description}</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-[12px]">
                {a.location && <span className="text-ink-faint">📍 {a.location}</span>}
                {a.link && <a href={a.link} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Link →</a>}
                {a.materialsUrl && <a href={a.materialsUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-brand hover:underline">Materiais →</a>}
              </div>
            </div>
          ))}
          {csActions.length === 0 && (
            <p className="rounded-(--radius-l) border border-dashed border-border p-6 text-center text-[13px] text-ink-faint">
              Nenhuma ação com mentorados registrada ainda.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
