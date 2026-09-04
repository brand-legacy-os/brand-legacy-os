import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewCustomer, canManageCustomer } from "@/lib/permissions";
import {
  CUSTOMER_STATUS_META,
  INTERACTION_KIND_META,
  computeHealthScore,
  HEALTH_TIER_META,
  MEETING_TRACK_BY_PRODUCT,
  meetingTarget,
} from "@/lib/cs";
import { StatusPill } from "@/components/ui/status-pill";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { AddInteractionForm } from "@/components/cs/add-interaction-form";
import { RenewalSection } from "@/components/cs/renewal-section";
import { AddExperienceForm } from "@/components/cs/add-experience-form";
import { LinkCustomerToEventForm } from "@/components/cs/link-customer-to-event-form";
import { EditCustomerForm } from "@/components/cs/edit-customer-form";
import { AddMeetingForm } from "@/components/cs/add-meeting-form";
import { MeetingRow } from "@/components/cs/meeting-row";
import { CustomerNotesForm } from "@/components/cs/customer-notes-form";
import { updateCustomerStatusAction, toggleFollowUpDoneAction } from "@/lib/actions/cs";
import { formatCompactCurrency, formatDate, formatDateTime, TASK_STATUS_META } from "@/lib/format";
import { taskStatusTone } from "@/components/ui/status-pill";

export default async function CustomerDetailPage({
  params,
}: PageProps<"/cs/mentorados/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      cs: true,
      interactions: { include: { author: true }, orderBy: { createdAt: "desc" } },
      meetings: { orderBy: { date: "asc" } },
      renewals: { orderBy: { dueDate: "asc" } },
      experiences: { include: { event: true, followUpOwner: true }, orderBy: { createdAt: "desc" } },
      attendances: { include: { event: true }, orderBy: { createdAt: "desc" } },
      tasks: { include: { assignee: true }, orderBy: { deadline: "asc" } },
    },
  });
  if (!customer) notFound();
  if (!canViewCustomer(user, customer)) notFound();
  const canManage = canManageCustomer(user, customer);

  const [csReps, allUsers, allEvents] = await Promise.all([
    prisma.membership.findMany({ where: { area: { slug: "cs" } }, include: { user: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
    prisma.event.findMany({ orderBy: { startDate: "desc" }, select: { id: true, name: true } }),
  ]);

  const now = new Date();
  const experienceScores = customer.experiences.filter((e) => e.score !== null).map((e) => e.score as number);
  const openHighPriority = customer.tasks.filter(
    (t) => !["concluida", "cancelada"].includes(t.status) && ["alta", "urgente"].includes(t.priority)
  ).length;
  const health = computeHealthScore({
    now,
    customer,
    lastInteractionAt: customer.lastContactAt,
    attendances: customer.attendances,
    experienceScores,
    openHighPriorityTasks: openHighPriority,
  });

  const toDateInput = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
      <Link href="/cs/mentorados" className="w-fit text-[12.5px] font-medium text-ink-soft hover:text-brand-deep">
        ← Base de mentorados
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-medium text-gold-ink">
              {customer.product}
            </span>
            {customer.company && <span className="text-[12px] text-ink-faint">{customer.company}</span>}
          </div>
          <h1 className="font-(family-name:--font-display) text-[24px] text-ink">{customer.name}</h1>
          <p className="text-[12px] text-ink-faint">CS responsável: {customer.cs.name}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {canManage ? (
            <AutoSubmitSelect
              action={updateCustomerStatusAction}
              hiddenName="customerId"
              hiddenValue={customer.id}
              name="status"
              defaultValue={customer.status}
              options={Object.entries(CUSTOMER_STATUS_META).map(([key, meta]) => ({ value: key, label: meta.label }))}
            />
          ) : (
            <span className="rounded-full bg-surface-muted px-3 py-1 text-[12px] font-medium text-ink-soft">
              {CUSTOMER_STATUS_META[customer.status].label}
            </span>
          )}
          <StatusPill
            label={`Health: ${HEALTH_TIER_META[health.tier].label}${health.score !== null ? ` (${health.score})` : ""}`}
            tone={health.tier === "saudavel" ? "positive" : health.tier === "atencao" ? "warning" : health.tier === "risco" ? "critical" : "neutral"}
          />
        </div>
      </div>

      {canManage && (
        <EditCustomerForm
          customer={{
            id: customer.id,
            name: customer.name,
            company: customer.company,
            product: customer.product,
            csId: customer.csId,
            entryDate: toDateInput(customer.entryDate),
            startDate: toDateInput(customer.startDate),
            endDate: toDateInput(customer.endDate),
            renewalDate: toDateInput(customer.renewalDate),
            mrr: customer.mrr?.toString() ?? "",
            contractValue: customer.contractValue?.toString() ?? "",
            contractUrl: customer.contractUrl ?? "",
            otherDocsUrl: customer.otherDocsUrl ?? "",
            notes: customer.notes ?? "",
          }}
          csReps={csReps.map((m) => ({ id: m.userId, name: m.user.name }))}
        />
      )}

      {/* Dados financeiros e datas */}
      <div className="grid grid-cols-2 gap-4 rounded-(--radius-l) border border-border bg-surface p-5 sm:grid-cols-4">
        <div>
          <p className="text-[11px] text-ink-faint">MRR</p>
          <p className="tnum text-[15px] font-medium text-ink">{customer.mrr ? formatCompactCurrency(customer.mrr) : "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-ink-faint">Valor contratado</p>
          <p className="tnum text-[15px] font-medium text-ink">{customer.contractValue ? formatCompactCurrency(customer.contractValue) : "—"}</p>
        </div>
        <div>
          <p className="text-[11px] text-ink-faint">Entrada</p>
          <p className="tnum text-[13px] text-ink">{formatDate(customer.entryDate)}</p>
        </div>
        <div>
          <p className="text-[11px] text-ink-faint">Renovação</p>
          <p className="tnum text-[13px] text-ink">{customer.renewalDate ? formatDate(customer.renewalDate) : "—"}</p>
        </div>
      </div>

      {/* Health score breakdown */}
      {health.factors.length > 0 && (
        <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">Composição do Health Score</h2>
          {health.factors.map((f) => (
            <div key={f.label} className="flex items-center justify-between text-[12.5px]">
              <span className="text-ink-soft">{f.label}</span>
              <span className="tnum text-ink">{f.value}</span>
            </div>
          ))}
        </section>
      )}

      {/* Documentos */}
      <div className="flex flex-wrap gap-2">
        {customer.contractUrl && (
          <a href={customer.contractUrl} target="_blank" rel="noopener noreferrer" className="h-8 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-brand hover:bg-surface-muted">
            Ver contrato →
          </a>
        )}
        {customer.otherDocsUrl && (
          <a href={customer.otherDocsUrl} target="_blank" rel="noopener noreferrer" className="h-8 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-brand hover:bg-surface-muted">
            Outros documentos →
          </a>
        )}
        {!customer.contractUrl && (
          <span className="h-8 rounded-full bg-critical-bg px-3 text-[12px] font-medium leading-8 text-critical">
            Contrato não localizado
          </span>
        )}
      </div>

      <CustomerNotesForm customerId={customer.id} notes={customer.notes} />

      {/* Encontros de mentoria */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Encontros ({customer.meetings.length})
          </h2>
          {(() => {
            const target = meetingTarget(customer.product);
            const individualCount = customer.meetings.filter((m) => m.type === "individual").length;
            return target ? (
              <span className="text-[12px] text-ink-faint">
                {individualCount} de {target} encontros individuais
              </span>
            ) : null;
          })()}
        </div>
        <div className="flex flex-col gap-2">
          {customer.meetings.map((m) => (
            <MeetingRow key={m.id} meeting={m} canManage={canManage} />
          ))}
          {customer.meetings.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhum encontro registrado ainda.</p>
          )}
        </div>
        {canManage && (
          <AddMeetingForm
            customerId={customer.id}
            labelSuggestions={MEETING_TRACK_BY_PRODUCT[customer.product] ?? []}
          />
        )}
      </section>

      {/* Histórico / interações */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Histórico ({customer.interactions.length})
        </h2>
        <div className="flex flex-col gap-2">
          {customer.interactions.map((i) => (
            <div key={i.id} className="border-t border-border pt-2 first:border-t-0">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] font-medium text-ink-soft">
                  {INTERACTION_KIND_META[i.kind].label}
                </span>
                <span className="text-[11px] text-ink-faint">
                  {i.author.name} · {formatDateTime(i.createdAt)}
                </span>
              </div>
              <p className="mt-1 text-[13px] text-ink">{i.content}</p>
            </div>
          ))}
          {customer.interactions.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhuma interação registrada ainda.</p>
          )}
        </div>
        {canManage && <AddInteractionForm customerId={customer.id} />}
      </section>

      {/* Renovações */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">Renovações</h2>
        <RenewalSection customerId={customer.id} renewals={customer.renewals} />
      </section>

      {/* Eventos e experiências */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Eventos ({customer.attendances.length})
        </h2>
        <div className="flex flex-col gap-2">
          {customer.attendances.map((a) => {
            const experience = customer.experiences.find((e) => e.eventId === a.eventId);
            return (
              <div key={a.id} className="flex flex-col gap-1 border-t border-border py-2 first:border-t-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/eventos/${a.eventId}`} className="text-[13px] font-medium text-ink hover:text-brand-deep hover:underline">
                    {a.event.name}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${a.confirmed ? "bg-positive-bg text-positive" : "bg-surface-muted text-ink-faint"}`}>
                      {a.confirmed ? "Confirmado" : "Convidado"}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${a.checkedIn ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"}`}>
                      {a.checkedIn ? "Presente" : "Ausente"}
                    </span>
                  </div>
                </div>
                {experience ? (
                  <div className="rounded-(--radius-s) bg-surface-muted p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-medium text-ink">
                        Experiência {experience.score !== null ? `· nota ${experience.score}/10` : ""}
                      </span>
                      {experience.needsFollowUp && (
                        <form action={toggleFollowUpDoneAction}>
                          <input type="hidden" name="experienceId" value={experience.id} />
                          <button className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${experience.followUpDone ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"}`}>
                            {experience.followUpDone ? "Follow-up feito" : "Follow-up pendente"}
                          </button>
                        </form>
                      )}
                    </div>
                    {experience.feedback && <p className="mt-1 text-[12px] text-ink-soft">{experience.feedback}</p>}
                  </div>
                ) : (
                  canManage && <AddExperienceForm customerId={customer.id} events={[{ id: a.eventId, name: a.event.name }]} users={allUsers} />
                )}
              </div>
            );
          })}
          {customer.attendances.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhuma participação em evento registrada ainda.</p>
          )}
        </div>
        {canManage && (
          <LinkCustomerToEventForm
            customerId={customer.id}
            customerName={customer.name}
            customerCompany={customer.company}
            events={allEvents}
          />
        )}
      </section>

      {/* Tarefas */}
      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">Tarefas ({customer.tasks.length})</h2>
          <Link href={`/cs/tarefas?cliente=${customer.id}`} className="text-[12px] font-medium text-brand hover:underline">
            + Criar tarefa →
          </Link>
        </div>
        <div className="flex flex-col gap-1.5">
          {customer.tasks.map((t) => (
            <div key={t.id} className="flex items-center justify-between border-t border-border py-2 first:border-t-0">
              <div className="flex flex-col">
                <Link href={`/workflow/${t.id}`} className="text-[13px] text-ink hover:text-brand-deep hover:underline">
                  {t.title}
                </Link>
                <span className="text-[11px] text-ink-faint">{t.assignee.name} · {formatDate(t.deadline)}</span>
              </div>
              <StatusPill label={TASK_STATUS_META[t.status].label} tone={taskStatusTone(t.status)} />
            </div>
          ))}
          {customer.tasks.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhuma tarefa vinculada ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
