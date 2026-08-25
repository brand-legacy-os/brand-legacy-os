import { prisma } from "@/lib/db";

/**
 * Lembretes de prazo — computados ao vivo a cada carregamento (não há um
 * scheduler no app), então nunca ficam desatualizados e não exigem um job
 * em background: tarefas do usuário que vencem em até 2 dias.
 */
export async function getUpcomingDeadlineReminders(userId: string) {
  const now = new Date();
  const in2Days = new Date(now.getTime() + 2 * 86400000);

  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: { notIn: ["concluida", "cancelada"] },
      deadline: { gte: now, lte: in2Days },
    },
    orderBy: { deadline: "asc" },
  });

  return tasks.map((t) => ({
    id: t.id,
    message: `Prazo se aproxima: "${t.title}" vence ${formatRelativeDeadline(t.deadline, now)}.`,
    link: `/workflow/${t.id}`,
    deadline: t.deadline,
  }));
}

function formatRelativeDeadline(deadline: Date, now: Date) {
  const days = Math.round((deadline.getTime() - now.getTime()) / 86400000);
  if (days <= 0) return "hoje";
  if (days === 1) return "amanhã";
  return `em ${days} dias`;
}
