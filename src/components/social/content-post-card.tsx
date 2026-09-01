import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis, canManageTask } from "@/lib/permissions";
import { CONTENT_FORMAT_META, CONTENT_POST_STATUS_META } from "@/lib/social";
import { formatDate } from "@/lib/format";
import { TaskRow } from "@/components/area/task-row";
import { AddContentPostLinkForm } from "@/components/social/add-content-post-link-form";
import { AddContentPostTaskForm } from "@/components/social/add-content-post-task-form";
import { deleteContentPostLinkAction } from "@/lib/actions/social";

export async function ContentPostCard({ postId }: { postId: string }) {
  const user = await requireUser();
  const canEdit = canEditAreaKpis(user, "social");

  const [post, socialArea] = await Promise.all([
    prisma.contentCalendarPost.findUnique({
      where: { id: postId },
      include: {
        profile: true,
        links: { orderBy: { createdAt: "asc" } },
        tasks: { include: { assignee: true }, orderBy: { deadline: "asc" } },
      },
    }),
    prisma.area.findUnique({
      where: { slug: "social" },
      include: { memberships: { include: { user: true } } },
    }),
  ]);

  if (!post) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <Link
        href="/social/calendario"
        aria-label="Fechar"
        className="absolute inset-0 bg-brand-deep/40 backdrop-blur-[1px]"
      />
      <div className="relative flex h-full w-full max-w-[520px] flex-col gap-5 overflow-y-auto border-l border-border bg-surface p-6 shadow-[-8px_0_32px_-12px_rgba(23,23,15,0.25)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="w-fit rounded-full bg-gold-tint px-2.5 py-1 text-[10.5px] font-medium uppercase tracking-[0.04em] text-gold-ink">
              {CONTENT_FORMAT_META[post.format].label} · {post.profile.name}
            </span>
            <h2 className="font-(family-name:--font-display) text-[20px] leading-tight text-ink">
              {post.theme}
            </h2>
            <p className="text-[12.5px] text-ink-faint">
              {formatDate(post.date)} · {CONTENT_POST_STATUS_META[post.status].label}
            </p>
          </div>
          <Link
            href="/social/calendario"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[16px] text-ink-faint hover:bg-surface-muted hover:text-ink"
            aria-label="Fechar"
          >
            ×
          </Link>
        </div>

        {post.notes && (
          <p className="rounded-(--radius-s) bg-surface-muted p-3 text-[12.5px] leading-relaxed text-ink-soft">
            {post.notes}
          </p>
        )}

        <section className="flex flex-col gap-2.5">
          <h3 className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">
            Links ({post.links.length})
          </h3>
          <div className="flex flex-col gap-1.5">
            {post.links.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between gap-2 rounded-(--radius-s) border border-border px-2.5 py-2"
              >
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[12.5px] font-medium text-brand hover:underline"
                >
                  🔗 {link.label}
                </a>
                {canEdit && (
                  <form action={deleteContentPostLinkAction}>
                    <input type="hidden" name="linkId" value={link.id} />
                    <button className="text-[11px] text-ink-faint hover:text-critical hover:underline">
                      Remover
                    </button>
                  </form>
                )}
              </div>
            ))}
            {post.links.length === 0 && (
              <p className="text-[12px] text-ink-faint">Nenhum link anexado ainda.</p>
            )}
          </div>
          {canEdit && <AddContentPostLinkForm postId={post.id} />}
        </section>

        <section className="flex flex-col gap-2.5">
          <h3 className="text-[12px] font-medium uppercase tracking-[0.04em] text-ink-faint">
            Tarefas ({post.tasks.length})
          </h3>
          <p className="text-[11.5px] text-ink-faint">
            São tarefas reais — aparecem aqui e também no Workflow.
          </p>
          <div className="flex flex-col rounded-(--radius-l) border border-border">
            {post.tasks.map((task) => {
              const initials = task.assignee.name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase())
                .join("");
              return (
                <div key={task.id} className="px-3 first:[&>div]:border-t-0">
                  <TaskRow
                    task={task}
                    assigneeName={task.assignee.name}
                    assigneeInitials={initials || "?"}
                    canManage={canManageTask(user, {
                      assigneeId: task.assigneeId,
                      areaSlug: "social",
                    })}
                  />
                </div>
              );
            })}
            {post.tasks.length === 0 && (
              <p className="p-3 text-[12px] text-ink-faint">Nenhuma tarefa aberta ainda.</p>
            )}
          </div>
          {canEdit && socialArea && (
            <AddContentPostTaskForm
              postId={post.id}
              areaId={socialArea.id}
              members={socialArea.memberships.map((m) => ({ id: m.user.id, name: m.user.name }))}
            />
          )}
        </section>
      </div>
    </div>
  );
}
