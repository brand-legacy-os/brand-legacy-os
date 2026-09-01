import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { SocialTabs } from "@/components/social/social-tabs";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { ReporteiRefreshButton } from "@/components/social/reportei-refresh-button";
import { StatusPill, type Tone } from "@/components/ui/status-pill";

const SEVERITY_ORDER: Record<string, number> = { critical: 0, warning: 1, info: 2 };
const SEVERITY_LABEL: Record<string, string> = {
  critical: "Atenção",
  warning: "Observar",
  info: "Info",
};

function insightTone(severity: string): Tone {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "warning";
  return "neutral";
}

function formatFetchedAt(date: Date | undefined) {
  if (!date) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function SocialDashboardPage({
  searchParams,
}: PageProps<"/social/dashboard">) {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const sp = await searchParams;
  const canEdit = canEditAreaKpis(user, "social");

  const profiles = await prisma.socialProfile.findMany({
    where: { reporteiUrl: { not: null } },
    orderBy: { order: "asc" },
  });

  return (
    <>
      <CultureBanner
        eyebrow="Social · Reportei"
        title="Os números das redes, direto na plataforma."
        subtitle="Um clique em Atualizar e os dados do Reportei chegam aqui — com os pontos de atenção já calculados."
      />

      <SocialTabs />

      {profiles.length === 0 ? (
        <p className="text-[13px] text-ink-faint">
          Nenhum perfil com link do Reportei vinculado ainda. Vincule um link em
          Indicadores gerais → editar perfil.
        </p>
      ) : (
        <SocialDashboardBody
          profiles={profiles}
          selectedId={(sp.perfil as string) || profiles[0].id}
          canEdit={canEdit}
        />
      )}
    </>
  );
}

async function SocialDashboardBody({
  profiles,
  selectedId,
  canEdit,
}: {
  profiles: { id: string; name: string }[];
  selectedId: string;
  canEdit: boolean;
}) {
  const selected = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  const [metrics, rawInsights] = await Promise.all([
    prisma.socialReporteiMetric.findMany({
      where: { profileId: selected.id },
      orderBy: { fetchedAt: "asc" },
    }),
    prisma.socialReporteiInsight.findMany({
      where: { profileId: selected.id },
    }),
  ]);

  const insights = [...rawInsights].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3)
  );

  const lastFetched = metrics[0]?.fetchedAt ?? insights[0]?.fetchedAt;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-1.5">
          {profiles.map((p) => (
            <Link
              key={p.id}
              href={`/social/dashboard?perfil=${p.id}`}
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium transition-colors ${
                p.id === selected.id
                  ? "bg-brand-deep text-gold-soft"
                  : "bg-surface-muted text-ink-soft hover:text-ink"
              }`}
            >
              {p.name}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="text-[11.5px] text-ink-faint">
              Última atualização: {formatFetchedAt(lastFetched)}
            </span>
          )}
          {canEdit && <ReporteiRefreshButton profileId={selected.id} />}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">Pontos de atenção</h2>
        <div className="flex flex-col gap-2">
          {insights.length === 0 ? (
            <p className="text-[12.5px] text-ink-faint">
              Clique em Atualizar para carregar os dados e gerar os pontos de atenção.
            </p>
          ) : (
            insights.map((i) => (
              <div
                key={i.id}
                className="flex items-start gap-2.5 rounded-(--radius-l) border border-border bg-surface p-3.5"
              >
                <StatusPill label={SEVERITY_LABEL[i.severity] ?? i.severity} tone={insightTone(i.severity)} />
                <p className="text-[12.5px] leading-relaxed text-ink-soft">{i.message}</p>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Métricas · {selected.name} ({metrics.length})
        </h2>
        {metrics.length === 0 ? (
          <p className="text-[12.5px] text-ink-faint">
            Nenhum dado carregado ainda para este perfil.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {metrics.map((m) => (
              <div
                key={m.id}
                className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4"
              >
                <p className="text-[12px] font-medium text-ink-soft">{m.title}</p>
                <p className="tnum font-(family-name:--font-display) text-[24px] leading-none text-ink">
                  {m.value}
                </p>
                {m.deltaLabel && (
                  <span
                    className={`tnum w-fit text-[12px] font-medium ${
                      m.deltaLabel.startsWith("-") ? "text-critical" : "text-positive"
                    }`}
                  >
                    {m.deltaLabel.startsWith("-") ? "▼" : "▲"} {m.deltaLabel.replace(/^[+-]/, "")}
                  </span>
                )}
                {m.previousLabel && (
                  <p className="text-[11px] text-ink-faint">{m.previousLabel}</p>
                )}
                {m.periodLabel && (
                  <p className="text-[10.5px] text-ink-faint">{m.periodLabel}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
