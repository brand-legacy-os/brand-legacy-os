import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { SocialTabs } from "@/components/social/social-tabs";
import { CreateContentPostForm } from "@/components/social/create-content-post-form";
import { ContentPostCard } from "@/components/social/content-post-card";
import { AutoSubmitSelect } from "@/components/ui/auto-submit-select";
import { updateContentPostStatusAction, deleteContentPostAction } from "@/lib/actions/social";
import {
  CONTENT_FORMAT_META,
  CONTENT_POST_STATUS_META,
  SOCIAL_REFERENCE_LINKS,
  WEEKLY_METHODOLOGY_RAW,
} from "@/lib/social";
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

  const [profiles, posts] = await Promise.all([
    prisma.socialProfile.findMany({ orderBy: { order: "asc" } }),
    prisma.contentCalendarPost.findMany({
      include: { profile: true, _count: { select: { links: true, tasks: true } } },
      orderBy: { date: "asc" },
      where: { date: { gte: new Date(new Date().setDate(new Date().getDate() - 7)) } },
    }),
  ]);

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
          Calendário real de postagens e a metodologia semanal do time.
        </p>
      </div>

      <SocialTabs />

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Calendário (próximos posts)
          </h2>
          <Link
            href="/social/podcast"
            className="text-[12px] font-medium text-brand hover:underline"
          >
            Ver tracker do podcast →
          </Link>
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
                      href={`/social/calendario?post=${post.id}`}
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
                        href={`/social/calendario?post=${post.id}`}
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
                    Nenhum post no calendário ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Metodologia semanal (referência)
        </h2>
        <p className="text-[12.5px] text-ink-soft">
          Texto original do time, preservado como veio — use como guia para
          montar os posts acima. Conteúdo sazonal (jantares, microeventos)
          ajusta o calendário conforme a demanda.
        </p>
        <pre className="overflow-x-auto whitespace-pre-wrap rounded-(--radius-l) border border-border bg-surface-muted p-4 text-[12.5px] leading-relaxed text-ink-soft">
          {WEEKLY_METHODOLOGY_RAW}
        </pre>
      </section>

      <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
        <h2 className="text-[13px] font-medium text-ink-soft">Outros recursos</h2>
        <Link
          href={SOCIAL_REFERENCE_LINKS.jornalLegado}
          target="_blank"
          className="w-fit text-[12.5px] font-medium text-brand hover:underline"
        >
          Jornal interno (ferramenta anterior — considerar migrar para o Jornal BL) →
        </Link>
      </section>

      {openPostId && <ContentPostCard postId={openPostId} />}
    </>
  );
}
