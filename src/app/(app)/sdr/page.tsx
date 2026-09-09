import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canViewArea, isAdmin } from "@/lib/permissions";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { loadChannelBreakdown } from "@/lib/comercial";
import { ChannelBreakdownSection } from "@/components/comercial/channel-breakdown-section";

export default async function SdrPage({ searchParams }: PageProps<"/sdr">) {
  const user = await requireUser();
  if (!isAdmin(user) && !canViewArea(user, "comercial")) notFound();
  const sp = await searchParams;

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const breakdown = await loadChannelBreakdown("sdr", period.start, period.end);

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Resultado é o que sustenta a autoridade."
        subtitle="Autorresponsabilidade, entrega e dados reais guiando cada decisão comercial — sem atalho, sem desculpa."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Área</p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">SDR</h1>
        <p className="max-w-[72ch] text-[13px] text-ink-soft">
          Prospecção ativa (Reativação/Recuperação) — direto do CRM (GoHighLevel), pipelines classificados
          como SDR.
        </p>
      </div>

      <FilterBar areaOptions={[]} responsibleOptions={[]} />

      <ChannelBreakdownSection
        title="SDR"
        periodLabel={period.label}
        breakdown={breakdown}
        unavailableMetrics={["Contatos Totais", "Follow-ups", "Taxa de Resposta", "Agendamentos", "No Show"]}
      />
    </>
  );
}
