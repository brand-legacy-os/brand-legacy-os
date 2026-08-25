import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewCrossAreaProjects, isAdmin, visibleAreaSlugs } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { ProjectCard } from "@/components/area/project-card";
import { TaskRow } from "@/components/area/task-row";

export default async function ProjetosPage() {
  const user = await requireUser();
  const crossArea = canViewCrossAreaProjects(user);

  if (crossArea) {
    const areas = await prisma.area.findMany({
      orderBy: { order: "asc" },
      include: {
        projects: { include: { owner: true } },
        tasks: { include: { assignee: true, project: true } },
      },
    });

    const now = new Date();
    const in7d = new Date(now.getTime() + 7 * 86400000);
    const staleThreshold = new Date(now.getTime() - 5 * 86400000);

    const allProjects = areas.flatMap((a) =>
      a.projects.map((p) => ({ ...p, areaName: a.name, areaSlug: a.slug }))
    );
    const allTasks = areas.flatMap((a) =>
      a.tasks.map((t) => ({ ...t, areaName: a.name, areaSlug: a.slug }))
    );

    const upcomingDeadlines = allTasks
      .filter((t) => t.deadline <= in7d && !["concluida", "cancelada"].includes(t.status))
      .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
      .slice(0, 8);

    const overdueTasks = allTasks.filter((t) => t.status === "atrasada");
    const riskTasks = allTasks.filter((t) => t.status === "atencao");
    const staleProjects = allProjects.filter(
      (p) => p.updatedAt < staleThreshold && p.status !== "concluido"
    );

    return (
      <>
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Operações
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Projetos e Tarefas — todas as áreas
          </h1>
          <p className="text-[13px] text-ink-soft">
            Visão de acompanhamento e cobrança de execução, para {user.name}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Deadlines próximos (7 dias)
            </h2>
            <div className="flex flex-col">
              {upcomingDeadlines.map((t) => (
                <Link
                  key={t.id}
                  href={`/areas/${t.areaSlug}`}
                  className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0 hover:bg-surface-muted"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] text-ink">{t.title}</span>
                    <span className="text-[11.5px] text-ink-faint">
                      {t.assignee.name} · {t.areaName}
                    </span>
                  </div>
                  <span className="tnum text-[12.5px] text-ink-soft">
                    {formatDate(t.deadline)}
                  </span>
                </Link>
              ))}
              {upcomingDeadlines.length === 0 && (
                <p className="py-3 text-[13px] text-ink-faint">
                  Nada vencendo nos próximos 7 dias.
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Projetos sem atualização (5+ dias)
            </h2>
            <div className="flex flex-col">
              {staleProjects.map((p) => (
                <Link
                  key={p.id}
                  href={`/areas/${p.areaSlug}`}
                  className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0 hover:bg-surface-muted"
                >
                  <div className="flex flex-col">
                    <span className="text-[13px] text-ink">{p.name}</span>
                    <span className="text-[11.5px] text-ink-faint">
                      {p.owner.name} · {p.areaName}
                    </span>
                  </div>
                  <span className="tnum text-[12.5px] text-critical">
                    desde {formatDate(p.updatedAt)}
                  </span>
                </Link>
              ))}
              {staleProjects.length === 0 && (
                <p className="py-3 text-[13px] text-ink-faint">
                  Todos os projetos foram atualizados recentemente.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Tarefas atrasadas ({overdueTasks.length})
            </h2>
            <div className="rounded-(--radius-l) border border-border bg-surface px-4">
              {overdueTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  assigneeName={t.assignee.name}
                  assigneeInitials={t.assignee.avatarInitials}
                  projectName={t.project?.name}
                  canManage={isAdmin(user)}
                />
              ))}
              {overdueTasks.length === 0 && (
                <p className="py-4 text-[13px] text-ink-faint">
                  Nenhuma tarefa atrasada. 🎉
                </p>
              )}
            </div>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Tarefas em risco ({riskTasks.length})
            </h2>
            <div className="rounded-(--radius-l) border border-border bg-surface px-4">
              {riskTasks.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  assigneeName={t.assignee.name}
                  assigneeInitials={t.assignee.avatarInitials}
                  projectName={t.project?.name}
                  canManage={isAdmin(user)}
                />
              ))}
              {riskTasks.length === 0 && (
                <p className="py-4 text-[13px] text-ink-faint">
                  Nenhuma tarefa em risco no momento.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Todos os projetos ({allProjects.length})
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {allProjects.map((p) => (
              <ProjectCard
                key={p.id}
                id={p.id}
                name={p.name}
                status={p.status}
                progressPct={p.progressPct}
                deadline={p.deadline}
                ownerName={p.owner.name}
                areaName={p.areaName}
                areaHref={`/areas/${p.areaSlug}`}
                canEdit={isAdmin(user) || p.ownerId === user.id}
              />
            ))}
          </div>
        </section>
      </>
    );
  }

  // Personal aggregated view — handles multi-area membership (e.g. Igor)
  const memberAreaSlugs = visibleAreaSlugs(user);
  const areaSlugs = memberAreaSlugs === "all" ? [] : memberAreaSlugs;

  const myTasks = await prisma.task.findMany({
    where: { assigneeId: user.id },
    include: { assignee: true, project: true, area: true },
    orderBy: { deadline: "asc" },
  });
  const myProjects = await prisma.project.findMany({
    where: { ownerId: user.id },
    include: { owner: true, area: true },
    orderBy: { deadline: "asc" },
  });

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Projetos e Tarefas
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Meu trabalho
        </h1>
        <p className="text-[13px] text-ink-soft">
          Tudo o que está sob sua responsabilidade
          {areaSlugs.length > 1 ? ", somando as suas áreas" : ""}.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Minhas tarefas ({myTasks.length})
        </h2>
        <div className="rounded-(--radius-l) border border-border bg-surface px-4">
          {myTasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              assigneeName={t.assignee.name}
              assigneeInitials={t.assignee.avatarInitials}
              projectName={t.project?.name}
              canManage
            />
          ))}
          {myTasks.length === 0 && (
            <p className="py-4 text-[13px] text-ink-faint">
              Nenhuma tarefa atribuída a você no momento.
            </p>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Meus projetos ({myProjects.length})
        </h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {myProjects.map((p) => (
            <ProjectCard
              key={p.id}
              id={p.id}
              name={p.name}
              status={p.status}
              progressPct={p.progressPct}
              deadline={p.deadline}
              ownerName={p.owner.name}
              areaName={p.area.name}
              areaHref={`/areas/${p.area.slug}`}
              canEdit
            />
          ))}
          {myProjects.length === 0 && (
            <p className="text-[13px] text-ink-faint">
              Você não é responsável por nenhum projeto no momento.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
