import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { SocialTabs } from "@/components/social/social-tabs";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { ProfileReportForm } from "@/components/social/profile-report-form";
import { ReportRow } from "@/components/social/report-row";
import { notFound } from "next/navigation";

export default async function SocialRelatorioPage() {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const canEdit = canEditAreaKpis(user, "social");

  const profiles = await prisma.socialProfile.findMany({
    orderBy: { order: "asc" },
    include: {
      reports: {
        include: { createdBy: true, attachments: { orderBy: { createdAt: "asc" } } },
        orderBy: { reportMonth: "desc" },
      },
    },
  });

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Marca forte não acontece por acaso — se constrói todo dia."
        subtitle="Consistência, autenticidade e presença — cada post é um tijolo na autoridade da marca."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Social
        </h1>
        <p className="max-w-[62ch] text-[13px] text-ink-soft">
          Relatórios periódicos por perfil — mês de referência, período analisado, análise resumida e anexos.
        </p>
      </div>

      <SocialTabs />

      <div className="flex flex-col gap-6">
        {profiles.map((p) => (
          <section key={p.id} className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h2 className="text-[13px] font-medium text-ink-soft">
              {p.name} ({p.reports.length})
            </h2>
            <div className="flex flex-col">
              {p.reports.map((r) => (
                <ReportRow key={r.id} profileId={p.id} report={r} canEdit={canEdit} />
              ))}
              {p.reports.length === 0 && (
                <p className="py-2 text-[12.5px] text-ink-faint">Nenhum relatório ainda.</p>
              )}
            </div>
            {canEdit && <ProfileReportForm profileId={p.id} />}
          </section>
        ))}
        {profiles.length === 0 && (
          <p className="text-[13px] text-ink-faint">Nenhum perfil cadastrado ainda.</p>
        )}
      </div>
    </>
  );
}
