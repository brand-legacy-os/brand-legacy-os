import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import { hasFinanceRole, isFinanceUnlocked } from "@/lib/finance-auth";
import { EVENT_STATUS_META, computeEventStats, ATTENDEE_CATEGORY_META } from "@/lib/events";
import { EVENT_BUDGET_CATEGORY_META, sponsorshipGoalFor } from "@/lib/sponsors";
import {
  formatCompactCurrency,
  formatDate,
  formatDateTime,
  relativeTime,
} from "@/lib/format";
import { EventStatusSelect } from "@/components/events/event-status-select";
import { AddBudgetLineForm } from "@/components/events/add-budget-line-form";
import { AddAttendeeForm } from "@/components/events/add-attendee-form";
import { AttendeeRow } from "@/components/events/attendee-row";
import { EventNoteForm } from "@/components/events/event-note-form";
import { EditEventForm } from "@/components/events/edit-event-form";
import { BudgetLineCard } from "@/components/events/budget-line-card";
import { EventNpsForm } from "@/components/events/event-nps-form";
import { NpsExcelForm } from "@/components/events/nps-excel-form";
import { EventSponsorsSection } from "@/components/events/event-sponsors-section";
import { DinnerGuestsSection } from "@/components/events/dinner-guests-section";
import { CommsSection } from "@/components/events/comms-section";
import { DonutChart } from "@/components/charts/donut-chart";
import { GroupedBarChart } from "@/components/charts/grouped-bar-chart";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function EventDetailPage({
  params,
}: PageProps<"/eventos/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      responsible: true,
      budgetLines: { include: { payments: true }, orderBy: { createdAt: "asc" } },
      sponsors: { include: { installments: true }, orderBy: { createdAt: "asc" } },
      attendees: { orderBy: { name: "asc" } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
      cashMovements: { orderBy: { date: "asc" } },
      dinnerGuests: { orderBy: { createdAt: "asc" } },
      commsItems: { orderBy: { date: "asc" } },
    },
  });
  if (!event) notFound();

  const canManage = isAdmin(user) || isLeaderOf(user, "eventos");
  const canSeeFinance = hasFinanceRole(user) && (await isFinanceUnlocked());
  const stats = computeEventStats(event);

  const participationRate =
    stats.registeredCount && stats.presentCount !== null
      ? Math.round((stats.presentCount / stats.registeredCount) * 100)
      : null;

  const budgetPct =
    event.budgetPlanned && event.budgetPlanned > 0
      ? Math.round((stats.budgetActual / event.budgetPlanned) * 100)
      : null;

  const sponsorshipGoal = sponsorshipGoalFor(event.budgetPlanned);
  const sponsorPct = sponsorshipGoal > 0 ? Math.round((stats.sponsorRevenuePlanned / sponsorshipGoal) * 100) : null;

  // Pizza de resumo dos confirmados por Tipo (categoria do confirmado).
  const attendeesByCategory = new Map<string, number>();
  for (const a of event.attendees) {
    const label = ATTENDEE_CATEGORY_META[a.category]?.label ?? a.category;
    attendeesByCategory.set(label, (attendeesByCategory.get(label) ?? 0) + 1);
  }
  const attendeeCategoryPieData = [...attendeesByCategory.entries()].map(([label, value]) => ({ label, value }));

  // Pizza de custo por categoria (só realizado).
  const costByCategory = new Map<string, number>();
  for (const b of event.budgetLines) {
    const label = EVENT_BUDGET_CATEGORY_META[b.category]?.label ?? b.category;
    costByCategory.set(label, (costByCategory.get(label) ?? 0) + (b.actualValue ?? 0));
  }
  const pieData = [...costByCategory.entries()]
    .filter(([, v]) => v > 0)
    .map(([label, value]) => ({ label, value }));

  // Previsto x realizado por categoria, só deste evento.
  const categoriesWithData = Object.entries(EVENT_BUDGET_CATEGORY_META).filter(([key]) =>
    event.budgetLines.some((b) => b.category === key)
  );
  const plannedByCategory = categoriesWithData.map(
    ([key]) => event.budgetLines.filter((b) => b.category === key).reduce((s, b) => s + (b.plannedValue ?? 0), 0)
  );
  const actualByCategory = categoriesWithData.map(
    ([key]) => event.budgetLines.filter((b) => b.category === key).reduce((s, b) => s + (b.actualValue ?? 0), 0)
  );

  const npsComments = event.npsExcelComments ? event.npsExcelComments.split("\n").filter(Boolean) : [];

  return (
    <div className="flex flex-col gap-6">
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Experiência inesquecível é entrega, não sorte."
        subtitle="Cada detalhe planejado é respeito por quem confiou na Brand Legacy para estar na sala."
      />

      <Link
        href="/eventos"
        className="w-fit text-[12.5px] font-medium text-ink-soft hover:text-brand-deep"
      >
        ← Eventos
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-medium text-gold-ink">
              {event.type}
            </span>
            <span className="text-[12px] text-ink-faint">
              {formatDate(event.startDate)}
              {event.endDate.getTime() !== event.startDate.getTime()
                ? ` – ${formatDate(event.endDate)}`
                : ""}
              {event.location ? ` · ${event.location}` : ""}
            </span>
          </div>
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">
            {event.name}
          </h1>
          {event.description && (
            <p className="max-w-[62ch] text-[13.5px] text-ink-soft">
              {event.description}
            </p>
          )}
          <p className="text-[12px] text-ink-faint">
            Responsável: {event.responsible.name}
          </p>
          {event.venueAddress && (
            <p className="text-[12px] text-ink-faint">
              Local: {event.venueAddress}
              {event.venueCost ? ` · ${formatCompactCurrency(event.venueCost)}` : ""}
            </p>
          )}
        </div>
        {canManage ? (
          <EventStatusSelect eventId={event.id} status={event.status} />
        ) : (
          <span className="rounded-full bg-surface-muted px-3 py-1 text-[12px] font-medium text-ink-soft">
            {EVENT_STATUS_META[event.status].label}
          </span>
        )}
      </div>

      {canManage && (
        <EditEventForm
          eventId={event.id}
          name={event.name}
          type={event.type}
          startDate={event.startDate.toISOString().slice(0, 10)}
          endDate={event.endDate.toISOString().slice(0, 10)}
          location={event.location ?? ""}
          description={event.description ?? ""}
          budgetPlanned={event.budgetPlanned ? String(event.budgetPlanned) : ""}
          venueAddress={event.venueAddress ?? ""}
          venueCost={event.venueCost ? String(event.venueCost) : ""}
          venueNotes={event.venueNotes ?? ""}
          enpsDay1Url={event.enpsDay1Url ?? ""}
          enpsDay2Url={event.enpsDay2Url ?? ""}
          enpsDay3Url={event.enpsDay3Url ?? ""}
        />
      )}

      {/* Dashboard do evento */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Taxa de participação</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {participationRate !== null ? `${participationRate}%` : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            {stats.presentCount ?? "—"} presentes / {stats.registeredCount ?? "—"}{" "}
            inscritos
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">NPS do evento</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {stats.npsAverage !== null ? Math.round(stats.npsAverage) : "—"}
          </p>
          <p className="text-[11px] text-ink-faint">
            {stats.npsResponses ?? "—"} respostas
          </p>
          {canManage && (
            <div className="mt-2 flex flex-col gap-1.5 border-t border-border pt-2">
              <EventNpsForm
                eventId={event.id}
                npsAverage={event.npsAverage}
                npsResponses={event.npsResponses}
              />
              <NpsExcelForm eventId={event.id} />
            </div>
          )}
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Budget planejado × real</p>
          <p className="tnum font-(family-name:--font-display) text-[20px] text-ink">
            {formatCompactCurrency(stats.budgetActual)}
            {event.budgetPlanned
              ? ` / ${formatCompactCurrency(event.budgetPlanned)}`
              : ""}
          </p>
          <p
            className={`text-[11px] ${budgetPct !== null && budgetPct > 100 ? "text-critical" : "text-ink-faint"}`}
          >
            {budgetPct !== null ? `${budgetPct}% do previsto` : "sem budget definido"}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Patrocínio realizado × meta</p>
          <p className="tnum font-(family-name:--font-display) text-[20px] text-ink">
            {formatCompactCurrency(stats.sponsorRevenuePlanned)}
            {" / "}
            {formatCompactCurrency(sponsorshipGoal)}
          </p>
          <p className="text-[11px] text-ink-faint">
            {stats.sponsorCount ?? 0} patrocinador
            {stats.sponsorCount === 1 ? "" : "es"}
            {sponsorPct !== null ? ` · ${sponsorPct}% da meta` : ""}
          </p>
        </div>
      </div>

      {npsComments.length > 0 && (
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">Principais pontos levantados (NPS)</h2>
          <div className="flex flex-col gap-1.5">
            {npsComments.slice(0, 20).map((c, i) => (
              <p key={i} className="rounded-(--radius-s) bg-surface-muted px-3 py-2 text-[12.5px] text-ink-soft">
                {c}
              </p>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Orçamento */}
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Orçamento — previsto x realizado
          </h2>
          <div className="flex flex-col">
            {event.budgetLines.map((b) => (
              <BudgetLineCard key={b.id} line={b} canManage={canManage} />
            ))}
            {event.budgetLines.length === 0 && (
              <p className="py-3 text-[12.5px] text-ink-faint">
                Nenhum item de orçamento lançado ainda.
              </p>
            )}
          </div>
          {canManage && <AddBudgetLineForm eventId={event.id} />}
        </section>

        <EventSponsorsSection sponsors={event.sponsors} />
      </div>

      {(pieData.length > 0 || categoriesWithData.length > 0) && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {pieData.length > 0 && (
            <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
              <h2 className="text-[13px] font-medium text-ink-soft">Custo por categoria</h2>
              <DonutChart
                data={pieData}
                formatValue={formatCompactCurrency}
                centerLabel="realizado"
                centerAsCurrency
                ariaLabel="Custo por categoria de orçamento"
              />
            </section>
          )}
          {categoriesWithData.length > 0 && (
            <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
              <h2 className="text-[13px] font-medium text-ink-soft">Previsto x realizado por categoria</h2>
              <GroupedBarChart
                categories={categoriesWithData.map(([, meta]) => meta.label)}
                series={[
                  { label: "Previsto", values: plannedByCategory },
                  { label: "Realizado", values: actualByCategory },
                ]}
                formatValue={formatCompactCurrency}
              />
            </section>
          )}
        </div>
      )}

      {/* Movimentações de caixa vinculadas — cruzamento com o Financeiro */}
      {canSeeFinance && event.cashMovements.length > 0 && (
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Movimentações de caixa deste evento
            </h2>
            <Link
              href="/financeiro/caixa"
              className="text-[12px] font-medium text-brand hover:underline"
            >
              Ver no Financeiro →
            </Link>
          </div>
          <div className="flex flex-col">
            {event.cashMovements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between border-t border-border py-2 first:border-t-0"
              >
                <div className="flex flex-col">
                  <span className="text-[12.5px] text-ink">{m.description}</span>
                  <span className="text-[11px] text-ink-faint">{formatDate(m.date)}</span>
                </div>
                <span
                  className={`tnum text-[12.5px] font-medium ${m.amount >= 0 ? "text-positive" : "text-critical"}`}
                >
                  {formatCompactCurrency(m.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confirmados */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Confirmados ({event.attendees.length})
          </h2>
          {event.attendees.length === 0 && stats.registeredCount !== null && (
            <span className="text-[11.5px] text-ink-faint">
              Histórico: {stats.registeredCount} inscritos · {stats.presentCount ?? "—"}{" "}
              presentes · {stats.mentoradosCount ?? "—"} mentorados ·{" "}
              {stats.guestCount ?? "—"} convidados · {stats.noShowCount ?? "—"} no-show
            </span>
          )}
        </div>
        {attendeeCategoryPieData.length > 1 && (
          <DonutChart
            data={attendeeCategoryPieData}
            formatValue={(v) => `${v}`}
            centerLabel="confirmados"
            ariaLabel="Resumo dos confirmados por tipo"
          />
        )}
        {event.attendees.length > 0 ? (
          <div className="flex flex-col">
            {event.attendees.map((a) => (
              <AttendeeRow key={a.id} attendee={a} canManage={canManage} />
            ))}
          </div>
        ) : (
          <p className="text-[12.5px] text-ink-faint">
            A lista nominal de confirmados começa vazia — os números acima vêm do
            histórico da planilha. Novos eventos usam esta lista diretamente.
          </p>
        )}
        {canManage && <AddAttendeeForm eventId={event.id} />}
      </section>

      <DinnerGuestsSection eventId={event.id} guests={event.dinnerGuests} canManage={canManage} />
      <CommsSection eventId={event.id} items={event.commsItems} canManage={canManage} />

      {(event.enpsDay1Url || event.enpsDay2Url || event.enpsDay3Url) && (
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">Links de eNPS diário</h2>
          <div className="flex flex-wrap gap-3">
            {[event.enpsDay1Url, event.enpsDay2Url, event.enpsDay3Url].map(
              (url, i) =>
                url && (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="text-[12.5px] text-brand hover:underline">
                    Dia {i + 1} →
                  </a>
                )
            )}
          </div>
        </section>
      )}

      {/* Mural do evento */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Mural de avisos e observações
        </h2>
        <div className="flex flex-col gap-3">
          {event.notes.map((n) => (
            <div key={n.id} className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-deep text-[10px] font-semibold text-gold-soft">
                {n.author.avatarInitials}
              </span>
              <div className="flex flex-col">
                <p className="text-[13px] leading-snug text-ink">
                  <span className="font-medium">{n.author.name}</span>{" "}
                  {n.content}
                </p>
                <span className="text-[11px] text-ink-faint">
                  {relativeTime(n.createdAt)} · {formatDateTime(n.createdAt)}
                </span>
              </div>
            </div>
          ))}
          {event.notes.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhum aviso ainda.</p>
          )}
        </div>
        <EventNoteForm eventId={event.id} />
      </section>
    </div>
  );
}
