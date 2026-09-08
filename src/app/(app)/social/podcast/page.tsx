import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canAccessPodcast, isPodcastOnlyUser } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { SocialTabs } from "@/components/social/social-tabs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CreatePodcastEpisodeForm } from "@/components/social/create-podcast-episode-form";
import { PodcastEpisodeRow } from "@/components/social/podcast-episode-row";
import { notFound } from "next/navigation";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function SocialPodcastPage({
  searchParams,
}: PageProps<"/social/podcast">) {
  const user = await requireUser();
  if (!canAccessPodcast(user)) notFound();
  const canEdit = canEditAreaKpis(user, "social") || isPodcastOnlyUser(user);
  const sp = await searchParams;

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);

  const [episodes, users] = await Promise.all([
    prisma.podcastEpisode.findMany({ orderBy: { episodeNumber: "desc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const episodesInPeriod = episodes.filter((e) => {
    const anchor = e.recordingDate ?? e.createdAt;
    return anchor >= period.start && anchor <= period.end;
  });

  const marcadas = episodesInPeriod.length;
  const gravados = episodesInPeriod.filter(
    (e) => !["entrevista_marcada", "entrevista_reagendando"].includes(e.status)
  ).length;
  const postados = episodesInPeriod.filter((e) => e.status === "episodio_postado").length;
  const emGaveta = episodesInPeriod.filter((e) =>
    ["esperando_material", "material_em_edicao", "episodio_agendado"].includes(e.status)
  ).length;
  const reagendando = episodesInPeriod.filter((e) => e.status === "entrevista_reagendando").length;

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
            Controle de convidados do podcast — grava, edita, agenda, publica.
          </p>
        </div>
        <FilterBar areaOptions={[]} responsibleOptions={[]} />
      </div>

      <SocialTabs />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatTile label="Entrevistas marcadas" value={String(marcadas)} />
        <StatTile label="Episódios gravados" value={String(gravados)} />
        <StatTile label="Episódios postados" value={String(postados)} />
        <StatTile label="Em gaveta" value={String(emGaveta)} />
        <StatTile label="Reagendando" value={String(reagendando)} />
      </div>

      {canEdit && <CreatePodcastEpisodeForm users={users} />}

      <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
        <table className="w-full min-w-[960px] border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
              <th className="px-4 py-3 font-medium">Ep.</th>
              <th className="px-4 py-3 font-medium">Convidado</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 font-medium">Gravação</th>
              <th className="px-4 py-3 font-medium">Prazo material</th>
              <th className="px-4 py-3 font-medium">Postagem</th>
              <th className="px-4 py-3 font-medium">Fonte</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {episodes.map((ep) => (
              <PodcastEpisodeRow key={ep.id} episode={ep} users={users} canEdit={canEdit} colSpan={9} />
            ))}
            {episodes.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-ink-faint">
                  Nenhum episódio cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
