"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import type { EventStatus, SponsorStatus, AttendeeCategory } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

function canManageEvents(user: Awaited<ReturnType<typeof requireUser>>) {
  return isAdmin(user) || isLeaderOf(user, "eventos");
}

function revalidateEvent(eventId?: string) {
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  if (eventId) revalidatePath(`/eventos/${eventId}`);
}

export async function createEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) {
    return { error: "Apenas o líder de Eventos pode criar eventos." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const startRaw = String(formData.get("startDate") ?? "");
  const endRaw = String(formData.get("endDate") ?? "");
  const location = String(formData.get("location") ?? "").trim() || null;
  const budgetRaw = String(formData.get("budgetPlanned") ?? "").replace(",", ".");

  if (!name || !type || !startRaw || !endRaw) {
    return { error: "Preencha nome, tipo, início e término." };
  }

  const event = await prisma.event.create({
    data: {
      name,
      type,
      location,
      startDate: new Date(`${startRaw}T09:00:00`),
      endDate: new Date(`${endRaw}T18:00:00`),
      budgetPlanned: budgetRaw ? Number(budgetRaw) : null,
      responsibleId: user.id,
      status: "planejamento",
    },
  });

  revalidateEvent(event.id);
  return { success: true };
}

export async function updateEventAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const startRaw = String(formData.get("startDate") ?? "");
  const endRaw = String(formData.get("endDate") ?? "");
  const location = String(formData.get("location") ?? "").trim() || null;
  const description = String(formData.get("description") ?? "").trim() || null;
  const budgetRaw = String(formData.get("budgetPlanned") ?? "").replace(",", ".");

  if (!eventId || !name || !type || !startRaw || !endRaw) {
    return { error: "Preencha nome, tipo, início e término." };
  }

  await prisma.event.update({
    where: { id: eventId },
    data: {
      name,
      type,
      location,
      description,
      startDate: new Date(`${startRaw}T09:00:00`),
      endDate: new Date(`${endRaw}T18:00:00`),
      budgetPlanned: budgetRaw ? Number(budgetRaw) : null,
    },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function updateEventNpsAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;

  const eventId = String(formData.get("eventId") ?? "");
  const responsesRaw = String(formData.get("npsResponses") ?? "");
  const averageRaw = String(formData.get("npsAverage") ?? "").replace(",", ".");
  if (!eventId) return;

  const npsResponses = responsesRaw ? Math.max(0, Math.round(Number(responsesRaw))) : null;
  const npsAverage = averageRaw ? Number(averageRaw) : null;
  if (responsesRaw && Number.isNaN(npsResponses)) return;
  if (averageRaw && Number.isNaN(npsAverage)) return;

  await prisma.event.update({
    where: { id: eventId },
    data: { npsResponses, npsAverage },
  });

  revalidateEvent(eventId);
}

export async function updateEventStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const eventId = String(formData.get("eventId") ?? "");
  const status = formData.get("status") as EventStatus | null;
  if (!eventId || !status) return;
  await prisma.event.update({ where: { id: eventId }, data: { status } });
  revalidateEvent(eventId);
}

export async function addBudgetLineAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const category = String(formData.get("category") ?? "").trim();
  const item = String(formData.get("item") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const plannedRaw = String(formData.get("plannedValue") ?? "0").replace(",", ".");
  const actualRaw = String(formData.get("actualValue") ?? "").replace(",", ".");
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim() || null;
  const supplier = String(formData.get("supplier") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "").trim() || null;

  if (!item) return { error: "Descreva o item de orçamento." };

  await prisma.eventBudgetLine.create({
    data: {
      eventId,
      category: category || "Geral",
      item,
      description,
      supplier,
      paymentMethod,
      status,
      plannedValue: Number(plannedRaw) || 0,
      actualValue: actualRaw ? Number(actualRaw) : null,
    },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function addBudgetLinePaymentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const budgetLineId = String(formData.get("budgetLineId") ?? "");
  const dueRaw = String(formData.get("dueDate") ?? "");
  const amountRaw = String(formData.get("amount") ?? "0").replace(",", ".");

  const line = await prisma.eventBudgetLine.findUnique({ where: { id: budgetLineId } });
  if (!line) return { error: "Item de orçamento não encontrado." };
  if (!dueRaw) return { error: "Informe a data da parcela." };

  await prisma.eventBudgetLinePayment.create({
    data: {
      budgetLineId,
      dueDate: new Date(`${dueRaw}T12:00:00`),
      amount: Number(amountRaw) || 0,
    },
  });

  revalidateEvent(line.eventId);
  return { success: true };
}

export async function toggleBudgetLinePaymentAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;

  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await prisma.eventBudgetLinePayment.findUnique({
    where: { id: paymentId },
    include: { budgetLine: { include: { event: true } } },
  });
  if (!payment) return;

  if (!payment.paid) {
    const movement = await prisma.cashMovement.create({
      data: {
        date: payment.dueDate,
        description: `${payment.budgetLine.item} (${payment.budgetLine.event.name})`,
        amount: -Math.abs(payment.amount),
        eventId: payment.budgetLine.eventId,
      },
    });
    await prisma.eventBudgetLinePayment.update({
      where: { id: paymentId },
      data: { paid: true, paidDate: new Date(), cashMovementId: movement.id },
    });
  } else {
    if (payment.cashMovementId) {
      await prisma.cashMovement.delete({ where: { id: payment.cashMovementId } }).catch(() => {});
    }
    await prisma.eventBudgetLinePayment.update({
      where: { id: paymentId },
      data: { paid: false, paidDate: null, cashMovementId: null },
    });
  }

  revalidateEvent(payment.budgetLine.eventId);
  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro");
}

export async function addSponsorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const contractRaw = String(formData.get("contractValue") ?? "0").replace(",", ".");
  const status = (formData.get("status") as SponsorStatus) || "negociacao";

  if (!name) return { error: "Informe o nome do patrocinador." };

  await prisma.eventSponsor.create({
    data: {
      eventId,
      name,
      contractValue: Number(contractRaw) || 0,
      status,
    },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function toggleSponsorPaymentAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await prisma.eventSponsorPayment.findUnique({
    where: { id: paymentId },
    include: { sponsor: true },
  });
  if (!payment) return;
  await prisma.eventSponsorPayment.update({
    where: { id: paymentId },
    data: { paid: !payment.paid, paidDate: !payment.paid ? new Date() : null },
  });
  revalidateEvent(payment.sponsor.eventId);
}

export async function addSponsorPaymentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const sponsorId = String(formData.get("sponsorId") ?? "");
  const dueRaw = String(formData.get("dueDate") ?? "");
  const amountRaw = String(formData.get("amount") ?? "0").replace(",", ".");

  const sponsor = await prisma.eventSponsor.findUnique({ where: { id: sponsorId } });
  if (!sponsor) return { error: "Patrocinador não encontrado." };
  if (!dueRaw) return { error: "Informe a data de vencimento." };

  await prisma.eventSponsorPayment.create({
    data: {
      sponsorId,
      dueDate: new Date(`${dueRaw}T12:00:00`),
      amount: Number(amountRaw) || 0,
    },
  });

  revalidateEvent(sponsor.eventId);
  return { success: true };
}

export async function addAttendeeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim() || null;
  const category = formData.get("category") as AttendeeCategory | null;
  const ticketType = String(formData.get("ticketType") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!name || !category) return { error: "Informe nome e categoria." };

  await prisma.eventAttendee.create({
    data: { eventId, name, empresa, category, ticketType, email },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function toggleAttendeeCheckedInAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const attendeeId = String(formData.get("attendeeId") ?? "");
  const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return;
  await prisma.eventAttendee.update({
    where: { id: attendeeId },
    data: { checkedIn: !attendee.checkedIn },
  });
  revalidateEvent(attendee.eventId);
}

export async function setAttendeeNpsAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const attendeeId = String(formData.get("attendeeId") ?? "");
  const score = Number(formData.get("score") ?? "");
  if (!attendeeId || Number.isNaN(score)) return;
  const attendee = await prisma.eventAttendee.update({
    where: { id: attendeeId },
    data: { npsScore: Math.max(0, Math.min(10, score)) },
  });
  revalidateEvent(attendee.eventId);
}

export async function addEventNoteAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const eventId = String(formData.get("eventId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return { error: "Escreva um aviso ou observação." };

  await prisma.eventNote.create({
    data: { eventId, authorId: user.id, content },
  });

  revalidateEvent(eventId);
  return { success: true };
}
