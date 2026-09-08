"use client";

import { useState } from "react";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { updatePodcastStatusAction, deletePodcastEpisodeAction } from "@/lib/actions/social";
import { PODCAST_STATUS_META, PODCAST_SOURCE_META } from "@/lib/social";
import { CreatePodcastEpisodeForm } from "./create-podcast-episode-form";
import { formatDate } from "@/lib/format";

type Episode = {
  id: string;
  episodeNumber: number;
  guestName: string;
  guestBrand: string | null;
  guestBrandInstagram: string | null;
  guestPersonalInstagram: string | null;
  source: string;
  sourceOther: string | null;
  recordingDate: Date | string | null;
  recordingResponsibleId: string | null;
  materialDeadline: Date | string | null;
  materialResponsibleId: string | null;
  postDate: Date | string | null;
  postResponsibleId: string | null;
  rawMaterialUrl: string | null;
  editedMaterialUrl: string | null;
  status: string;
  transcript: string | null;
  dispatchCopy: string | null;
  dispatchDate: Date | string | null;
  dispatchResponsibleId: string | null;
  dispatchStatus: string | null;
};

export function PodcastEpisodeRow({
  episode,
  users,
  canEdit,
  colSpan,
}: {
  episode: Episode;
  users: { id: string; name: string }[];
  canEdit: boolean;
  colSpan: number;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <tr className="border-b border-border last:border-b-0">
        <td colSpan={colSpan} className="p-3">
          <CreatePodcastEpisodeForm users={users} defaults={episode} onDone={() => setEditing(false)} />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border last:border-b-0">
      <td className="tnum px-4 py-3 text-ink">#{episode.episodeNumber}</td>
      <td className="px-4 py-3 text-ink">{episode.guestName}</td>
      <td className="px-4 py-3 text-ink-soft">{episode.guestBrand ?? "—"}</td>
      <td className="tnum px-4 py-3 text-ink-soft">
        {episode.recordingDate ? formatDate(new Date(episode.recordingDate)) : "—"}
      </td>
      <td className="tnum px-4 py-3 text-ink-soft">
        {episode.materialDeadline ? formatDate(new Date(episode.materialDeadline)) : "—"}
      </td>
      <td className="tnum px-4 py-3 text-ink-soft">
        {episode.postDate ? formatDate(new Date(episode.postDate)) : "—"}
      </td>
      <td className="px-4 py-3 text-ink-soft">
        {episode.source === "outro" ? episode.sourceOther || "Outros" : PODCAST_SOURCE_META[episode.source as keyof typeof PODCAST_SOURCE_META]?.label}
      </td>
      <td className="px-4 py-3">
        {canEdit ? (
          <AutoSubmitSelect
            action={updatePodcastStatusAction}
            hiddenName="episodeId"
            hiddenValue={episode.id}
            name="status"
            defaultValue={episode.status}
            options={Object.entries(PODCAST_STATUS_META).map(([key, meta]) => ({
              value: key,
              label: meta.label,
            }))}
          />
        ) : (
          <span className="text-ink-soft">{PODCAST_STATUS_META[episode.status as keyof typeof PODCAST_STATUS_META]?.label}</span>
        )}
      </td>
      <td className="px-4 py-3">
        {canEdit && (
          <div className="flex items-center gap-3">
            <button onClick={() => setEditing(true)} className="text-[11.5px] font-medium text-brand hover:underline">
              editar
            </button>
            <form action={deletePodcastEpisodeAction}>
              <input type="hidden" name="episodeId" value={episode.id} />
              <button className="text-[11.5px] text-critical hover:underline">Excluir</button>
            </form>
          </div>
        )}
      </td>
    </tr>
  );
}
