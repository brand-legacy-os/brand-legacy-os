import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import { formatDate, relativeTime, TASK_STATUS_META } from "@/lib/format";
import { StatusPill, taskStatusTone } from "@/components/ui/status-pill";

export default async function ProfilePage({
  params,
}: PageProps<"/perfil/[id]">) {
  const viewer = await requireUser();
  const { id } = await params;

  const profile = await prisma.user.findUnique({
    where: { id },
    include: {
      memberships: { include: { area: true } },
      assignedTasks: { include: { area: true }, orderBy: { deadline: "asc" } },
      ownedProjects: { include: { area: true }, orderBy: { deadline: "asc" } },
      ledKpis: { include: { area: true, entries: { orderBy: { date: "desc" }, take: 1 } } },
      muralPosts: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!profile) notFound();

  const isSelf = viewer.id === profile.id;
  const sharesArea = profile.memberships.some((m) => isLeaderOf(viewer, m.area.slug));
  const canSeeDetails = isAdmin(viewer) || isSelf || sharesArea;

  const leaders = await prisma.membership.findMany({
    where: {
      areaId: { in: profile.memberships.map((m) => m.area.id) },
      role: "lider",
      userId: { not: profile.id },
    },
    include: { user: true, area: true },
  });

  return (
    <div className="mx-auto flex w-full max-w-[820px] flex-col gap-8">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-deep text-[20px] font-semibold text-gold-soft">
          {profile.avatarInitials}
        </span>
        <div className="flex flex-col gap-1">
          <h1 className="font-(family-name:--font-display) text-[24px] text-ink">
            {profile.name}
          </h1>
          <p className="text-[13px] text-ink-soft">{profile.title}</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.memberships.map((m) => (
              <Link
                key={m.id}
                href={`/areas/${m.area.slug}`}
                className="rounded-full bg-surface-muted px-2.5 py-0.5 text-[11.5px] text-ink-soft hover:bg-border-strong/40"
              >
                {m.title} · {m.area.name}
              </Link>
            ))}
            {profile.isGlobalAdmin && (
              <span className="rounded-full bg-gold-tint px-2.5 py-0.5 text-[11.5px] font-medium text-gold-ink">
                Visão global
              </span>
            )}
          </div>
        </div>
      </div>

      {leaders.length > 0 && (
        <p className="text-[12.5px] text-ink-faint">
          Reporta para:{" "}
          {leaders.map((l, i) => (
            <span key={l.id}>
              <Link href={`/perfil/${l.user.id}`} className="text-brand hover:underline">
                {l.user.name}
              </Link>
              {i < leaders.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}

      {canSeeDetails ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="flex flex-col gap-3">
              <h2 className="text-[13px] font-medium text-ink-soft">
                Tarefas ({profile.assignedTasks.length})
              </h2>
              <div className="rounded-(--radius-l) border border-border bg-surface p-2">
                {profile.assignedTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 border-t border-border px-2.5 py-2 first:border-t-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-[12.5px] text-ink">{t.title}</span>
                      <span className="text-[11px] text-ink-faint">
                        {t.area.name} · {formatDate(t.deadline)}
                      </span>
                    </div>
                    <StatusPill
                      label={TASK_STATUS_META[t.status].label}
                      tone={taskStatusTone(t.status)}
                    />
                  </div>
                ))}
                {profile.assignedTasks.length === 0 && (
                  <p className="px-2.5 py-3 text-[12.5px] text-ink-faint">
                    Nenhuma tarefa atribuída.
                  </p>
                )}
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-[13px] font-medium text-ink-soft">
                Projetos ({profile.ownedProjects.length})
              </h2>
              <div className="rounded-(--radius-l) border border-border bg-surface p-2">
                {profile.ownedProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-t border-border px-2.5 py-2 first:border-t-0"
                  >
                    <div className="flex flex-col">
                      <span className="text-[12.5px] text-ink">{p.name}</span>
                      <span className="text-[11px] text-ink-faint">
                        {p.area.name}
                      </span>
                    </div>
                    <span className="tnum text-[12px] text-ink-soft">
                      {p.progressPct}%
                    </span>
                  </div>
                ))}
                {profile.ownedProjects.length === 0 && (
                  <p className="px-2.5 py-3 text-[12.5px] text-ink-faint">
                    Não é responsável por projetos.
                  </p>
                )}
              </div>
            </section>
          </div>

          {profile.ledKpis.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-[13px] font-medium text-ink-soft">
                Indicadores sob sua responsabilidade
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.ledKpis.map((k) => (
                  <Link
                    key={k.id}
                    href={`/areas/${k.area.slug}`}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-[12px] text-ink-soft hover:border-brand-deep-2"
                  >
                    {k.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <p className="text-[12.5px] text-ink-faint">
          Tarefas, projetos e indicadores são visíveis apenas para a própria
          pessoa, líderes da área e administradores.
        </p>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Contribuições no Mural
        </h2>
        <div className="flex flex-col gap-2">
          {profile.muralPosts.map((p) => (
            <div
              key={p.id}
              className="rounded-(--radius-s) border border-border bg-surface p-3"
            >
              <p className="text-[12.5px] text-ink">{p.content}</p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {relativeTime(p.createdAt)}
              </p>
            </div>
          ))}
          {profile.muralPosts.length === 0 && (
            <p className="text-[12.5px] text-ink-faint">
              Ainda não publicou nada no Mural.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
