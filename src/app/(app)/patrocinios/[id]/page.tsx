import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewSponsors, canManageSponsors } from "@/lib/permissions";
import { formatCompactCurrency, formatCurrency, formatDate, formatDateTime, TASK_STATUS_META } from "@/lib/format";
import {
  SPONSOR_TIER_META,
  SPONSOR_PAYMENT_METHOD_META,
  SPONSOR_DEAL_STATUS_META,
  sponsorPaidValue,
} from "@/lib/sponsors";
import { StatusPill, taskStatusTone } from "@/components/ui/status-pill";
import { EditSponsorForm } from "@/components/patrocinios/edit-sponsor-form";
import { SponsorInstallments } from "@/components/patrocinios/sponsor-installments";
import { AddSponsorInteractionForm } from "@/components/patrocinios/add-sponsor-interaction-form";
import { AddSponsorLeadSaleForm } from "@/components/patrocinios/add-sponsor-lead-sale-form";
import { AddSponsorTaskForm } from "@/components/patrocinios/add-sponsor-task-form";
import { deleteSponsorLeadSaleAction, toggleSponsorPaidAction } from "@/lib/actions/sponsors";

export default async function SponsorDetailPage({
  params,
}: PageProps<"/patrocinios/[id]">) {
  const user = await requireUser();
  if (!canViewSponsors(user)) notFound();
  const { id } = await params;

  const sponsor = await prisma.sponsor.findUnique({
    where: { id },
    include: {
      event: true,
      createdBy: true,
      installments: { orderBy: { number: "asc" } },
      interactions: { include: { author: true }, orderBy: { createdAt: "desc" } },
      leadSales: { orderBy: { createdAt: "desc" } },
      tasks: { include: { assignee: true }, orderBy: { deadline: "asc" } },
    },
  });
  if (!sponsor) notFound();
  const canManage = canManageSponsors(user);

  const [events, eventosArea, allUsers] = await Promise.all([
    prisma.event.findMany({ orderBy: { startDate: "desc" }, select: { id: true, name: true } }),
    prisma.area.findUnique({ where: { slug: "eventos" } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const paid = sponsorPaidValue(sponsor);
  const roiTotal = sponsor.leadSales.reduce((s, l) => s + l.value, 0);
  const tierMeta = SPONSOR_TIER_META[sponsor.tier];
  const methodMeta = SPONSOR_PAYMENT_METHOD_META[sponsor.paymentMethod];
  const statusMeta = SPONSOR_DEAL_STATUS_META[sponsor.status];

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/patrocinios/base" className="w-fit text-[12px] font-medium text-brand hover:underline">
          ← Base de patrocinadores
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">{sponsor.name}</h1>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-gold-tint px-2.5 py-1 text-[11px] font-medium text-gold-ink">
              {tierMeta.label}
            </span>
            <StatusPill label={statusMeta.label} tone={statusMeta.tone} />
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Valor total do contrato</p>
          <p className="tnum font-(family-name:--font-display) text-[20px] text-ink">{formatCurrency(sponsor.totalValue)}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Recebido</p>
          <p className="tnum font-(family-name:--font-display) text-[20px] text-positive">{formatCurrency(paid)}</p>
          {canManage && sponsor.paymentPlan === "avista" && (
            <form action={toggleSponsorPaidAction} className="mt-1.5">
              <input type="hidden" name="sponsorId" value={sponsor.id} />
              <button
                type="submit"
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  paid > 0 ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"
                }`}
              >
                {paid > 0 ? "Pago — desmarcar" : "Marcar como pago"}
              </button>
            </form>
          )}
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Meio de pagamento</p>
          <p className="text-[15px] text-ink">{methodMeta.label}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Evento</p>
          <p className="text-[15px] text-ink">
            {sponsor.event ? (
              <Link href={`/eventos/${sponsor.event.id}`} className="text-brand hover:underline">
                {sponsor.event.name}
              </Link>
            ) : sponsor.isAnnual ? (
              "Anual/recorrente"
            ) : (
              "—"
            )}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-ink-faint">CNPJ</p>
          <p className="text-[13px] text-ink">{sponsor.cnpj}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-ink-faint">Pessoa de contato</p>
          <p className="text-[13px] text-ink">{sponsor.contactName} · {sponsor.contactPhone}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-ink-faint">Tempo de palco</p>
          <p className="text-[13px] text-ink">
            {sponsor.hasStageTime ? `${sponsor.stageTimeMinutes ?? "—"} min` : "Sem tempo de palco"}
          </p>
        </div>
        {sponsor.paymentLink && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">Link de pagamento</p>
            <a href={sponsor.paymentLink} target="_blank" rel="noopener noreferrer" className="text-[13px] text-brand hover:underline">
              Abrir →
            </a>
          </div>
        )}
        {sponsor.paymentProofUrl && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">Comprovante</p>
            <a href={sponsor.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-brand hover:underline">
              Ver arquivo →
            </a>
          </div>
        )}
        {sponsor.nfUrl && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">NF</p>
            <a href={sponsor.nfUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-brand hover:underline">
              Ver arquivo →
            </a>
          </div>
        )}
        {sponsor.logoUrl && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">Logo</p>
            <a href={sponsor.logoUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-brand hover:underline">
              Ver arquivo →
            </a>
          </div>
        )}
        {sponsor.presentationUrl && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">Apresentação</p>
            <a href={sponsor.presentationUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-brand hover:underline">
              Abrir →
            </a>
          </div>
        )}
        {sponsor.videoUrl && (
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">Vídeo</p>
            <a href={sponsor.videoUrl} target="_blank" rel="noopener noreferrer" className="text-[13px] text-brand hover:underline">
              Abrir →
            </a>
          </div>
        )}
        {sponsor.activation && (
          <div className="col-span-full flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">Ativação</p>
            <p className="text-[13px] leading-relaxed text-ink-soft">{sponsor.activation}</p>
          </div>
        )}
      </section>

      {canManage && (
        <EditSponsorForm
          sponsorId={sponsor.id}
          events={events}
          defaults={{
            name: sponsor.name,
            cnpj: sponsor.cnpj,
            contactName: sponsor.contactName,
            contactPhone: sponsor.contactPhone,
            totalValue: sponsor.totalValue,
            paymentPlan: sponsor.paymentPlan,
            paymentMethod: sponsor.paymentMethod,
            paymentLink: sponsor.paymentLink,
            hasStageTime: sponsor.hasStageTime,
            stageTimeMinutes: sponsor.stageTimeMinutes,
            eventId: sponsor.eventId,
            isAnnual: sponsor.isAnnual,
            tier: sponsor.tier,
            status: sponsor.status,
            statusOther: sponsor.statusOther,
            presentationUrl: sponsor.presentationUrl,
            videoUrl: sponsor.videoUrl,
            activation: sponsor.activation,
            installments: sponsor.installments,
          }}
        />
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">Parcelas</h2>
        <SponsorInstallments sponsorId={sponsor.id} installments={sponsor.installments} canManage={canManage} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">Vendas de leads (ROI)</h2>
          {canManage && <AddSponsorLeadSaleForm sponsorId={sponsor.id} />}
        </div>
        <div className="flex flex-col gap-1.5">
          {sponsor.leadSales.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-(--radius-s) bg-surface-muted px-3 py-2">
              <div className="flex flex-col">
                <span className="text-[12.5px] text-ink">{l.description || "Venda"}</span>
                <span className="text-[11px] text-ink-faint">{l.saleDate ? formatDate(l.saleDate) : formatDate(l.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="tnum text-[13px] font-medium text-positive">{formatCompactCurrency(l.value)}</span>
                {canManage && (
                  <form action={deleteSponsorLeadSaleAction}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="sponsorId" value={sponsor.id} />
                    <button type="submit" className="text-[11px] text-ink-faint hover:text-critical">
                      remover
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {sponsor.leadSales.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhuma venda registrada ainda.</p>
          )}
          {sponsor.leadSales.length > 0 && (
            <p className="text-[11.5px] text-ink-faint">
              Total em vendas originadas: <span className="tnum font-medium text-ink">{formatCompactCurrency(roiTotal)}</span>
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">Histórico de interações</h2>
          {canManage && <AddSponsorInteractionForm sponsorId={sponsor.id} />}
        </div>
        <div className="flex flex-col gap-1.5">
          {sponsor.interactions.map((i) => (
            <div key={i.id} className="rounded-(--radius-s) border border-border bg-surface p-3">
              <p className="text-[12.5px] leading-relaxed text-ink-soft">{i.content}</p>
              <p className="mt-1 text-[11px] text-ink-faint">{i.author.name} · {formatDateTime(i.createdAt)}</p>
            </div>
          ))}
          {sponsor.interactions.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhuma interação registrada ainda.</p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">Tarefas ({sponsor.tasks.length})</h2>
          {canManage && eventosArea && (
            <AddSponsorTaskForm sponsorId={sponsor.id} areaId={eventosArea.id} members={allUsers} />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {sponsor.tasks.map((t) => (
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
          {sponsor.tasks.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhuma tarefa vinculada ainda.</p>
          )}
        </div>
      </section>
    </>
  );
}
