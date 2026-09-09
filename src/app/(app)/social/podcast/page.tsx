import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canAccessPodcast, isPodcastOnlyUser } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { SocialTabs } from "@/components/social/social-tabs";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { StatTile } from "@/components/dashboard/stat-tile";
import { CreatePodcastEpisodeForm } from "@/components/social/create-podcast-episode-form";
import { PodcastEpisodeRow } from "@/components/social/podcast-episode-row";
import { CalendarMonthNav } from "@/components/social/calendar-month-nav";
import { PODCAST_STATUS_META, SOCIAL_REFERENCE_LINKS } from "@/lib/social";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import type { PodcastEpisode, PodcastStatus } from "@prisma/client";

const VIEWS = [
  { key: "tabela", icon: "📋", label: "Tabela" },
  { key: "kanban", icon: "🗂️", label: "Kanban" },
  { key: "gravacao", icon: "🎙️", label: "Calendário · gravação" },
  { key: "entrega", icon: "📦", label: "Calendário · entrega" },
  { key: "postagem", icon: "📢", label: "Calendário · postagem" },
] as const;
type ViewKey = (typeof VIEWS)[number]["key"];

export default async function SocialPodcastPage({
  searchParams,
}: PageProps<"/social/podcast">) {
  const user = await requireUser();
  if (!canAccessPodcast(user)) notFound();
  const canEdit = canEditAreaKpis(user, "social") || isPodcastOnlyUser(user);
  const sp = await searchParams;

  const periodKey = (sp.periodo as PeriodKey) || "mes";
  const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);
  const visao = (VIEWS.find((v) => v.key === sp.visao)?.key ?? "tabela") as ViewKey;

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
    (e) => !["em_conversa", "entrevista_marcada", "entrevista_reagendando"].includes(e.status)
  ).length;
  const postados = episodesInPeriod.filter((e) => e.status === "episodio_postado").length;
  const emGaveta = episodesInPeriod.filter((e) =>
    ["esperando_material", "material_em_edicao", "episodio_agendado"].includes(e.status)
  ).length;
  const reagendando = episodesInPeriod.filter((e) => e.status === "entrevista_reagendando").length;

  const header = (
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
          <Link
            href={SOCIAL_REFERENCE_LINKS.driveAlphaville}
            target="_blank"
            className="flex w-fit items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11.5px] font-medium text-brand hover:bg-surface-muted"
          >
            📁 Drive de Alphaville
          </Link>
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

      <nav className="flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <Link
            key={v.key}
            href={`/social/podcast?visao=${v.key}`}
            title={v.label}
            className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-medium transition-colors ${
              visao === v.key ? "bg-brand-deep text-gold-soft" : "bg-surface-muted text-ink-soft hover:text-ink"
            }`}
          >
            <span>{v.icon}</span>
            {v.label}
          </Link>
        ))}
      </nav>

      {canEdit && <CreatePodcastEpisodeForm users={users} />}
    </>
  );

  if (visao === "kanban") {
    const statusOrder = Object.keys(PODCAST_STATUS_META) as PodcastStatus[];
    return (
      <>
        {header}
        <div className="overflow-x-auto">
          <div className="flex min-w-max gap-3 pb-2">
            {statusOrder.map((status) => {
              const inColumn = episodes.filter((e) => e.status === status);
              return (
                <div key={status} className="flex w-[260px] shrink-0 flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-ink-soft">{PODCAST_STATUS_META[status].label}</span>
                    <span className="tnum text-[11px] text-ink-faint">{inColumn.length}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {inColumn.map((e) => (
                      <Link
                        key={e.id}
                        href="/social/podcast"
                        className="flex flex-col gap-0.5 rounded-(--radius-s) border border-border bg-canvas p-2.5 text-[12px] hover:bg-surface-muted"
                      >
                        <span className="font-medium text-ink">
                          {e.episodeNumber ? `#${e.episodeNumber} · ` : ""}
                          {e.guestName}
                        </span>
                        {e.guestBrand && <span className="text-[11px] text-ink-faint">{e.guestBrand}</span>}
                        {e.recordingDate && (
                          <span className="tnum text-[10.5px] text-ink-faint">Gravação {formatDate(e.recordingDate)}</span>
                        )}
                      </Link>
                    ))}
                    {inColumn.length === 0 && <p className="text-[11px] text-ink-faint">Vazio.</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  if (visao === "gravacao" || visao === "entrega" || visao === "postagem") {
    const dateField = visao === "gravacao" ? "recordingDate" : visao === "entrega" ? "materialDeadline" : "postDate";
    const today = new Date();
    const year = Number(sp.ano) || today.getFullYear();
    const month = Number(sp.mes) || today.getMonth() + 1;

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);
    const gridStart = new Date(monthStart);
    gridStart.setDate(gridStart.getDate() - gridStart.getDay());
    const gridEnd = new Date(monthEnd);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const byDay = new Map<string, PodcastEpisode[]>();
    for (const e of episodes) {
      const date = e[dateField];
      if (!date || date < gridStart || date > gridEnd) continue;
      const key = date.toISOString().slice(0, 10);
      byDay.set(key, [...(byDay.get(key) ?? []), e]);
    }

    const days: Date[] = [];
    for (let dd = new Date(gridStart); dd <= gridEnd; dd.setDate(dd.getDate() + 1)) days.push(new Date(dd));
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

    const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const todayKey = today.toISOString().slice(0, 10);

    return (
      <>
        {header}
        <section className="flex flex-col gap-3">
          <CalendarMonthNav year={year} month={month} />
          <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
            <div className="grid min-w-[720px] grid-cols-7 border-b border-border">
              {WEEKDAY_LABELS.map((d) => (
                <div key={d} className="px-2 py-2 text-center text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">
                  {d}
                </div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid min-w-[720px] grid-cols-7 border-b border-border last:border-b-0">
                {week.map((day) => {
                  const key = day.toISOString().slice(0, 10);
                  const inMonth = day.getMonth() === month - 1;
                  const dayEpisodes = byDay.get(key) ?? [];
                  return (
                    <div
                      key={key}
                      className={`flex min-h-[92px] flex-col gap-1 border-r border-border p-1.5 last:border-r-0 ${inMonth ? "bg-surface" : "bg-canvas"}`}
                    >
                      <span
                        className={`tnum text-[11px] ${
                          key === todayKey
                            ? "flex h-5 w-5 items-center justify-center rounded-full bg-brand-deep font-medium text-gold-soft"
                            : inMonth
                              ? "text-ink-soft"
                              : "text-ink-faint"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {dayEpisodes.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className="truncate rounded-(--radius-s) bg-gold-tint px-1.5 py-0.5 text-[10.5px] font-medium text-gold-ink"
                            title={e.guestName}
                          >
                            {e.episodeNumber ? `#${e.episodeNumber} ` : ""}
                            {e.guestName}
                          </span>
                        ))}
                        {dayEpisodes.length > 3 && (
                          <span className="text-[10px] text-ink-faint">+{dayEpisodes.length - 3}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      {header}
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
