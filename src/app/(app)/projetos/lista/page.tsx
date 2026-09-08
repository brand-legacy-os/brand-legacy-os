import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { visibleAreaSlugs, isAdmin, canEditAreaKpis } from "@/lib/permissions";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { ProjetosTabs } from "@/components/projetos/projetos-tabs";
import { ProjectCard } from "@/components/area/project-card";
import { CreateProjectForm } from "@/components/area/create-project-form";
import { TaskRow } from "@/components/area/task-row";

export default async function ProjetosListaPage() {
  const user = await requireUser();
  const visible = visibleAreaSlugs(user);

  const [areas, events] = await Promise.all([
    prisma.area.findMany({
      where: visible === "all" ? undefined : { slug: { in: visible } },
      orderBy: { order: "asc" },
      include: {
        memberships: { include: { user: true } },
        projects: { include: { owner: true, event: true } },
        tasks: { include: { assignee: true } },
      },
    }),
    prisma.event.findMany({
      where: { status: { notIn: ["realizado", "cancelado"] } },
      select: { id: true, name: true },
      orderBy: { startDate: "asc" },
    }),
  ]);

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Projeto sem cobrança vira intenção, não entrega."
        subtitle="Acompanhar de perto não é desconfiar do time — é garantir que cada prazo combinado vire resultado real."
      />

      <ProjetosTabs />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Projetos e Tarefas
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Projetos
        </h1>
        <p className="text-[13px] text-ink-soft">
          Projetos, lançamentos, eventos e outras iniciativas por área — pode
          vincular um projeto a um evento real ou criar como uma iniciativa
          independente.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {areas.map((a) => {
          const orphanTasks = a.tasks.filter((t) => !t.projectId);
          const canCreate = isAdmin(user) || canEditAreaKpis(user, a.slug);
          return (
            <div key={a.id} className="flex flex-col gap-3">
              <Link
                href={`/areas/${a.slug}`}
                className="w-fit text-[12.5px] font-medium text-ink hover:text-brand-deep hover:underline"
              >
                {a.name} ({a.projects.length + orphanTasks.length}) →
              </Link>

              {a.projects.length > 0 && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {a.projects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      status={p.status}
                      progressPct={p.progressPct}
                      deadline={p.deadline}
                      ownerName={p.owner.name}
                      areaName={a.name}
                      areaHref={`/areas/${a.slug}`}
                      canEdit={isAdmin(user) || p.ownerId === user.id}
                      kind={p.kind}
                      eventName={p.event?.name}
                      eventHref={p.event ? `/eventos/${p.event.id}` : undefined}
                    />
                  ))}
                </div>
              )}

              {orphanTasks.length > 0 && (
                <div className="rounded-(--radius-l) border border-border bg-surface px-4">
                  {orphanTasks.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      assigneeName={t.assignee.name}
                      assigneeInitials={t.assignee.avatarInitials}
                      canManage={isAdmin(user)}
                    />
                  ))}
                </div>
              )}

              {a.projects.length === 0 && orphanTasks.length === 0 && (
                <p className="text-[12.5px] text-ink-faint">
                  Nenhum projeto ou tarefa nessa área ainda.
                </p>
              )}

              {canCreate && (
                <CreateProjectForm
                  areaId={a.id}
                  members={a.memberships.map((m) => ({ id: m.user.id, name: m.user.name }))}
                  events={events}
                />
              )}
            </div>
          );
        })}
        {areas.length === 0 && (
          <p className="text-[13px] text-ink-faint">Nenhuma área visível.</p>
        )}
      </div>
    </>
  );
}
