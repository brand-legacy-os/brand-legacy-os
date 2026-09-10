import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewArea, getCrmRole } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { LEAD_FUNNEL_META } from "@/lib/crm";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { CrmFilterBar } from "@/components/crm/crm-filter-bar";
import { LeadBoard } from "@/components/crm/lead-board";
import { CreateLeadForm } from "@/components/crm/create-lead-form";
import type { LeadFunnel, LeadOrigin, Prisma } from "@prisma/client";

export default async function CrmPage({ searchParams }: PageProps<"/comercial/crm">) {
  const user = await requireUser();
  if (!canViewArea(user, "comercial")) notFound();
  const sp = await searchParams;
  const role = getCrmRole(user);

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);
  const funnel = ((sp.funil as string) in LEAD_FUNNEL_META ? sp.funil : "eventos") as LeadFunnel;
  const originParam = (sp.origem as LeadOrigin) || undefined;
  const closerParam = (sp.closer as string) || undefined;
  const showAll = sp.todos === "1";

  const roleWhere = (() => {
    switch (role) {
      case "lider":
        return {};
      case "closer":
        return showAll ? {} : { assignedToId: user.id };
      case "sdr":
        return {
          OR: [{ disqualified: true }, { origin: { in: ["indicacao", "prospeccao_ativa"] as LeadOrigin[] } }],
        };
      case "social_selling":
        return { origin: { in: ["organico", "email_marketing"] as LeadOrigin[] } };
    }
  })();

  const where: Prisma.LeadWhereInput = {
    ...roleWhere,
    funnel,
    createdAt: { gte: period.start, lte: period.end },
    ...(role === "lider" && originParam ? { origin: originParam } : {}),
    ...(role === "lider" && closerParam ? { assignedToId: closerParam } : {}),
  };

  const [leads, comercialMembers] = await Promise.all([
    prisma.lead.findMany({
      where,
      include: { assignedTo: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: { memberships: { some: { area: { slug: "comercial" } } } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Resultado é o que sustenta a autoridade."
        subtitle="Autorresponsabilidade, entrega e dados reais guiando cada decisão comercial — sem atalho, sem desculpa."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Comercial</p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">CRM</h1>
          <p className="max-w-[72ch] text-[13px] text-ink-soft">
            Funis de {Object.values(LEAD_FUNNEL_META).map((m) => m.label).join(", ")} — etapas iguais às do
            GoHighLevel. Fase de esqueleto: leads criados e movidos aqui direto, ainda não sincronizados com o
            GoHighLevel real.
          </p>
        </div>
        <Link href="/areas/comercial" className="text-[12.5px] font-medium text-brand hover:underline">
          ← Voltar pra Comercial
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <CrmFilterBar role={role} closerOptions={role === "lider" ? comercialMembers : []} />
        <CreateLeadForm funnel={funnel} members={comercialMembers} />
      </div>

      <LeadBoard funnel={funnel} leads={leads} canManage />
    </>
  );
}
