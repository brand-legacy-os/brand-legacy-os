import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { resolvePeriod, type PeriodKey } from "@/lib/period";
import { SocialTabs } from "@/components/social/social-tabs";
import { CreateContentPostForm } from "@/components/social/create-content-post-form";
import { ContentPostCard } from "@/components/social/content-post-card";
import { CalendarMonthNav } from "@/components/social/calendar-month-nav";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { updateContentPostStatusAction, deleteContentPostAction } from "@/lib/actions/social";
import { CONTENT_FORMAT_META, CONTENT_POST_STATUS_META } from "@/lib/social";
import { formatDate } from "@/lib/format";
import { notFound } from "next/navigation";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function SocialCalendarioPage({
  searchParams,
}: PageProps<"/social/calendario">) {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const canEdit = canEditAreaKpis(user, "social");
  const sp = await searchParams;
  const openPostId = (sp.post as string) || null;
  const visao = (sp.visao as string) === "lista" ? "lista" : "mes";

  const profiles = await prisma.socialProfile.findMany({ orderBy: { order: "asc" } });

  const today = new Date();
  const year = Number(sp.ano) || today.getFullYear();
  const month = Number(sp.mes) || today.getMonth() + 1; // 1-12
  const diaParam = (sp.dia as string) || null;

  const header = (
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
          Calendário real de postagens.
        </p>
      </div>
      <SocialTabs />
    </>
  );

  if (visao === "lista") {
    const periodKey = (sp.periodo as PeriodKey) || "ano";
    const period = resolvePeriod(periodKey, sp.from as string, sp.to as string);
    const posts = await prisma.contentCalendarPost.findMany({
      include: { profile: true, _count: { select: { links: true, tasks: true } } },
      orderBy: { date: "asc" },
      where: { date: { gte: period.start, lte: period.end } },
    });

    return (
      <>
        {header}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Lista · {period.label.toLowerCase()}
            </h2>
            <div className="flex items-center gap-2">
              <FilterBar areaOptions={[]} responsibleOptions={[]} />
              <Link href="/social/calendario" className="text-[12px] font-medium text-brand hover:underline">
                Ver como calendário →
              </Link>
            </div>
          </div>
          {canEdit && <CreateContentPostForm profiles={profiles} />}
          <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Perfil</th>
                  <th className="px-4 py-3 font-medium">Formato</th>
                  <th className="px-4 py-3 font-medium">Tema</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post) => (
                  <tr key={post.id} className="border-b border-border last:border-b-0">
                    <td className="tnum px-4 py-3 text-ink-soft">{formatDate(post.date)}</td>
                    <td className="px-4 py-3 text-ink">{post.profile.name}</td>
                    <td className="px-4 py-3 text-ink-soft">{CONTENT_FORMAT_META[post.format].label}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/social/calendario?visao=lista&post=${post.id}`}
                        className="flex items-center gap-2 text-ink hover:text-brand hover:underline"
                      >
                        {post.theme}
                        {(post._count.links > 0 || post._count.tasks > 0) && (
                          <span className="tnum flex shrink-0 items-center gap-1.5 text-[11px] text-ink-faint">
                            {post._count.links > 0 && <span>🔗 {post._count.links}</span>}
                            {post._count.tasks > 0 && <span>✓ {post._count.tasks}</span>}
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <AutoSubmitSelect
                          action={updateContentPostStatusAction}
                          hiddenName="postId"
                          hiddenValue={post.id}
                          name="status"
                          defaultValue={post.status}
                          options={Object.entries(CONTENT_POST_STATUS_META).map(([key, meta]) => ({
                            value: key,
                            label: meta.label,
                          }))}
                        />
                      ) : (
                        <span className="text-ink-soft">{CONTENT_POST_STATUS_META[post.status].label}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/social/calendario?visao=lista&post=${post.id}`}
                          className="text-[11.5px] font-medium text-brand hover:underline"
                        >
                          Abrir card
                        </Link>
                        {canEdit && (
                          <form action={deleteContentPostAction}>
                            <input type="hidden" name="postId" value={post.id} />
                            <button className="text-[11.5px] text-critical hover:underline">Excluir</button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {posts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-ink-faint">
                      Nenhum post nesse período.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
        {openPostId && <ContentPostCard postId={openPostId} />}
      </>
    );
  }

  // --- Visão calendário (grid mensal) ---
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const posts = await prisma.contentCalendarPost.findMany({
    include: { profile: true, _count: { select: { links: true, tasks: true } } },
    orderBy: { date: "asc" },
    where: { date: { gte: gridStart, lte: gridEnd } },
  });

  const postsByDay = new Map<string, typeof posts>();
  for (const p of posts) {
    const key = p.date.toISOString().slice(0, 10);
    postsByDay.set(key, [...(postsByDay.get(key) ?? []), p]);
  }

  const days: Date[] = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const todayKey = today.toISOString().slice(0, 10);

  return (
    <>
      {header}
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CalendarMonthNav year={year} month={month} />
          <Link href="/social/calendario?visao=lista" className="text-[12px] font-medium text-brand hover:underline">
            Ver como lista (ano / período específico) →
          </Link>
        </div>

        {diaParam && canEdit && (
          <CreateContentPostForm profiles={profiles} defaultDate={diaParam} autoOpen />
        )}

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
                const dayPosts = postsByDay.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className={`flex min-h-[92px] flex-col gap-1 border-r border-border p-1.5 last:border-r-0 ${
                      inMonth ? "bg-surface" : "bg-canvas"
                    }`}
                  >
                    <div className="flex items-center justify-between">
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
                      {canEdit && (
                        <Link
                          href={`/social/calendario?ano=${year}&mes=${month}&dia=${key}`}
                          className="text-[11px] font-medium text-brand hover:underline"
                          title="Novo post nesse dia"
                        >
                          +
                        </Link>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayPosts.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          href={`/social/calendario?ano=${year}&mes=${month}&post=${p.id}`}
                          className="truncate rounded-(--radius-s) bg-gold-tint px-1.5 py-0.5 text-[10.5px] font-medium text-gold-ink hover:opacity-80"
                          title={`${p.profile.name} · ${p.theme}`}
                        >
                          {p.profile.name.slice(0, 1)} · {p.theme}
                        </Link>
                      ))}
                      {dayPosts.length > 3 && (
                        <span className="text-[10px] text-ink-faint">+{dayPosts.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {openPostId && <ContentPostCard postId={openPostId} />}
    </>
  );
}
