import type { Task } from "@prisma/client";
import type { PeriodRange } from "./period";

/**
 * Pontualidade e tarefas atrasadas não são preenchidas manualmente — são
 * calculadas direto do Workflow. Pontualidade usa completedAt (quando a
 * tarefa foi marcada concluída) contra o deadline, dentro do período
 * selecionado; tarefas atrasadas é sempre uma foto do agora (todas as
 * áreas), como um backlog operacional.
 */
export function computeOperationsStats(allTasks: Task[], period: PeriodRange) {
  const now = new Date();

  const tarefasAtrasadas = allTasks.filter(
    (t) => t.deadline < now && !["concluida", "cancelada"].includes(t.status)
  ).length;

  const completedInPeriod = allTasks.filter(
    (t) =>
      t.status === "concluida" &&
      t.completedAt &&
      t.completedAt >= period.start &&
      t.completedAt <= period.end
  );
  const onTime = completedInPeriod.filter(
    (t) => t.completedAt! <= t.deadline
  );
  const pontualidadePct =
    completedInPeriod.length > 0
      ? Math.round((onTime.length / completedInPeriod.length) * 100)
      : null;

  return {
    tarefasAtrasadas,
    pontualidadePct,
    completedCount: completedInPeriod.length,
  };
}
