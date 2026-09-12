"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import { saveUpload, validateUpload, UPLOAD_TYPES } from "@/lib/upload";
import { parseNpsExcel } from "@/lib/nps-excel";
import { EVENT_BUDGET_CATEGORY_META } from "@/lib/sponsors";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";
import type {
  EventStatus,
  AttendeeCategory,
  EventBudgetCategory,
  EventDynamicChoice,
  CommsStatus,
  CommercialProductPaymentMethod,
} from "@prisma/client";

export type ActionState = { error?: string; success?: boolean; message?: string };

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

export type NpsExcelState = { error?: string; success?: boolean; count?: number; matched?: number };

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

  // Vincula cada linha da planilha a um EventAttendee do mesmo evento por
  // nome ou e-mail (case-insensitive, match exato) — best effort, não
  // bloqueia o upload quando uma linha não bate com ninguém.
  let matched = 0;
  const rowsWithIdentity = parsed.rows.filter((r) => r.name || r.email);
  if (rowsWithIdentity.length > 0) {
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId },
      select: { id: true, name: true, email: true },
    });
    for (const row of rowsWithIdentity) {
      const attendee = attendees.find(
        (a) =>
          (row.email && a.email && a.email.toLowerCase() === row.email.toLowerCase()) ||
          (row.name && a.name.toLowerCase() === row.name.toLowerCase())
      );
      if (attendee) {
        await prisma.eventAttendee.update({ where: { id: attendee.id }, data: { npsScore: row.score } });
        matched++;
      }
    }
  }

  revalidateEvent(eventId);
  return { success: true, count: parsed.scores.length, matched };
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

export async function deleteBudgetLineAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;

  const lineId = String(formData.get("lineId") ?? "");
  const line = await prisma.eventBudgetLine.findUnique({
    where: { id: lineId },
    include: { payments: true },
  });
  if (!line) return;

  // Parcelas pagas geraram uma CashMovement no Caixa — apaga junto pra não
  // deixar lançamento órfão lá quando o item de orçamento some.
  const cashMovementIds = line.payments.map((p) => p.cashMovementId).filter((id): id is string => !!id);
  if (cashMovementIds.length > 0) {
    await prisma.cashMovement.deleteMany({ where: { id: { in: cashMovementIds } } });
  }

  await prisma.eventBudgetLine.delete({ where: { id: lineId } });

  revalidateEvent(line.eventId);
  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro");
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

export async function updateBudgetLinePaymentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await prisma.eventBudgetLinePayment.findUnique({
    where: { id: paymentId },
    include: { budgetLine: { include: { event: true } } },
  });
  if (!payment) return { error: "Parcela não encontrada." };

  const dueRaw = String(formData.get("dueDate") ?? "");
  const amountRaw = String(formData.get("amount") ?? "0").replace(",", ".");
  if (!dueRaw) return { error: "Informe a data da parcela." };

  const dueDate = new Date(`${dueRaw}T12:00:00`);
  const amount = Number(amountRaw) || 0;

  await prisma.eventBudgetLinePayment.update({
    where: { id: paymentId },
    data: { dueDate, amount },
  });

  // Parcela já paga tem uma CashMovement espelhando ela — mantém em sincronia
  // pra não deixar o Caixa mostrando um valor/data antigo depois do ajuste.
  if (payment.cashMovementId) {
    await prisma.cashMovement.update({
      where: { id: payment.cashMovementId },
      data: { date: dueDate, amount: -Math.abs(amount) },
    });
  }

  revalidateEvent(payment.budgetLine.eventId);
  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function deleteBudgetLinePaymentAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;

  const paymentId = String(formData.get("paymentId") ?? "");
  const payment = await prisma.eventBudgetLinePayment.findUnique({
    where: { id: paymentId },
    include: { budgetLine: true },
  });
  if (!payment) return;

  if (payment.cashMovementId) {
    await prisma.cashMovement.delete({ where: { id: payment.cashMovementId } }).catch(() => {});
  }
  await prisma.eventBudgetLinePayment.delete({ where: { id: paymentId } });

  revalidateEvent(payment.budgetLine.eventId);
  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro");
}

// ---------------------------------------------------------------------------
// Confirmados
// ---------------------------------------------------------------------------

/** Quem indicou a marca: ou um confirmado existente (referrerAttendeeId), ou
 * alguém de fora selecionado como "outros" com nome/empresa/whatsapp
 * digitados na hora. Mutuamente exclusivos. */
function readReferrerFields(formData: FormData) {
  const raw = String(formData.get("referrerAttendeeId") ?? "");
  if (raw === "outros") {
    return {
      referrerAttendeeId: null,
      referrerName: String(formData.get("referrerName") ?? "").trim() || null,
      referrerEmpresa: String(formData.get("referrerEmpresa") ?? "").trim() || null,
      referrerWhatsapp: String(formData.get("referrerWhatsapp") ?? "").trim() || null,
    };
  }
  return {
    referrerAttendeeId: raw || null,
    referrerName: null,
    referrerEmpresa: null,
    referrerWhatsapp: null,
  };
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
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const cpfRg = String(formData.get("cpfRg") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const instagramPersonal = String(formData.get("instagramPersonal") ?? "").trim() || null;
  const revenueRange = String(formData.get("revenueRange") ?? "").trim() || null;
  const segmento = String(formData.get("segmento") ?? "").trim() || null;
  const focalPerson = String(formData.get("focalPerson") ?? "").trim() || null;
  const dynamicChoice = (String(formData.get("dynamicChoice") ?? "") || null) as EventDynamicChoice | null;
  const dynamicOther = String(formData.get("dynamicOther") ?? "").trim() || null;
  const customerId = String(formData.get("customerId") ?? "") || null;
  const referrer = readReferrerFields(formData);

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
      instagramPersonal,
      revenueRange,
      segmento,
      focalPerson,
      dynamicChoice,
      dynamicOther,
      customerId,
      ...referrer,
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
  const instagramPersonal = String(formData.get("instagramPersonal") ?? "").trim() || null;
  const revenueRange = String(formData.get("revenueRange") ?? "").trim() || null;
  const segmento = String(formData.get("segmento") ?? "").trim() || null;
  const focalPerson = String(formData.get("focalPerson") ?? "").trim() || null;
  const dynamicChoice = (String(formData.get("dynamicChoice") ?? "") || null) as EventDynamicChoice | null;
  const dynamicOther = String(formData.get("dynamicOther") ?? "").trim() || null;
  const referrer = readReferrerFields(formData);

  if (!name || !category) return { error: "Informe nome e categoria." };

  await prisma.eventAttendee.update({
    where: { id: attendeeId },
    data: {
      name,
      empresa,
      category,
      ticketType,
      email,
      phone,
      cpfRg,
      instagram,
      instagramPersonal,
      revenueRange,
      segmento,
      focalPerson,
      dynamicChoice,
      dynamicOther,
      ...referrer,
    },
  });

  revalidateEvent(existing.eventId);
  return { success: true };
}

export async function deleteAttendeeAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;

  const attendeeId = String(formData.get("attendeeId") ?? "");
  if (!attendeeId) return;
  const existing = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!existing) return;

  await prisma.eventAttendee.delete({ where: { id: attendeeId } });

  revalidateEvent(existing.eventId);
  if (existing.customerId) revalidatePath(`/cs/mentorados/${existing.customerId}`);
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

/** Upsert de presença por dia — checkbox "Dia N" no confirmado. */
export async function toggleAttendeeDayCheckinAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const attendeeId = String(formData.get("attendeeId") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const present = formData.get("present") === "true";
  if (!attendeeId || !dateRaw) return;

  const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return;

  const date = new Date(`${dateRaw}T12:00:00`);
  await prisma.eventAttendeeCheckin.upsert({
    where: { attendeeId_date: { attendeeId, date } },
    update: { present },
    create: { attendeeId, date, present },
  });
  revalidateEvent(attendee.eventId);
}

// ---------------------------------------------------------------------------
// Registro de negociação (por confirmado)
// ---------------------------------------------------------------------------

export async function addAttendeeNegotiationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const attendeeId = String(formData.get("attendeeId") ?? "");
  const negotiationDateRaw = String(formData.get("negotiationDate") ?? "");
  if (!negotiationDateRaw) return { error: "Informe a data da negociação." };

  const sellerId = String(formData.get("sellerId") ?? "") || null;
  const valueRaw = String(formData.get("value") ?? "");
  const paymentConditions = String(formData.get("paymentConditions") ?? "").trim() || null;
  const leadInfo = String(formData.get("leadInfo") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return { error: "Confirmado não encontrado." };

  await prisma.eventAttendeeNegotiation.create({
    data: {
      attendeeId,
      sellerId,
      negotiationDate: new Date(`${negotiationDateRaw}T12:00:00`),
      value: valueRaw ? Number(valueRaw) : null,
      paymentConditions,
      leadInfo,
      notes,
    },
  });

  revalidateEvent(attendee.eventId);
  return { success: true };
}

export async function updateAttendeeNegotiationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const negotiationId = String(formData.get("negotiationId") ?? "");
  const existing = await prisma.eventAttendeeNegotiation.findUnique({
    where: { id: negotiationId },
    include: { attendee: true },
  });
  if (!existing) return { error: "Negociação não encontrada." };

  const negotiationDateRaw = String(formData.get("negotiationDate") ?? "");
  if (!negotiationDateRaw) return { error: "Informe a data da negociação." };

  const sellerId = String(formData.get("sellerId") ?? "") || null;
  const valueRaw = String(formData.get("value") ?? "");
  const paymentConditions = String(formData.get("paymentConditions") ?? "").trim() || null;
  const leadInfo = String(formData.get("leadInfo") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.eventAttendeeNegotiation.update({
    where: { id: negotiationId },
    data: {
      sellerId,
      negotiationDate: new Date(`${negotiationDateRaw}T12:00:00`),
      value: valueRaw ? Number(valueRaw) : null,
      paymentConditions,
      leadInfo,
      notes,
    },
  });

  revalidateEvent(existing.attendee.eventId);
  return { success: true };
}

export async function deleteAttendeeNegotiationAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const negotiationId = String(formData.get("negotiationId") ?? "");
  if (!negotiationId) return;
  const existing = await prisma.eventAttendeeNegotiation.findUnique({
    where: { id: negotiationId },
    include: { attendee: true },
  });
  if (!existing) return;
  await prisma.eventAttendeeNegotiation.delete({ where: { id: negotiationId } });
  revalidateEvent(existing.attendee.eventId);
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

export async function toggleAttendeeWhatsappAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const attendeeId = String(formData.get("attendeeId") ?? "");
  const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return;
  await prisma.eventAttendee.update({
    where: { id: attendeeId },
    data: { inWhatsappGroup: !attendee.inWhatsappGroup },
  });
  revalidateEvent(attendee.eventId);
}

// ---------------------------------------------------------------------------
// Vendas por confirmado
// ---------------------------------------------------------------------------

/** Lê data + valor acordados por parcela — mesmo padrão de parseInstallments
 * em sponsors.ts (installmentDueDate_N/installmentAmount_N por índice). */
function parseSaleInstallmentDates(formData: FormData, count: number) {
  const installments: { number: number; dueDate: Date; amount: number | null }[] = [];
  for (let i = 0; i < count; i++) {
    const raw = String(formData.get(`installmentDueDate_${i}`) ?? "");
    const amountRaw = String(formData.get(`installmentAmount_${i}`) ?? "");
    if (raw) {
      installments.push({
        number: i + 1,
        dueDate: new Date(`${raw}T12:00:00`),
        amount: amountRaw ? Number(amountRaw) : null,
      });
    }
  }
  return installments;
}

function readSaleFields(formData: FormData) {
  const program = String(formData.get("program") ?? "").trim();
  const programOther = program === "Outros" ? String(formData.get("programOther") ?? "").trim() || null : null;
  const value = Number(formData.get("value") ?? 0);
  const paymentPlan = formData.get("paymentPlan") as "avista" | "parcelado" | null;
  const installmentCountRaw = String(formData.get("installmentCount") ?? "");
  const installmentCount =
    paymentPlan === "parcelado" && installmentCountRaw ? Number(installmentCountRaw) : null;
  const paymentMethod = formData.get("paymentMethod") as
    | "pix"
    | "boleto"
    | "cartao"
    | "outro"
    | null;
  const paymentMethodOther =
    paymentMethod === "outro" ? String(formData.get("paymentMethodOther") ?? "").trim() || null : null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const saleDateRaw = String(formData.get("saleDate") ?? "");
  const sellerId = String(formData.get("sellerId") ?? "") || null;

  const errors =
    !program || !value || value <= 0 || !paymentPlan || !paymentMethod || !saleDateRaw
      ? "Preencha programa, valor, forma de pagamento e data da venda."
      : null;

  return {
    error: errors,
    data: {
      program,
      programOther,
      value,
      paymentPlan,
      installmentCount,
      paymentMethod,
      paymentMethodOther,
      notes,
      saleDate: saleDateRaw ? new Date(`${saleDateRaw}T12:00:00`) : null,
      sellerId,
    },
    installments:
      paymentPlan === "parcelado" && installmentCount
        ? parseSaleInstallmentDates(formData, installmentCount)
        : [],
  };
}

export async function addAttendeeSaleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const attendeeId = String(formData.get("attendeeId") ?? "");
  const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return { error: "Confirmado não encontrado." };

  const { error, data, installments } = readSaleFields(formData);
  if (error || !data.paymentPlan || !data.paymentMethod || !data.saleDate) {
    return { error: error ?? "Preencha os campos obrigatórios." };
  }

  await prisma.eventAttendeeSale.create({
    data: {
      attendeeId,
      program: data.program,
      programOther: data.programOther,
      value: data.value,
      paymentPlan: data.paymentPlan,
      installmentCount: data.installmentCount,
      paymentMethod: data.paymentMethod,
      paymentMethodOther: data.paymentMethodOther,
      notes: data.notes,
      saleDate: data.saleDate,
      sellerId: data.sellerId,
      installments: { create: installments },
    },
  });

  revalidateEvent(attendee.eventId);
  return { success: true };
}

export async function updateAttendeeSaleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const saleId = String(formData.get("saleId") ?? "");
  const existing = await prisma.eventAttendeeSale.findUnique({
    where: { id: saleId },
    include: { attendee: true },
  });
  if (!existing) return { error: "Venda não encontrada." };

  const { error, data, installments } = readSaleFields(formData);
  if (error || !data.paymentPlan || !data.paymentMethod || !data.saleDate) {
    return { error: error ?? "Preencha os campos obrigatórios." };
  }

  await prisma.eventAttendeeSaleInstallment.deleteMany({ where: { saleId } });
  await prisma.eventAttendeeSale.update({
    where: { id: saleId },
    data: {
      program: data.program,
      programOther: data.programOther,
      value: data.value,
      paymentPlan: data.paymentPlan,
      installmentCount: data.installmentCount,
      paymentMethod: data.paymentMethod,
      paymentMethodOther: data.paymentMethodOther,
      notes: data.notes,
      saleDate: data.saleDate,
      sellerId: data.sellerId,
      installments: { create: installments },
    },
  });

  revalidateEvent(existing.attendee.eventId);
  return { success: true };
}

export async function deleteAttendeeSaleAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const saleId = String(formData.get("saleId") ?? "");
  const sale = await prisma.eventAttendeeSale.findUnique({
    where: { id: saleId },
    include: { attendee: true },
  });
  if (!sale) return;
  await prisma.eventAttendeeSale.delete({ where: { id: saleId } });
  revalidateEvent(sale.attendee.eventId);
}

export async function toggleAttendeeDinnerAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const attendeeId = String(formData.get("attendeeId") ?? "");
  const attendee = await prisma.eventAttendee.findUnique({ where: { id: attendeeId } });
  if (!attendee) return;

  if (attendee.inDinner) {
    await prisma.eventDinnerGuest.deleteMany({ where: { attendeeId } });
    await prisma.eventAttendee.update({ where: { id: attendeeId }, data: { inDinner: false } });
  } else {
    await prisma.eventDinnerGuest.create({
      data: {
        eventId: attendee.eventId,
        attendeeId,
        name: attendee.name,
        category: ATTENDEE_CATEGORY_META[attendee.category]?.label ?? attendee.category,
        empresa: attendee.empresa,
        phone: attendee.phone,
        email: attendee.email,
      },
    });
    await prisma.eventAttendee.update({ where: { id: attendeeId }, data: { inDinner: true } });
  }

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
// Checklist de foto/vídeo (planejado x realizado)
// ---------------------------------------------------------------------------

/** Lê as datas de realização (pode ser mais de um dia) — mesmo padrão
 * installmentDueDate_N por índice, mas sem parcela associada. */
function parseRealizationDates(formData: FormData) {
  const dates: Date[] = [];
  let i = 0;
  while (formData.has(`realizationDate_${i}`)) {
    const raw = String(formData.get(`realizationDate_${i}`) ?? "");
    if (raw) dates.push(new Date(`${raw}T12:00:00`));
    i++;
  }
  return dates;
}

function readMediaDeliverableFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Descreva o que precisa ser entregue." };

  const objective = String(formData.get("objective") ?? "").trim() || null;
  const trackingOwnerId = String(formData.get("trackingOwnerId") ?? "") || null;
  const executionOwnerRaw = String(formData.get("executionOwnerId") ?? "");
  const executionOwnerId = executionOwnerRaw && executionOwnerRaw !== "outros" ? executionOwnerRaw : null;
  const executionOwnerOther =
    executionOwnerRaw === "outros" ? String(formData.get("executionOwnerOther") ?? "").trim() || null : null;
  const plannedDateRaw = String(formData.get("plannedDate") ?? "");
  const isQuantityDelivery = formData.get("isQuantityDelivery") === "on";
  const plannedQuantityRaw = String(formData.get("plannedQuantity") ?? "");
  const deliveredQuantityRaw = String(formData.get("deliveredQuantity") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  return {
    data: {
      title,
      objective,
      trackingOwnerId,
      executionOwnerId,
      executionOwnerOther,
      plannedDate: plannedDateRaw ? new Date(`${plannedDateRaw}T12:00:00`) : null,
      isQuantityDelivery,
      plannedQuantity: isQuantityDelivery && plannedQuantityRaw ? Number(plannedQuantityRaw) : null,
      deliveredQuantity: isQuantityDelivery && deliveredQuantityRaw ? Number(deliveredQuantityRaw) : null,
      notes,
    },
    realizationDates: parseRealizationDates(formData),
  };
}

export async function addMediaDeliverableAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const { error, data, realizationDates } = readMediaDeliverableFields(formData);
  if (error || !data) return { error };

  let fileLabel: string | null = null;
  let fileUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const v = validateUpload(file, UPLOAD_TYPES.imagePdfOrPresentation, "Envie uma imagem, PDF ou PPT válido.");
    if (v.error) return { error: v.error };
    fileUrl = await saveUpload(file, "eventos/midia");
    fileLabel = String(formData.get("fileLabel") ?? "").trim() || file.name;
  }

  await prisma.eventMediaDeliverable.create({
    data: {
      eventId,
      ...data,
      fileLabel,
      fileUrl,
      realizations: { create: realizationDates.map((date) => ({ date })) },
    },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function updateMediaDeliverableAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const deliverableId = String(formData.get("deliverableId") ?? "");
  const existing = await prisma.eventMediaDeliverable.findUnique({ where: { id: deliverableId } });
  if (!existing) return { error: "Item não encontrado." };

  const { error, data, realizationDates } = readMediaDeliverableFields(formData);
  if (error || !data) return { error };

  let fileLabel = existing.fileLabel;
  let fileUrl = existing.fileUrl;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const v = validateUpload(file, UPLOAD_TYPES.imagePdfOrPresentation, "Envie uma imagem, PDF ou PPT válido.");
    if (v.error) return { error: v.error };
    fileUrl = await saveUpload(file, "eventos/midia");
    fileLabel = String(formData.get("fileLabel") ?? "").trim() || file.name;
  }

  await prisma.eventMediaDeliverableRealization.deleteMany({ where: { deliverableId } });
  await prisma.eventMediaDeliverable.update({
    where: { id: deliverableId },
    data: {
      ...data,
      fileLabel,
      fileUrl,
      realizations: { create: realizationDates.map((date) => ({ date })) },
    },
  });

  revalidateEvent(existing.eventId);
  return { success: true };
}

export async function deleteMediaDeliverableAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const deliverableId = String(formData.get("deliverableId") ?? "");
  if (!deliverableId) return;
  const deliverable = await prisma.eventMediaDeliverable.findUnique({ where: { id: deliverableId } });
  if (!deliverable) return;
  await prisma.eventMediaDeliverable.delete({ where: { id: deliverableId } });
  revalidateEvent(deliverable.eventId);
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

export async function updateCommsItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const itemId = String(formData.get("itemId") ?? "");
  const existing = await prisma.eventCommsItem.findUnique({ where: { id: itemId } });
  if (!existing) return { error: "Comunicação não encontrada." };

  const dateRaw = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "").trim() || null;
  const artLink = String(formData.get("artLink") ?? "").trim() || null;
  const message = String(formData.get("message") ?? "").trim();
  const objective = String(formData.get("objective") ?? "").trim() || null;

  if (!dateRaw || !message) return { error: "Preencha data e mensagem." };

  let artUrl = existing.artUrl;
  const art = formData.get("art");
  if (art instanceof File && art.size > 0) {
    const v = validateUpload(art, UPLOAD_TYPES.image, "Envie uma imagem válida para a arte.");
    if (v.error) return { error: v.error };
    artUrl = await saveUpload(art, "eventos/comms");
  }

  await prisma.eventCommsItem.update({
    where: { id: itemId },
    data: {
      date: new Date(`${dateRaw}T12:00:00`),
      time,
      artUrl,
      artLink,
      message,
      objective,
    },
  });

  revalidateEvent(existing.eventId);
  return { success: true };
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

// ---------------------------------------------------------------------------
// Ordem do dia
// ---------------------------------------------------------------------------

export async function addAgendaItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventDayId = String(formData.get("eventDayId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Descreva o que vai acontecer." };

  const who = String(formData.get("who") ?? "").trim() || null;
  const startTime = String(formData.get("startTime") ?? "").trim() || null;
  const endTime = String(formData.get("endTime") ?? "").trim() || null;
  const objective = String(formData.get("objective") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.eventAgendaItem.create({
    data: { eventDayId, title, who, startTime, endTime, objective, notes },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function updateAgendaItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const itemId = String(formData.get("itemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Descreva o que vai acontecer." };

  const who = String(formData.get("who") ?? "").trim() || null;
  const startTime = String(formData.get("startTime") ?? "").trim() || null;
  const endTime = String(formData.get("endTime") ?? "").trim() || null;
  const objective = String(formData.get("objective") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await prisma.eventAgendaItem.update({
    where: { id: itemId },
    data: { title, who, startTime, endTime, objective, notes },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function deleteAgendaItemAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const itemId = String(formData.get("itemId") ?? "");
  const eventId = String(formData.get("eventId") ?? "");
  if (!itemId) return;
  await prisma.eventAgendaItem.delete({ where: { id: itemId } });
  revalidateEvent(eventId);
}

// ---------------------------------------------------------------------------
// Produtos Comercializados
// ---------------------------------------------------------------------------

function readCommercialProductFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Informe o nome do produto." };
  const valueRaw = String(formData.get("value") ?? "");
  if (!valueRaw) return { error: "Informe o valor do produto." };

  const paymentMethod = String(formData.get("paymentMethod") ?? "") as CommercialProductPaymentMethod;
  const paymentMethodOther =
    paymentMethod === "outro" ? String(formData.get("paymentMethodOther") ?? "").trim() || null : null;

  return {
    data: {
      name,
      value: Number(valueRaw),
      minPaymentCondition: String(formData.get("minPaymentCondition") ?? "").trim() || null,
      maxPaymentCondition: String(formData.get("maxPaymentCondition") ?? "").trim() || null,
      paymentMethod,
      paymentMethodOther,
      scope: String(formData.get("scope") ?? "").trim() || null,
    },
  };
}

export async function addCommercialProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const { error, data } = readCommercialProductFields(formData);
  if (error || !data) return { error };

  let deckUrl: string | null = null;
  const deck = formData.get("deck");
  if (deck instanceof File && deck.size > 0) {
    const v = validateUpload(deck, UPLOAD_TYPES.presentation, "Envie um PDF ou PPT válido para o deck.");
    if (v.error) return { error: v.error };
    deckUrl = await saveUpload(deck, "eventos/produtos");
  }

  await prisma.eventCommercialProduct.create({ data: { eventId, ...data, deckUrl } });

  revalidateEvent(eventId);
  return { success: true };
}

export async function updateCommercialProductAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const productId = String(formData.get("productId") ?? "");
  const existing = await prisma.eventCommercialProduct.findUnique({ where: { id: productId } });
  if (!existing) return { error: "Produto não encontrado." };

  const { error, data } = readCommercialProductFields(formData);
  if (error || !data) return { error };

  let deckUrl = existing.deckUrl;
  const deck = formData.get("deck");
  if (deck instanceof File && deck.size > 0) {
    const v = validateUpload(deck, UPLOAD_TYPES.presentation, "Envie um PDF ou PPT válido para o deck.");
    if (v.error) return { error: v.error };
    deckUrl = await saveUpload(deck, "eventos/produtos");
  }

  await prisma.eventCommercialProduct.update({ where: { id: productId }, data: { ...data, deckUrl } });

  revalidateEvent(existing.eventId);
  return { success: true };
}

export async function deleteCommercialProductAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const productId = String(formData.get("productId") ?? "");
  if (!productId) return;
  const existing = await prisma.eventCommercialProduct.findUnique({ where: { id: productId } });
  if (!existing) return;
  await prisma.eventCommercialProduct.delete({ where: { id: productId } });
  revalidateEvent(existing.eventId);
}

// ---------------------------------------------------------------------------
// Relatório para debriefing
// ---------------------------------------------------------------------------

export async function addDebriefReportAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageEvents(user)) return { error: "Sem permissão." };

  const eventId = String(formData.get("eventId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Informe o nome do relatório." };

  const deliveryDateRaw = String(formData.get("deliveryDate") ?? "");
  const summary = String(formData.get("summary") ?? "").trim() || null;

  let fileUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const v = validateUpload(file, UPLOAD_TYPES.imagePdfOrPresentation, "Envie um arquivo válido (imagem, PDF ou PPT).");
    if (v.error) return { error: v.error };
    fileUrl = await saveUpload(file, "eventos/debriefing");
  }

  await prisma.eventDebriefReport.create({
    data: {
      eventId,
      name,
      deliveryDate: deliveryDateRaw ? new Date(`${deliveryDateRaw}T12:00:00`) : null,
      summary,
      fileUrl,
    },
  });

  revalidateEvent(eventId);
  return { success: true };
}

export async function deleteDebriefReportAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageEvents(user)) return;
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return;
  const existing = await prisma.eventDebriefReport.findUnique({ where: { id: reportId } });
  if (!existing) return;
  await prisma.eventDebriefReport.delete({ where: { id: reportId } });
  revalidateEvent(existing.eventId);
}
