"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageTask, canEditAreaKpis, canViewArea, isAdmin, canManageAnyAreaTask } from "@/lib/permissions";
import type { TaskStatus, TaskPriority } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

function revalidateTaskViews(areaSlug: string, taskId?: string) {
  revalidatePath(`/areas/${areaSlug}`);
  revalidatePath("/projetos");
  revalidatePath("/dashboard");
  revalidatePath("/workflow");
  // Tarefas abertas a partir do card estilo Asana do calendário de Social
  // precisam refletir aqui também — barato revalidar sempre, mesmo para
  // tarefas sem origem no calendário.
  revalidatePath("/social/calendario");
  if (taskId) revalidatePath(`/workflow/${taskId}`);
}

export async function updateTaskAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const status = formData.get("status") as TaskStatus | null;
  const priority = formData.get("priority") as TaskPriority | null;
  const deadlineRaw = formData.get("deadline");
  const note = formData.get("note");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { area: true },
  });
  if (!task) return { error: "Tarefa não encontrada." };

  if (!canManageTask(user, { assigneeId: task.assigneeId, areaSlug: task.area.slug })) {
    return { error: "Você não tem permissão para atualizar esta tarefa." };
  }

  const data: {
    status?: TaskStatus;
    priority?: TaskPriority;
    note?: string | null;
    deadline?: Date;
    completedAt?: Date | null;
  } = {};

  if (status && status !== task.status) {
    data.status = status;
    data.completedAt = status === "concluida" ? new Date() : null;
    await prisma.auditLog.create({
      data: {
        entityType: "Task",
        entityId: task.id,
        field: "status",
        oldValue: task.status,
        newValue: status,
        userId: user.id,
      },
    });
  }
  if (priority && priority !== task.priority) {
    data.priority = priority;
    await prisma.auditLog.create({
      data: {
        entityType: "Task",
        entityId: task.id,
        field: "prioridade",
        oldValue: task.priority,
        newValue: priority,
        userId: user.id,
      },
    });
  }
  if (deadlineRaw) {
    const newDeadline = new Date(`${String(deadlineRaw)}T18:00:00`);
    if (!Number.isNaN(newDeadline.getTime()) && newDeadline.getTime() !== task.deadline.getTime()) {
      data.deadline = newDeadline;
      await prisma.auditLog.create({
        data: {
          entityType: "Task",
          entityId: task.id,
          field: "deadline",
          oldValue: task.deadline.toISOString().slice(0, 10),
          newValue: newDeadline.toISOString().slice(0, 10),
          userId: user.id,
        },
      });
    }
  }
  if (note !== null) {
    const noteValue = String(note).trim() || null;
    if (noteValue !== task.note) {
      data.note = noteValue;
      await prisma.auditLog.create({
        data: {
          entityType: "Task",
          entityId: task.id,
          field: "observação",
          oldValue: task.note,
          newValue: noteValue,
          userId: user.id,
        },
      });
    }
  }

  if (Object.keys(data).length > 0) {
    await prisma.task.update({ where: { id: taskId }, data });
  }

  revalidateTaskViews(task.area.slug, task.id);

  return { success: true };
}

export async function toggleChecklistItemAction(formData: FormData) {
  const user = await requireUser();
  const itemId = String(formData.get("itemId") ?? "");

  const item = await prisma.taskChecklistItem.findUnique({
    where: { id: itemId },
    include: { task: { include: { area: true } } },
  });
  if (!item) return;

  if (
    !canManageTask(user, {
      assigneeId: item.task.assigneeId,
      areaSlug: item.task.area.slug,
    })
  ) {
    return;
  }

  await prisma.taskChecklistItem.update({
    where: { id: itemId },
    data: { done: !item.done },
  });

  revalidateTaskViews(item.task.area.slug, item.taskId);
}

export async function addChecklistItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { error: "Escreva o item do checklist." };

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { area: true } });
  if (!task) return { error: "Tarefa não encontrada." };
  if (!canManageTask(user, { assigneeId: task.assigneeId, areaSlug: task.area.slug })) {
    return { error: "Você não tem permissão para editar esta tarefa." };
  }

  const count = await prisma.taskChecklistItem.count({ where: { taskId } });
  await prisma.taskChecklistItem.create({
    data: { taskId, label, order: count },
  });

  revalidateTaskViews(task.area.slug, task.id);
  return { success: true };
}

export async function addTaskCommentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Escreva um comentário." };

  const task = await prisma.task.findUnique({ where: { id: taskId }, include: { area: true } });
  if (!task) return { error: "Tarefa não encontrada." };
  if (!canViewArea(user, task.area.slug)) {
    return { error: "Você não tem acesso a esta tarefa." };
  }

  await prisma.taskComment.create({
    data: { taskId, authorId: user.id, content },
  });

  revalidateTaskViews(task.area.slug, task.id);
  return { success: true };
}

export async function reassignTaskAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  const assigneeId = String(formData.get("assigneeId") ?? "");

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { area: true },
  });
  if (!task) return { error: "Tarefa não encontrada." };

  if (!canEditAreaKpis(user, task.area.slug) && !canManageAnyAreaTask(user)) {
    return { error: "Apenas o líder da área pode reatribuir tarefas." };
  }

  const newAssignee = await prisma.user.findUnique({ where: { id: assigneeId } });
  if (!newAssignee) return { error: "Responsável inválido." };

  await prisma.auditLog.create({
    data: {
      entityType: "Task",
      entityId: task.id,
      field: "responsável",
      oldValue: task.assigneeId,
      newValue: assigneeId,
      userId: user.id,
    },
  });

  await prisma.task.update({ where: { id: taskId }, data: { assigneeId } });

  if (assigneeId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        type: "tarefa",
        message: `${user.name} atribuiu a você a tarefa "${task.title}".`,
        link: `/workflow/${task.id}`,
      },
    });
  }

  revalidateTaskViews(task.area.slug, task.id);

  return { success: true };
}

export type DeleteTaskState = { error?: string; success?: boolean };

export async function deleteTaskAction(taskId: string): Promise<DeleteTaskState> {
  const user = await requireUser();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { area: true },
  });
  if (!task) return { error: "Tarefa não encontrada." };

  if (!isAdmin(user) && !canEditAreaKpis(user, task.area.slug) && task.assigneeId !== user.id) {
    return { error: "Você não tem permissão para excluir esta tarefa." };
  }

  await prisma.taskComment.deleteMany({ where: { taskId } });
  await prisma.taskChecklistItem.deleteMany({ where: { taskId } });
  await prisma.auditLog.deleteMany({ where: { entityType: "Task", entityId: taskId } });
  await prisma.task.delete({ where: { id: taskId } });

  revalidateTaskViews(task.area.slug, taskId);

  return { success: true };
}

export async function createTaskAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const areaId = String(formData.get("areaId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const assigneeId = String(formData.get("assigneeId") ?? "");
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const projectId = String(formData.get("projectId") ?? "") || null;

  const area = await prisma.area.findUnique({ where: { id: areaId } });
  if (!area) return { error: "Área inválida." };

  if (!canEditAreaKpis(user, area.slug) && !canManageAnyAreaTask(user)) {
    return { error: "Apenas o líder da área pode criar tarefas." };
  }

  if (!title || !assigneeId || !deadlineRaw) {
    return { error: "Preencha título, responsável e deadline." };
  }

  const priority = (String(formData.get("priority") ?? "media") || "media") as TaskPriority;
  const product = String(formData.get("product") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const contentPostId = String(formData.get("contentPostId") ?? "") || null;
  const sponsorId = String(formData.get("sponsorId") ?? "") || null;

  const task = await prisma.task.create({
    data: {
      title,
      description,
      product,
      areaId,
      assigneeId,
      projectId,
      priority,
      contentPostId,
      sponsorId,
      deadline: new Date(`${deadlineRaw}T18:00:00`),
      status: "no_ritmo",
    },
  });

  if (assigneeId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        type: "tarefa",
        message: `${user.name} atribuiu a você a tarefa "${title}".`,
        link: `/workflow/${task.id}`,
      },
    });
  }

  revalidateTaskViews(area.slug);
  if (sponsorId) revalidatePath(`/patrocinios/${sponsorId}`);

  return { success: true };
}
