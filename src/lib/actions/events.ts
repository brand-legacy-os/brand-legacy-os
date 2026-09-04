"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import { saveUpload, validateUpload, UPLOAD_TYPES } from "@/lib/upload";
import { parseNpsExcel } from "@/lib/nps-excel";
import { EVENT_BUDGET_CATEGORY_META } from "@/lib/sponsors";
import type {
  EventStatus,
  AttendeeCategory,
  EventBudgetCategory,
  EventDynamicChoice,
  CommsStatus,
} from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

function canManageEvents(user: Awaited<ReturnType<typeof requireUser>>) {
  return isAdmin(user) || isLeaderOf(user, "eventos");
}

function revalidateEvent(eventId?: string) {
  revalidatePath("/eventos");
  revalidatePath("/dashboard");
  if (eventId) revalidatePath(`/eventos/${eventId}`);
}

// ---------------------------------------------------------------------------
// Evento
// ---------------------------------------------------------------------------

/** Lê os pares categoria/valor planejado enviados na criação do evento — ver
 * create-event-form.tsx, que renderiza um bloco repetível por categoria de
 * orçamento fixa (as 7 + Outro). */
function parsePlannedCategories(formData: FormData) {
  const categories = formData.getAll("plannedCategory") as string[];
  const values = formData.getAll("plannedValue") as string[];
  const lines: { category: EventBudgetCategory; item: string; plannedValue: number }[] = [];
  for (let i = 0; i < categories.length; i++) {
    const value = Number((values[i] ?? "0").replace(",", "."));
    if (categories[i] && value > 0) {
      const category = categories[i] as EventBudgetCategory;
      lines.push({ category, item: EVENT_BUDGET_CATEGORY_META[category].label, plannedValue: value });
    }
  }
  return lines;
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
  const venueAddress = String(formData.get("venueAddress") ?? "").trim() || null;
  const venueCostRaw = String(formData.get("venueCost") ?? "").replace(",", ".");
  const venueNotes = String(formData.get("venueNotes") ?? "").trim() || null;

  if (!name || !type || !startRaw || !endRaw) {
    return { error: "Preencha nome, tipo, início e término." };
  }

  const plannedLines = parsePlannedCategories(formData);

  const event = await prisma.event.create({
    data: {
      name,
      type,
      location,
      startDate: new Date(`${startRaw}T09:00:00`),
      endDate: new Date(`${endRaw}T18:00:00`),
      budgetPlanned: budgetRaw ? Number(budgetRaw) : null,
      venueAddress,
      venueCost: venueCostRaw ? Number(venueCostRaw) : null,
      venueNotes,
      responsibleId: user.id,
      status: "planejamento",
      budgetLines: { create: plannedLines },
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
  const venueAddress = String(formData.get("venueAddress") ?? "").trim() || null;
  const venueCostRaw = String(formData.get("venueCost") ?? "").replace(",", ".");
  const venueNotes = String(formData.get("venueNotes") ?? "").trim() || null;
  const enpsDay1Url = String(formData.get("enpsDay1Url") ?? "").trim() || null;
  const enpsDay2Url = String(formData.get("enpsDay2Url") ?? "").trim() || null;
  const enpsDay3Url = String(formData.get("enpsDay3Url") ?? "").trim() || null;

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
      venueAddress,
      venueCost: venueCostRaw ? Number(venueCostRaw) : null,
      venueNotes,
      enpsDay1Url,
      enpsDay2Url,
      enpsDay3Url,
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

export type NpsExcelState = { error?: string; success?: boolean; count?: number };

export async function uploadNpsExcelAction(
  _prev: NpsExcelState,
  formData: FormData
): Promise<NpsExcelState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const file = formData.get("file");
  if (!eventId || !(file instanceof File) || file.size === 0) {
    return { error: "Selecione a planilha de respostas." };
  }

  const v = validateUpload(file, UPLOAD_TYPES.spreadsheet, "Envie um arquivo .xlsx, .xls ou .csv.");
  if (v.error) return { error: v.error };

  const buffer = Buffer.from(await file.arrayBuffer());
  let parsed;
  try {
    parsed = parseNpsExcel(buffer);
  } catch {
    return { error: "Não consegui ler essa planilha." };
  }
  if (parsed.scores.length === 0) {
    return {
      error: "Não encontrei uma coluna de nota (nota/score/nps) com valores. Confira o cabeçalho da planilha.",
    };
  }

  const npsExcelUrl = await saveUpload(file, "eventos/nps");
  const npsAverage = parsed.scores.reduce((s, v) => s + v, 0) / parsed.scores.length;

  await prisma.event.update({
    where: { id: eventId },
    data: {
      npsExcelUrl,
      npsExcelComments: parsed.comments.join("\n"),
      npsAverage,
      npsResponses: parsed.scores.length,
    },
  });

  revalidateEvent(eventId);
  return { success: true, count: parsed.scores.length };
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

// ---------------------------------------------------------------------------
// Orçamento — previsto por categoria + realizado (fornecedor completo)
// ---------------------------------------------------------------------------

export async function addBudgetLineAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const category = formData.get("category") as EventBudgetCategory | null;
  const item = String(formData.get("item") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const supplier = String(formData.get("supplier") ?? "").trim() || null;
  const supplierCnpj = String(formData.get("supplierCnpj") ?? "").trim() || null;
  const supplierContact = String(formData.get("supplierContact") ?? "").trim() || null;
  const supplierPhone = String(formData.get("supplierPhone") ?? "").trim() || null;
  const quantityRaw = String(formData.get("quantity") ?? "").replace(",", ".");
  const unitValueRaw = String(formData.get("unitValue") ?? "").replace(",", ".");
  const plannedRaw = String(formData.get("plannedValue") ?? "").replace(",", ".");
  const actualRaw = String(formData.get("actualValue") ?? "").replace(",", ".");
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "").trim() || null;

  if (!item || !category) return { error: "Escolha a categoria e descreva a despesa." };

  let nfUrl: string | null = null;
  const nf = formData.get("nf");
  if (nf instanceof File && nf.size > 0) {
    const v = validateUpload(nf, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido para a NF.");
    if (v.error) return { error: v.error };
    nfUrl = await saveUpload(nf, "eventos/nf");
  }

  const quantity = quantityRaw ? Number(quantityRaw) : null;
  const unitValue = unitValueRaw ? Number(unitValueRaw) : null;
  const actualValue = actualRaw
    ? Number(actualRaw)
    : quantity && unitValue
      ? quantity * unitValue
      : null;

  const line = await prisma.eventBudgetLine.create({
    data: {
      eventId,
      category,
      item,
      description,
      supplier,
      supplierCnpj,
      supplierContact,
      supplierPhone,
      quantity,
      unitValue,
      nfUrl,
      paymentMethod,
      status,
      plannedValue: plannedRaw ? Number(plannedRaw) : null,
      actualValue,
    },
  });

  const installmentCount = Number(formData.get("installmentCount") ?? 0);
  for (let i = 0; i < installmentCount; i++) {
    const amount = Number(formData.get(`installmentAmount_${i}`) ?? 0);
    const dueDateRaw = String(formData.get(`installmentDueDate_${i}`) ?? "");
    if (amount > 0 && dueDateRaw) {
      await prisma.eventBudgetLinePayment.create({
        data: { budgetLineId: line.id, amount, dueDate: new Date(`${dueDateRaw}T12:00:00`) },
      });
    }
  }

  revalidateEvent(eventId);
  return { success: true };
}

export async function updateBudgetLineAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const lineId = String(formData.get("lineId") ?? "");
  const existing = await prisma.eventBudgetLine.findUnique({ where: { id: lineId } });
  if (!existing) return { error: "Item não encontrado." };

  const category = formData.get("category") as EventBudgetCategory | null;
  const item = String(formData.get("item") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const supplier = String(formData.get("supplier") ?? "").trim() || null;
  const supplierCnpj = String(formData.get("supplierCnpj") ?? "").trim() || null;
  const supplierContact = String(formData.get("supplierContact") ?? "").trim() || null;
  const supplierPhone = String(formData.get("supplierPhone") ?? "").trim() || null;
  const quantityRaw = String(formData.get("quantity") ?? "").replace(",", ".");
  const unitValueRaw = String(formData.get("unitValue") ?? "").replace(",", ".");
  const plannedRaw = String(formData.get("plannedValue") ?? "").replace(",", ".");
  const actualRaw = String(formData.get("actualValue") ?? "").replace(",", ".");
  const paymentMethod = String(formData.get("paymentMethod") ?? "").trim() || null;
  const status = String(formData.get("status") ?? "").trim() || null;

  if (!item || !category) return { error: "Escolha a categoria e descreva a despesa." };

  let nfUrl = existing.nfUrl;
  const nf = formData.get("nf");
  if (nf instanceof File && nf.size > 0) {
    const v = validateUpload(nf, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido para a NF.");
    if (v.error) return { error: v.error };
    nfUrl = await saveUpload(nf, "eventos/nf");
  }

  await prisma.eventBudgetLine.update({
    where: { id: lineId },
    data: {
      category,
      item,
      description,
      supplier,
      supplierCnpj,
      supplierContact,
      supplierPhone,
      quantity: quantityRaw ? Number(quantityRaw) : null,
      unitValue: unitValueRaw ? Number(unitValueRaw) : null,
      nfUrl,
      paymentMethod,
      status,
      plannedValue: plannedRaw ? Number(plannedRaw) : null,
      actualValue: actualRaw ? Number(actualRaw) : null,
    },
  });

  revalidateEvent(existing.eventId);
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

// ---------------------------------------------------------------------------
// Confirmados
// ---------------------------------------------------------------------------

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
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const cpfRg = String(formData.get("cpfRg") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const dynamicChoice = (String(formData.get("dynamicChoice") ?? "") || null) as EventDynamicChoice | null;
  const dynamicOther = String(formData.get("dynamicOther") ?? "").trim() || null;
  const customerId = String(formData.get("customerId") ?? "") || null;

  if (!name || !category) return { error: "Informe nome e categoria." };

  await prisma.eventAttendee.create({
    data: {
      eventId,
      name,
      empresa,
      category,
      ticketType,
      email,
      phone,
      cpfRg,
      instagram,
      dynamicChoice,
      dynamicOther,
      customerId,
    },
  });

  revalidateEvent(eventId);
  if (customerId) revalidatePath(`/cs/mentorados/${customerId}`);
  return { success: true };
}

export async function updateAttendeeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const attendeeId = String(formData.get("attendeeId") ?? "");
  const existing = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!existing) return { error: "Confirmado não encontrado." };

  const name = String(formData.get("name") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim() || null;
  const category = formData.get("category") as AttendeeCategory | null;
  const ticketType = String(formData.get("ticketType") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const cpfRg = String(formData.get("cpfRg") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const dynamicChoice = (String(formData.get("dynamicChoice") ?? "") || null) as EventDynamicChoice | null;
  const dynamicOther = String(formData.get("dynamicOther") ?? "").trim() || null;

  if (!name || !category) return { error: "Informe nome e categoria." };

  await prisma.eventAttendee.update({
    where: { id: attendeeId },
    data: { name, empresa, category, ticketType, email, phone, cpfRg, instagram, dynamicChoice, dynamicOther },
  });

  revalidateEvent(existing.eventId);
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

// ---------------------------------------------------------------------------
// Mural do evento
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Jantar da imersão
// ---------------------------------------------------------------------------

export async function addDinnerGuestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const empresa = String(formData.get("empresa") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;

  if (!name) return { error: "Informe o nome do convidado." };

  await prisma.eventDinnerGuest.create({
    data: { eventId, name, category, empresa, phone, email },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function updateDinnerGuestAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const guestId = String(formData.get("guestId") ?? "");
  const existing = await prisma.eventDinnerGuest.findUnique({ where: { id: guestId } });
  if (!existing) return { error: "Convidado não encontrado." };

  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || null;
  const empresa = String(formData.get("empresa") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  if (!name) return { error: "Informe o nome do convidado." };

  await prisma.eventDinnerGuest.update({
    where: { id: guestId },
    data: { name, category, empresa, phone, email },
  });

  revalidateEvent(existing.eventId);
  return { success: true };
}

export async function deleteDinnerGuestAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const guestId = String(formData.get("guestId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!guestId) return;
  await prisma.eventDinnerGuest.delete({ where: { id: guestId } });
  revalidateEvent(eventId);
}

// ---------------------------------------------------------------------------
// Fluxo de comunicação com o grupo
// ---------------------------------------------------------------------------

export async function addCommsItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "").trim() || null;
  const artLink = String(formData.get("artLink") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();
  const objective = String(formData.get("objective") ?? "").trim() || null;
  const status = (formData.get("status") as CommsStatus | null) || "planejado";

  if (!dateRaw || !message) return { error: "Preencha data e mensagem." };

  let artUrl: string | null = null;
  const art = formData.get("art");
  if (art instanceof File && art.size > 0) {
    const v = validateUpload(art, UPLOAD_TYPES.image, "Envie uma imagem válida para a arte.");
    if (v.error) return { error: v.error };
    artUrl = await saveUpload(art, "eventos/comms");
  }

  await prisma.eventCommsItem.create({
    data: {
      eventId,
      date: new Date(`${dateRaw}T12:00:00`),
      time,
      artUrl,
      artLink,
      message,
      objective,
      status,
    },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function updateCommsItemStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const itemId = String(formData.get("itemId") ?? "");
  const status = formData.get("status") as CommsStatus | null;
  if (!itemId || !status) return;
  const item = await prisma.eventCommsItem.update({ where: { id: itemId }, data: { status } });
  revalidateEvent(item.eventId);
}

export async function deleteCommsItemAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const itemId = String(formData.get("itemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!itemId) return;
  await prisma.eventCommsItem.delete({ where: { id: itemId } });
  revalidateEvent(eventId);
}
