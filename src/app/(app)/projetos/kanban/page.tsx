import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { visibleAreaSlugs } from "@/lib/permissions";
import { formatDate, TASK_PRIORITY_META } from "@/lib/format";
import { StatusPill, priorityTone } from "@/components/ui/status-pill";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { ProjetosTabs } from "@/components/projetos/projetos-tabs";
import type { TaskStatus } from "@prisma/client";

const COLUMNS: { status: TaskStatus; label: string; accent: string }[] = [
  { status: "no_ritmo", label: "No prazo", accent: "border-t-positive" },
  { status: "atencao", label: "Em risco", accent: "border-t-warning" },
  { status: "atrasada", label: "Atrasadas", accent: "border-t-critical" },
];

export default async function ProjetosKanbanPage() {
  const user = await requireUser();
  const visible = visibleAreaSlugs(user);

  const tasks = await prisma.task.findMany({
    where: {
      area: visible === "all" ? undefined : { slug: { in: visible } },
      status: { in: ["no_ritmo", "atencao", "atrasada"] },
    },
    include: { assignee: true, area: true, project: true },
    orderBy: { deadline: "asc" },
  });

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="O que não está visível, não está sob controle."
        subtitle="Cada tarefa com dono e prazo claro é combinado cumprido — é assim que a operação inteira confia na entrega do time."
      />

      <ProjetosTabs />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Projetos e Tarefas
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Kanban
        </h1>
        <p className="text-[13px] text-ink-soft">
          Todas as tarefas em execução, organizadas por status.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className={`flex flex-col gap-3 rounded-(--radius-l) border border-border border-t-4 bg-surface p-4 ${col.accent}`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-[13px] font-medium text-ink-soft">{col.label}</h2>
                <span className="tnum text-[12px] text-ink-faint">{colTasks.length}</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {colTasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/workflow/${t.id}`}
                    className="flex flex-col gap-1.5 rounded-(--radius-s) border border-border bg-canvas p-3 hover:border-brand-deep-2"
                  >
                    <span className="text-[12.5px] font-medium text-ink">{t.title}</span>
                    <span className="text-[11px] text-ink-faint">
                      {t.assignee.name} · {t.area.name}
                      {t.project ? ` · ${t.project.name}` : ""}
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="tnum text-[11px] text-ink-soft">{formatDate(t.deadline)}</span>
                      <StatusPill
                        label={TASK_PRIORITY_META[t.priority].label}
                        tone={priorityTone(t.priority)}
                      />
                    </div>
                  </Link>
                ))}
                {colTasks.length === 0 && (
                  <p className="py-3 text-center text-[12px] text-ink-faint">Nada aqui.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
