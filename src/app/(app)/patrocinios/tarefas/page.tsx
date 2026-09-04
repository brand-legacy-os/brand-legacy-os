import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewSponsors, canManageSponsors } from "@/lib/permissions";
import { formatDate, TASK_STATUS_META, TASK_PRIORITY_META } from "@/lib/format";
import { StatusPill, taskStatusTone, priorityTone } from "@/components/ui/status-pill";
import { PatrociniosTabs } from "@/components/patrocinios/patrocinios-tabs";
import { AddSponsorTaskForm } from "@/components/patrocinios/add-sponsor-task-form";

export default async function PatrociniosTarefasPage() {
  const user = await requireUser();
  if (!canViewSponsors(user)) notFound();
  const canManage = canManageSponsors(user);

  const [tasks, eventosArea, allUsers] = await Promise.all([
    prisma.task.findMany({
      where: { sponsorId: { not: null } },
      include: { sponsor: true, assignee: true },
      orderBy: { deadline: "asc" },
    }),
    prisma.area.findUnique({ where: { slug: "eventos" } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const bySponsor = new Map<string, { sponsorId: string; sponsorName: string; tasks: typeof tasks }>();
  for (const t of tasks) {
    if (!t.sponsor) continue;
    const entry = bySponsor.get(t.sponsor.id) ?? { sponsorId: t.sponsor.id, sponsorName: t.sponsor.name, tasks: [] };
    entry.tasks.push(t);
    bySponsor.set(t.sponsor.id, entry);
  }
  const groups = [...bySponsor.values()].sort((a, b) => a.sponsorName.localeCompare(b.sponsorName));

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">Área</p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">Patrocínios</h1>
        <p className="max-w-[72ch] text-[13px] text-ink-soft">
          TO-DOs de cada fornecedor/patrocinador, centralizados aqui — a mesma tarefa
          criada no card do patrocinador aparece nesta lista, e vice-versa.
        </p>
      </div>

      <PatrociniosTabs />

      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <section key={g.sponsorId} className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <div className="flex items-center justify-between">
              <Link href={`/patrocinios/${g.sponsorId}`} className="text-[13.5px] font-medium text-ink hover:text-brand-deep hover:underline">
                {g.sponsorName} ({g.tasks.length})
              </Link>
              {canManage && eventosArea && (
                <AddSponsorTaskForm sponsorId={g.sponsorId} areaId={eventosArea.id} members={allUsers} />
              )}
            </div>
            <div className="flex flex-col">
              {g.tasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 border-t border-border py-2 first:border-t-0">
                  <div className="flex flex-col">
                    <Link href={`/workflow/${t.id}`} className="text-[13px] text-ink hover:text-brand-deep hover:underline">
                      {t.title}
                    </Link>
                    <span className="text-[11px] text-ink-faint">
                      {t.assignee.name} · vence {formatDate(t.deadline)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill label={TASK_PRIORITY_META[t.priority].label} tone={priorityTone(t.priority)} />
                    <StatusPill label={TASK_STATUS_META[t.status].label} tone={taskStatusTone(t.status)} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {groups.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
            Nenhuma tarefa vinculada a patrocinador ainda. Adicione pela ficha do patrocinador em Base de patrocinadores.
          </p>
        )}
      </div>
    </>
  );
}
