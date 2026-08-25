"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis, canManageCustomer, isAdmin } from "@/lib/permissions";
import type {
  CustomerStatus,
  RenewalStatus,
  CustomerInteractionKind,
  CustomerMeetingType,
  TaskPriority,
} from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

function revalidateCustomer(customerId: string) {
  revalidatePath("/cs");
  revalidatePath("/cs/mentorados");
  revalidatePath(`/cs/mentorados/${customerId}`);
  revalidatePath("/cs/tarefas");
}

async function findCustomerOr(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) throw new Error("not_found");
  return customer;
}

// ---------------------------------------------------------------------------
// Customer CRUD
// ---------------------------------------------------------------------------

export async function createCustomerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "cs") && !isAdmin(user)) {
    return { error: "Sem permissão." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim() || null;
  const product = String(formData.get("product") ?? "").trim();
  const csId = String(formData.get("csId") ?? "");
  const entryDateRaw = String(formData.get("entryDate") ?? "");
  const startDateRaw = String(formData.get("startDate") ?? "");
  const endDateRaw = String(formData.get("endDate") ?? "");
  const renewalDateRaw = String(formData.get("renewalDate") ?? "");
  const status = (formData.get("status") as CustomerStatus | null) || "ativo";
  const mrrRaw = String(formData.get("mrr") ?? "");
  const contractValueRaw = String(formData.get("contractValue") ?? "");
  const contractUrl = String(formData.get("contractUrl") ?? "").trim() || null;
  const otherDocsUrl = String(formData.get("otherDocsUrl") ?? "").trim() || null;

  if (!name || !product || !csId || !entryDateRaw) {
    return { error: "Preencha nome, produto, CS responsável e data de entrada." };
  }

  const customer = await prisma.customer.create({
    data: {
      name,
      company,
      product,
      csId,
      entryDate: new Date(`${entryDateRaw}T12:00:00`),
      startDate: startDateRaw ? new Date(`${startDateRaw}T12:00:00`) : null,
      endDate: endDateRaw ? new Date(`${endDateRaw}T12:00:00`) : null,
      renewalDate: renewalDateRaw ? new Date(`${renewalDateRaw}T12:00:00`) : null,
      status,
      mrr: mrrRaw ? Number(mrrRaw) : null,
      contractValue: contractValueRaw ? Number(contractValueRaw) : null,
      contractUrl,
      otherDocsUrl,
    },
  });

  revalidateCustomer(customer.id);
  return { success: true };
}

export async function updateCustomerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Cliente não encontrado." };
  if (!canManageCustomer(user, customer)) return { error: "Sem permissão." };

  const name = String(formData.get("name") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim() || null;
  const product = String(formData.get("product") ?? "").trim();
  const csId = String(formData.get("csId") ?? "") || customer.csId;
  const entryDateRaw = String(formData.get("entryDate") ?? "");
  const startDateRaw = String(formData.get("startDate") ?? "");
  const endDateRaw = String(formData.get("endDate") ?? "");
  const renewalDateRaw = String(formData.get("renewalDate") ?? "");
  const status = (formData.get("status") as CustomerStatus | null) || customer.status;
  const mrrRaw = String(formData.get("mrr") ?? "");
  const contractValueRaw = String(formData.get("contractValue") ?? "");
  const contractUrl = String(formData.get("contractUrl") ?? "").trim() || null;
  const otherDocsUrl = String(formData.get("otherDocsUrl") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!name || !product) return { error: "Preencha nome e produto." };

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name,
      company,
      product,
      csId,
      entryDate: entryDateRaw ? new Date(`${entryDateRaw}T12:00:00`) : customer.entryDate,
      startDate: startDateRaw ? new Date(`${startDateRaw}T12:00:00`) : null,
      endDate: endDateRaw ? new Date(`${endDateRaw}T12:00:00`) : null,
      renewalDate: renewalDateRaw ? new Date(`${renewalDateRaw}T12:00:00`) : null,
      status,
      mrr: mrrRaw ? Number(mrrRaw) : null,
      contractValue: contractValueRaw ? Number(contractValueRaw) : null,
      contractUrl,
      otherDocsUrl,
      notes,
    },
  });

  revalidateCustomer(customerId);
  return { success: true };
}

export async function updateCustomerStatusAction(formData: FormData) {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const status = formData.get("status") as CustomerStatus | null;
  if (!customerId || !status) return;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || !canManageCustomer(user, customer)) return;

  await prisma.customer.update({ where: { id: customerId }, data: { status } });
  revalidateCustomer(customerId);
}

// ---------------------------------------------------------------------------
// Interações
// ---------------------------------------------------------------------------

export async function addCustomerInteractionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const kind = formData.get("kind") as CustomerInteractionKind | null;
  const content = String(formData.get("content") ?? "").trim();

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Cliente não encontrado." };
  if (!canManageCustomer(user, customer)) return { error: "Sem permissão." };
  if (!kind || !content) return { error: "Escolha o tipo e escreva o conteúdo." };

  await prisma.customerInteraction.create({
    data: { customerId, kind, content, authorId: user.id },
  });
  await prisma.customer.update({
    where: { id: customerId },
    data: { lastContactAt: new Date() },
  });

  revalidateCustomer(customerId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Renovações
// ---------------------------------------------------------------------------

export async function addCustomerRenewalAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const plannedValueRaw = String(formData.get("plannedValue") ?? "");

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Cliente não encontrado." };
  if (!canManageCustomer(user, customer)) return { error: "Sem permissão." };
  if (!dueDateRaw || !plannedValueRaw) {
    return { error: "Preencha a data e o valor disponível para renovação." };
  }

  await prisma.customerRenewal.create({
    data: {
      customerId,
      dueDate: new Date(`${dueDateRaw}T12:00:00`),
      plannedValue: Number(plannedValueRaw),
    },
  });

  revalidateCustomer(customerId);
  return { success: true };
}

export async function updateCustomerRenewalAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const renewalId = String(formData.get("renewalId") ?? "");
  const status = formData.get("status") as RenewalStatus | null;
  const realizedValueRaw = String(formData.get("realizedValue") ?? "");

  const renewal = await prisma.customerRenewal.findUnique({
    where: { id: renewalId },
    include: { customer: true },
  });
  if (!renewal) return { error: "Renovação não encontrada." };
  if (!canManageCustomer(user, renewal.customer)) return { error: "Sem permissão." };

  await prisma.customerRenewal.update({
    where: { id: renewalId },
    data: {
      status: status ?? renewal.status,
      realizedValue: realizedValueRaw ? Number(realizedValueRaw) : renewal.realizedValue,
      realizedDate: status === "renovado" ? new Date() : renewal.realizedDate,
    },
  });

  revalidateCustomer(renewal.customerId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Experiências (por evento)
// ---------------------------------------------------------------------------

export async function addCustomerExperienceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const scoreRaw = String(formData.get("score") ?? "");
  const feedback = String(formData.get("feedback") ?? "").trim() || null;
  const positives = String(formData.get("positives") ?? "").trim() || null;
  const negatives = String(formData.get("negatives") ?? "").trim() || null;
  const opportunities = String(formData.get("opportunities") ?? "").trim() || null;
  const needsFollowUp = formData.get("needsFollowUp") === "on";
  const followUpOwnerId = String(formData.get("followUpOwnerId") ?? "") || null;
  const followUpDateRaw = String(formData.get("followUpDate") ?? "");

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Cliente não encontrado." };
  if (!canManageCustomer(user, customer)) return { error: "Sem permissão." };
  if (!eventId) return { error: "Selecione o evento." };

  await prisma.customerExperience.create({
    data: {
      customerId,
      eventId,
      score: scoreRaw ? Number(scoreRaw) : null,
      feedback,
      positives,
      negatives,
      opportunities,
      needsFollowUp,
      followUpOwnerId,
      followUpDate: followUpDateRaw ? new Date(`${followUpDateRaw}T12:00:00`) : null,
    },
  });

  revalidateCustomer(customerId);
  revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}

export async function toggleFollowUpDoneAction(formData: FormData) {
  const user = await requireUser();
  const experienceId = String(formData.get("experienceId") ?? "");
  const experience = await prisma.customerExperience.findUnique({
    where: { id: experienceId },
    include: { customer: true },
  });
  if (!experience || !canManageCustomer(user, experience.customer)) return;

  await prisma.customerExperience.update({
    where: { id: experienceId },
    data: { followUpDone: !experience.followUpDone },
  });
  revalidateCustomer(experience.customerId);
}

// ---------------------------------------------------------------------------
// Alerta -> Tarefa
// ---------------------------------------------------------------------------

export async function createTaskFromAlertAction(formData: FormData) {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const title = String(formData.get("title") ?? "").trim();

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer || !canManageCustomer(user, customer)) return;

  const csArea = await prisma.area.findUnique({ where: { slug: "cs" } });
  if (!csArea) return;

  await prisma.task.create({
    data: {
      title: title || "Acompanhar cliente",
      areaId: csArea.id,
      assigneeId: customer.csId,
      customerId,
      deadline: new Date(Date.now() + 3 * 86400000),
      status: "no_ritmo",
      priority: "alta",
    },
  });

  revalidateCustomer(customerId);
}

export async function createCsTaskAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const assigneeId = String(formData.get("assigneeId") ?? "");
  const customerId = String(formData.get("customerId") ?? "") || null;
  const deadlineRaw = String(formData.get("deadline") ?? "");
  const priority = (String(formData.get("priority") ?? "media") || "media") as TaskPriority;
  const recurrence = String(formData.get("recurrence") ?? "").trim() || null;

  if (!isAdmin(user) && !canEditAreaKpis(user, "cs")) {
    return { error: "Sem permissão para criar tarefas do departamento." };
  }
  if (!title || !assigneeId || !deadlineRaw) {
    return { error: "Preencha título, responsável e prazo." };
  }

  const csArea = await prisma.area.findUnique({ where: { slug: "cs" } });
  if (!csArea) return { error: "Área CS não encontrada." };

  const task = await prisma.task.create({
    data: {
      title,
      description,
      areaId: csArea.id,
      assigneeId,
      customerId,
      deadline: new Date(`${deadlineRaw}T18:00:00`),
      priority,
      recurrence,
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

  revalidatePath("/cs/tarefas");
  revalidatePath("/cs");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Encontros de mentoria (transcrição + gravação)
// ---------------------------------------------------------------------------

export async function addCustomerMeetingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const type = (formData.get("type") as CustomerMeetingType | null) || "individual";
  const label = String(formData.get("label") ?? "").trim() || null;
  const dateRaw = String(formData.get("date") ?? "");
  const transcript = String(formData.get("transcript") ?? "").trim() || null;
  const recordingUrl = String(formData.get("recordingUrl") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Cliente não encontrado." };
  if (!canManageCustomer(user, customer)) return { error: "Sem permissão." };
  if (!dateRaw) return { error: "Informe a data do encontro." };

  await prisma.customerMeeting.create({
    data: {
      customerId,
      type,
      label,
      date: new Date(`${dateRaw}T12:00:00`),
      transcript,
      recordingUrl,
      notes,
      createdById: user.id,
    },
  });

  revalidateCustomer(customerId);
  return { success: true };
}

export async function updateCustomerMeetingAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const meetingId = String(formData.get("meetingId") ?? "");
  const transcript = String(formData.get("transcript") ?? "").trim() || null;
  const recordingUrl = String(formData.get("recordingUrl") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const meeting = await prisma.customerMeeting.findUnique({
    where: { id: meetingId },
    include: { customer: true },
  });
  if (!meeting) return { error: "Encontro não encontrado." };
  if (!canManageCustomer(user, meeting.customer)) return { error: "Sem permissão." };

  await prisma.customerMeeting.update({
    where: { id: meetingId },
    data: { transcript, recordingUrl, notes },
  });

  revalidateCustomer(meeting.customerId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Observações rápidas (campo direto no card, sem abrir o form completo)
// ---------------------------------------------------------------------------

export async function updateCustomerNotesAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const customerId = String(formData.get("customerId") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) return { error: "Cliente não encontrado." };
  if (!canManageCustomer(user, customer)) return { error: "Sem permissão." };

  await prisma.customer.update({ where: { id: customerId }, data: { notes } });
  revalidateCustomer(customerId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Ações de endomarketing com os mentorados (o quê, como, onde, link, materiais)
// ---------------------------------------------------------------------------

export async function createCsActionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!isAdmin(user) && !canEditAreaKpis(user, "cs")) {
    return { error: "Sem permissão." };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const location = String(formData.get("location") ?? "").trim() || null;
  const link = String(formData.get("link") ?? "").trim() || null;
  const materialsUrl = String(formData.get("materialsUrl") ?? "").trim() || null;
  const dateRaw = String(formData.get("date") ?? "");

  if (!title || !dateRaw) return { error: "Preencha o que será feito e a data." };

  await prisma.csAction.create({
    data: {
      title,
      description,
      location,
      link,
      materialsUrl,
      date: new Date(`${dateRaw}T12:00:00`),
      createdById: user.id,
    },
  });

  revalidatePath("/cs/calendario");
  return { success: true };
}
