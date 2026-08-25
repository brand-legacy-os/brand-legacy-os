import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { computeKpiSnapshot } from "@/lib/kpi";
import { SocialTabs } from "@/components/social/social-tabs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { KpiCard } from "@/components/area/kpi-card";
import { SOCIAL_REFERENCE_LINKS } from "@/lib/social";
import { UpdateProfileScopeForm } from "@/components/social/update-profile-scope-form";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { notFound } from "next/navigation";

export default async function SocialPage({
  searchParams,
}: PageProps<"/social">) {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const sp = await searchParams;

  const area = await prisma.area.findUnique({
    where: { slug: "social" },
    include: {
      kpis: { include: { entries: true, targets: true, responsible: true } },
      memberships: { include: { user: true } },
    },
  });
  if (!area) notFound();

  const profiles = await prisma.socialProfile.findMany({
    include: { person: true },
    orderBy: { order: "asc" },
  });

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);
  const canEdit = canEditAreaKpis(user, "social");

  const snapshots = area.kpis.map((k) =>
    computeKpiSnapshot(k, k.entries, period, k.targets)
  );

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Marca forte não acontece por acaso — se constrói todo dia."
        subtitle="Consistência, autenticidade e presença — cada post é um tijolo na autoridade da marca."
      />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Social
          </h1>
          <p className="max-w-[62ch] text-[13px] text-ink-soft">
            Perfis geridos, indicadores e metodologia do time de Social —
            espelhando a estrutura real deles, para eles usarem aqui.
          </p>
        </div>
        <FilterBar
          areaOptions={[]}
          responsibleOptions={area.memberships.map((m) => ({
            value: m.user.id,
            label: m.user.name,
          }))}
        />
      </div>

      <SocialTabs />

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Indicadores gerais · {period.label.toLowerCase()}
        </h2>
        <p className="text-[12px] text-ink-faint">
          Vendas: linkadas ao Comercial (nada duplicado aqui). Demais
          métricas: transcritas da{" "}
          <a
            href={SOCIAL_REFERENCE_LINKS.metricasSpreadsheet}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline"
          >
            planilha de acompanhamento
          </a>{" "}
          pelo líder da área.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {snapshots.map((s) => (
            <KpiCard
              key={s.kpi.id}
              snapshot={s}
              responsibleName={
                area.kpis.find((k) => k.id === s.kpi.id)?.responsible.name ?? ""
              }
              canEdit={canEdit}
            />
          ))}
          {snapshots.length === 0 && (
            <p className="text-[13px] text-ink-faint">
              Nenhum indicador cadastrado para esta área ainda.
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Perfis geridos ({profiles.length})
          </h2>
          <Link href="/social/colaboradores" className="text-[12px] font-medium text-brand hover:underline">
            Ver por colaborador →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profiles.map((p, i) => {
            const palette = ["bg-brand-deep text-gold-soft", "bg-gold text-brand-deep", "bg-[#2166AC]/[0.12] text-[#2166AC]", "bg-[#B0473A]/[0.12] text-[#B0473A]"];
            const initials = p.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join("");
            return (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-4 transition-shadow hover:shadow-[0_4px_16px_-8px_rgba(23,23,15,0.15)]"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${palette[i % palette.length]}`}
                  >
                    {initials || "BL"}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate text-[13.5px] font-medium text-ink">{p.name}</span>
                    {p.isInstitutional && (
                      <span className="w-fit rounded-full bg-gold-tint px-2 py-0.5 text-[10px] font-medium text-gold-ink">
                        Institucional
                      </span>
                    )}
                  </div>
                </div>
                {p.reporteiUrl ? (
                  <a
                    href={p.reporteiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-fit items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11.5px] font-medium text-brand hover:bg-surface-muted"
                  >
                    📊 Dashboard Reportei
                  </a>
                ) : (
                  <span className="text-[11.5px] text-ink-faint">
                    Sem dashboard Reportei vinculado ainda.
                  </span>
                )}
                {p.contentScope ? (
                  <p className="text-[12px] leading-relaxed text-ink-soft">{p.contentScope}</p>
                ) : (
                  <p className="text-[12px] text-ink-faint">
                    Escopo de postagem ainda não combinado.
                  </p>
                )}
                {canEdit && <UpdateProfileScopeForm profile={p} />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">Recursos</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
            <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-(--radius-s) bg-surface-muted">🎬</span>
              Material visual
            </span>
            <Link
              href={SOCIAL_REFERENCE_LINKS.materialVisual}
              target="_blank"
              className="w-fit text-[12px] font-medium text-brand hover:underline"
            >
              Abrir pasta no Drive →
            </Link>
          </div>
          <div className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
            <span className="flex items-center gap-2 text-[12.5px] font-medium text-ink">
              <span className="flex h-7 w-7 items-center justify-center rounded-(--radius-s) bg-surface-muted">🛠️</span>
              Ferramentas
            </span>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {SOCIAL_REFERENCE_LINKS.ferramentas.map((f) => (
                <Link
                  key={f.name}
                  href={f.url}
                  target="_blank"
                  className="text-[12px] font-medium text-brand hover:underline"
                >
                  {f.name} →
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
