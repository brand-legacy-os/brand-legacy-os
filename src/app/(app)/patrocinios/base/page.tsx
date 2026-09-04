import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewSponsors } from "@/lib/permissions";
import { formatCompactCurrency } from "@/lib/format";
import { SPONSOR_TIER_META, SPONSOR_DEAL_STATUS_META } from "@/lib/sponsors";
import { StatusPill } from "@/components/ui/status-pill";
import { PatrociniosTabs } from "@/components/patrocinios/patrocinios-tabs";

export default async function PatrociniosBasePage() {
  const user = await requireUser();
  if (!canViewSponsors(user)) notFound();

  const sponsors = await prisma.sponsor.findMany({
    include: { event: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Patrocínios
        </h1>
      </div>

      <PatrociniosTabs />

      <p className="max-w-[72ch] text-[13px] text-ink-soft">
        Base de patrocinadores ({sponsors.length}) — clique em um card para ver o
        perfil completo, parcelas, histórico de interações, vendas de leads e
        tarefas.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sponsors.map((s) => {
          const tierMeta = SPONSOR_TIER_META[s.tier];
          const statusMeta = SPONSOR_DEAL_STATUS_META[s.status];
          return (
            <Link
              key={s.id}
              href={`/patrocinios/${s.id}`}
              className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-4 transition-shadow hover:shadow-[0_4px_16px_-8px_rgba(23,23,15,0.15)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-[13.5px] font-medium text-ink">{s.name}</span>
                  <span className="text-[11px] text-ink-faint">{s.contactName}</span>
                </div>
                <span className="w-fit shrink-0 rounded-full bg-gold-tint px-2 py-0.5 text-[10px] font-medium text-gold-ink">
                  {tierMeta.label}
                </span>
              </div>
              <span className="tnum font-(family-name:--font-display) text-[20px] text-ink">
                {formatCompactCurrency(s.totalValue)}
              </span>
              {s.event && (
                <span className="text-[11.5px] text-ink-soft">Evento: {s.event.name}</span>
              )}
              {s.isAnnual && (
                <span className="w-fit rounded-full bg-surface-muted px-2 py-0.5 text-[10.5px] text-ink-soft">
                  Anual/recorrente
                </span>
              )}
              <StatusPill label={statusMeta.label} tone={statusMeta.tone} className="w-fit" />
            </Link>
          );
        })}
        {sponsors.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint sm:col-span-2 lg:col-span-3">
            Nenhum patrocinador cadastrado ainda.
          </p>
        )}
      </div>
    </>
  );
}
