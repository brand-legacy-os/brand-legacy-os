import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { SocialTabs } from "@/components/social/social-tabs";
import { CreatePodcastEpisodeForm } from "@/components/social/create-podcast-episode-form";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { updatePodcastStatusAction, deletePodcastEpisodeAction } from "@/lib/actions/social";
import { PODCAST_STATUS_META, PODCAST_SOURCE_META } from "@/lib/social";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";

export default async function SocialPodcastPage() {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const canEdit = canEditAreaKpis(user, "social");

  const episodes = await prisma.podcastEpisode.findMany({
    orderBy: { episodeNumber: "desc" },
  });
  const statusCounts = episodes.reduce<Record<string, number>>((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <>
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

      <SocialTabs />

      {episodes.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-(--radius-l) border border-border bg-surface p-4">
            <p className="text-[11px] text-ink-faint">Episódios</p>
            <p className="tnum text-[22px] font-medium text-ink">{episodes.length}</p>
          </div>
          {(Object.entries(PODCAST_STATUS_META) as [keyof typeof PODCAST_STATUS_META, { label: string }][]).map(([key, meta]) => (
            <div key={key} className="rounded-(--radius-l) border border-border bg-surface p-4">
              <p className="text-[11px] text-ink-faint">{meta.label}</p>
              <p className="tnum text-[22px] font-medium text-ink">{statusCounts[key] ?? 0}</p>
            </div>
          ))}
        </div>
      )}

      {canEdit && <CreatePodcastEpisodeForm />}

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
              <tr key={ep.id} className="border-b border-border last:border-b-0">
                <td className="tnum px-4 py-3 text-ink">#{ep.episodeNumber}</td>
                <td className="px-4 py-3 text-ink">{ep.guestName}</td>
                <td className="px-4 py-3 text-ink-soft">{ep.guestBrand ?? "—"}</td>
                <td className="tnum px-4 py-3 text-ink-soft">
                  {ep.recordingDate ? formatDate(ep.recordingDate) : "—"}
                </td>
                <td className="tnum px-4 py-3 text-ink-soft">
                  {ep.materialDeadline ? formatDate(ep.materialDeadline) : "—"}
                </td>
                <td className="tnum px-4 py-3 text-ink-soft">
                  {ep.postDate ? formatDate(ep.postDate) : "—"}
                </td>
                <td className="px-4 py-3 text-ink-soft">{PODCAST_SOURCE_META[ep.source].label}</td>
                <td className="px-4 py-3">
                  {canEdit ? (
                    <AutoSubmitSelect
                      action={updatePodcastStatusAction}
                      hiddenName="episodeId"
                      hiddenValue={ep.id}
                      name="status"
                      defaultValue={ep.status}
                      options={Object.entries(PODCAST_STATUS_META).map(([key, meta]) => ({
                        value: key,
                        label: meta.label,
                      }))}
                    />
                  ) : (
                    <span className="text-ink-soft">{PODCAST_STATUS_META[ep.status].label}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {canEdit && (
                    <form action={deletePodcastEpisodeAction}>
                      <input type="hidden" name="episodeId" value={ep.id} />
                      <button className="text-[11.5px] text-critical hover:underline">Excluir</button>
                    </form>
                  )}
                </td>
              </tr>
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
