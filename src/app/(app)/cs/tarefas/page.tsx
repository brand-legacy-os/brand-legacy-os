import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewCsDepartment, canEditAreaKpis, isAdmin } from "@/lib/permissions";
import { CsTabs } from "@/components/cs/cs-tabs";
import { CreateCsTaskForm } from "@/components/cs/create-cs-task-form";
import { TaskRow } from "@/components/area/task-row";
import { TASK_PRIORITY_META } from "@/lib/format";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function CsTarefasPage({
  searchParams,
}: PageProps<"/cs/tarefas">) {
  const user = await requireUser();
  if (!canViewCsDepartment(user)) notFound();
  const sp = await searchParams;
  const view = typeof sp.view === "string" ? sp.view : "minhas";
  const cliente = typeof sp.cliente === "string" ? sp.cliente : undefined;

  const csArea = await prisma.area.findUnique({ where: { slug: "cs" } });
  if (!csArea) notFound();

  const canManageDept = isAdmin(user) || canEditAreaKpis(user, "cs");

  const [tasks, csReps, customers] = await Promise.all([
    prisma.task.findMany({
      where: { areaId: csArea.id },
      include: { assignee: true, customer: true },
      orderBy: { deadline: "asc" },
    }),
    prisma.membership.findMany({ where: { area: { slug: "cs" } }, include: { user: true } }),
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
  ]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 86400000);

  const openTasks = tasks.filter((t) => !["concluida", "cancelada"].includes(t.status));
  const overdue = openTasks.filter((t) => t.deadline < startOfToday);
  const dueToday = openTasks.filter((t) => t.deadline >= startOfToday && t.deadline <= endOfToday);
  const dueThisWeek = openTasks.filter((t) => t.deadline > endOfToday && t.deadline <= endOfWeek);
  const completed = tasks.filter((t) => t.status === "concluida");
  const inProgress = openTasks.filter((t) => t.deadline > endOfWeek);

  const scoped = view === "todas" && canManageDept ? tasks : tasks.filter((t) => t.assigneeId === user.id);
  const visible = cliente ? scoped.filter((t) => t.customerId === cliente) : scoped;

  const sortedByPriority = [...visible].sort((a, b) => {
    const overdueA = a.deadline < startOfToday && !["concluida", "cancelada"].includes(a.status) ? 0 : 1;
    const overdueB = b.deadline < startOfToday && !["concluida", "cancelada"].includes(b.status) ? 0 : 1;
    if (overdueA !== overdueB) return overdueA - overdueB;
    return TASK_PRIORITY_META[b.priority].order - TASK_PRIORITY_META[a.priority].order;
  });

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Área
          </p>
          <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
            Customer Success
          </h1>
          <p className="text-[13px] text-ink-soft">
            Central de tarefas do departamento — reaproveita o Workflow, com vínculo direto a mentorados.
          </p>
        </div>
      </div>

      <CsTabs />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Atrasadas</p>
          <p className="tnum text-[20px] font-medium text-critical">{overdue.length}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Hoje</p>
          <p className="tnum text-[20px] font-medium text-warning">{dueToday.length}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Esta semana</p>
          <p className="tnum text-[20px] font-medium text-ink">{dueThisWeek.length}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Em andamento</p>
          <p className="tnum text-[20px] font-medium text-ink">{inProgress.length}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Concluídas</p>
          <p className="tnum text-[20px] font-medium text-positive">{completed.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1">
          <a
            href="/cs/tarefas?view=minhas"
            className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium ${view !== "todas" ? "bg-brand-deep text-gold-soft" : "text-ink-soft"}`}
          >
            Minhas tarefas
          </a>
          {canManageDept && (
            <a
              href="/cs/tarefas?view=todas"
              className={`rounded-full px-3 py-1.5 text-[12.5px] font-medium ${view === "todas" ? "bg-brand-deep text-gold-soft" : "text-ink-soft"}`}
            >
              Todas do departamento
            </a>
          )}
        </div>
        {canManageDept && (
          <CreateCsTaskForm
            members={csReps.map((m) => ({ id: m.userId, name: m.user.name }))}
            customers={customers.map((c) => ({ id: c.id, name: c.name }))}
            defaultCustomerId={cliente}
          />
        )}
      </div>

      <div className="rounded-(--radius-l) border border-border bg-surface px-4">
        {sortedByPriority.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            assigneeName={t.assignee.name}
            assigneeInitials={initials(t.assignee.name)}
            customerName={t.customer?.name}
            customerHref={t.customerId ? `/cs/mentorados/${t.customerId}` : undefined}
            canManage={canManageDept || t.assigneeId === user.id}
          />
        ))}
        {sortedByPriority.length === 0 && (
          <p className="py-8 text-center text-[13px] text-ink-faint">
            Nenhuma tarefa encontrada.
          </p>
        )}
      </div>
    </>
  );
}
