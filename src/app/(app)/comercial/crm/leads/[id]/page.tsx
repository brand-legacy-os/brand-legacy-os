import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewArea } from "@/lib/permissions";
import { formatCompactCurrency, formatDateTime } from "@/lib/format";
import { LEAD_FUNNEL_META, LEAD_ORIGIN_META, stageLabel } from "@/lib/crm";
import { EditLeadForm } from "@/components/crm/edit-lead-form";
import { AddLeadInteractionForm } from "@/components/crm/add-lead-interaction-form";
import { TaskAttachmentGroup } from "@/components/social/task-attachment-group";
import { addLeadAttachmentAction, deleteLeadAttachmentAction } from "@/lib/actions/crm";
import { DeleteLeadButton } from "@/components/crm/delete-lead-button";

export default async function LeadDetailPage({ params }: PageProps<"/comercial/crm/leads/[id]">) {
  const user = await requireUser();
  if (!canViewArea(user, "comercial")) notFound();
  const { id } = await params;

  const [lead, members] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { name: true } },
        interactions: { include: { author: true }, orderBy: { createdAt: "desc" } },
        attachments: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.user.findMany({
      where: { memberships: { some: { area: { slug: "comercial" } } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!lead) notFound();

  const origin = LEAD_ORIGIN_META[lead.origin];

  return (
    <>
      <div className="flex flex-col gap-1">
        <Link href="/comercial/crm" className="w-fit text-[12px] font-medium text-brand hover:underline">
          ← CRM
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-(family-name:--font-display) text-[26px] text-ink">{lead.name}</h1>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${origin.color}`}>{origin.label}</span>
            {lead.disqualified && (
              <span className="rounded-full bg-critical/15 px-2.5 py-1 text-[11px] font-medium text-critical">
                Desqualificado
              </span>
            )}
          </div>
        </div>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Valor estimado</p>
          <p className="tnum font-(family-name:--font-display) text-[20px] text-ink">
            {lead.value !== null ? formatCompactCurrency(lead.value) : "—"}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Funil</p>
          <p className="text-[15px] text-ink">{LEAD_FUNNEL_META[lead.funnel].label}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Etapa</p>
          <p className="text-[15px] text-ink">{stageLabel(lead.funnel, lead.stageKey)}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11.5px] text-ink-soft">Closer</p>
          <p className="text-[15px] text-ink">{lead.assignedTo?.name ?? "Sem closer atribuído"}</p>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-ink-faint">Empresa</p>
          <p className="text-[13px] text-ink">{lead.company ?? "—"}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-ink-faint">E-mail</p>
          <p className="text-[13px] text-ink">{lead.email ?? "—"}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-ink-faint">Telefone</p>
          <p className="text-[13px] text-ink">{lead.phone ?? "—"}</p>
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-ink-faint">Instagram</p>
          <p className="text-[13px] text-ink">{lead.instagram ?? "—"}</p>
        </div>
        {lead.notes && (
          <div className="col-span-full flex flex-col gap-1">
            <p className="text-[11px] text-ink-faint">Observações</p>
            <p className="text-[13px] leading-relaxed text-ink-soft">{lead.notes}</p>
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <EditLeadForm defaults={lead} members={members} />
        <DeleteLeadButton leadId={lead.id} />
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">Anexos</h2>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <TaskAttachmentGroup
            attachments={lead.attachments}
            kind="referencia"
            label="Links importantes"
            addAction={addLeadAttachmentAction}
            deleteAction={deleteLeadAttachmentAction}
            hiddenFieldName="leadId"
            hiddenFieldValue={lead.id}
            canManage
            allowUpload={false}
          />
          <TaskAttachmentGroup
            attachments={lead.attachments}
            kind="entrega"
            label="Arquivos"
            addAction={addLeadAttachmentAction}
            deleteAction={deleteLeadAttachmentAction}
            hiddenFieldName="leadId"
            hiddenFieldValue={lead.id}
            canManage
            allowUpload
          />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">Histórico de interações</h2>
          <AddLeadInteractionForm leadId={lead.id} />
        </div>
        <div className="flex flex-col gap-1.5">
          {lead.interactions.map((i) => (
            <div key={i.id} className="rounded-(--radius-s) border border-border bg-surface p-3">
              <p className="text-[12.5px] leading-relaxed text-ink-soft">{i.content}</p>
              <p className="mt-1 text-[11px] text-ink-faint">{i.author.name} · {formatDateTime(i.createdAt)}</p>
            </div>
          ))}
          {lead.interactions.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">Nenhuma interação registrada ainda.</p>
          )}
        </div>
      </section>
    </>
  );
}
