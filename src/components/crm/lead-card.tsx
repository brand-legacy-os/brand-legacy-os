import Link from "next/link";
import { formatCompactCurrency } from "@/lib/format";
import { LEAD_ORIGIN_META, FUNNEL_STAGES } from "@/lib/crm";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { moveLeadStageAction } from "@/lib/actions/crm";
import type { LeadFunnel, LeadOrigin } from "@prisma/client";

type LeadCardData = {
  id: string;
  name: string;
  company: string | null;
  origin: LeadOrigin;
  value: number | null;
  disqualified: boolean;
  stageKey: string;
  assignedTo: { name: string } | null;
};

export function LeadCard({ lead, funnel, canManage }: { lead: LeadCardData; funnel: LeadFunnel; canManage: boolean }) {
  const origin = LEAD_ORIGIN_META[lead.origin];

  return (
    <div className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-3">
      <Link href={`/comercial/crm/leads/${lead.id}`} className="flex flex-col gap-1">
        <span className="truncate text-[13px] font-medium text-ink hover:text-brand-deep hover:underline">
          {lead.name}
        </span>
        {lead.company && <span className="truncate text-[11.5px] text-ink-faint">{lead.company}</span>}
      </Link>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${origin.color}`}>{origin.label}</span>
        {lead.disqualified && (
          <span className="rounded-full bg-critical/15 px-2 py-0.5 text-[10.5px] font-medium text-critical">
            Desqualificado
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="tnum text-[12.5px] font-medium text-ink">
          {lead.value !== null ? formatCompactCurrency(lead.value) : "—"}
        </span>
        <span className="truncate text-[11px] text-ink-faint">{lead.assignedTo?.name ?? "Sem closer"}</span>
      </div>
      {canManage && (
        <AutoSubmitSelect
          action={moveLeadStageAction}
          hiddenName="leadId"
          hiddenValue={lead.id}
          name="stageKey"
          defaultValue={lead.stageKey}
          options={FUNNEL_STAGES[funnel].map((s) => ({ value: s.key, label: s.label }))}
        />
      )}
    </div>
  );
}
