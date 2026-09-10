import { FUNNEL_STAGES, isTerminalStage } from "@/lib/crm";
import { formatCompactCurrency } from "@/lib/format";
import { LeadCard } from "./lead-card";
import type { LeadFunnel, LeadOrigin } from "@prisma/client";

type LeadRow = {
  id: string;
  name: string;
  company: string | null;
  origin: LeadOrigin;
  value: number | null;
  disqualified: boolean;
  stageKey: string;
  assignedTo: { name: string } | null;
};

export function LeadBoard({
  funnel,
  leads,
  canManage,
}: {
  funnel: LeadFunnel;
  leads: LeadRow[];
  canManage: boolean;
}) {
  const stages = FUNNEL_STAGES[funnel];
  const byStage = new Map<string, LeadRow[]>();
  for (const lead of leads) {
    const key = byStage.has(lead.stageKey) ? lead.stageKey : stages[0].key;
    byStage.set(key, [...(byStage.get(key) ?? []), lead]);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {stages.map((stage) => {
        const stageLeads = byStage.get(stage.key) ?? [];
        const total = stageLeads.reduce((s, l) => s + (l.value ?? 0), 0);
        return (
          <div
            key={stage.key}
            className={`flex w-[260px] shrink-0 flex-col gap-2 rounded-(--radius-l) border border-border p-3 ${
              isTerminalStage(funnel, stage.key) ? "bg-surface-muted" : "bg-canvas"
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-[12px] font-medium text-ink-soft">{stage.label}</span>
              <span className="text-[11px] text-ink-faint">
                {stageLeads.length} lead{stageLeads.length === 1 ? "" : "s"}
                {total > 0 ? ` · ${formatCompactCurrency(total)}` : ""}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {stageLeads.map((lead) => (
                <LeadCard key={lead.id} lead={lead} funnel={funnel} canManage={canManage} />
              ))}
              {stageLeads.length === 0 && (
                <p className="py-2 text-center text-[11px] text-ink-faint">Nenhum lead aqui.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
