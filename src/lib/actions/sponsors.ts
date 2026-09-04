"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageSponsors } from "@/lib/permissions";
import { saveUpload, validateUpload, UPLOAD_TYPES } from "@/lib/upload";
import type {
  SponsorPaymentPlan,
  SponsorPaymentMethod,
  SponsorTier,
  SponsorDealStatus,
} from "@prisma/client";

export type ActionState = { error?: string; success?: boolean; sponsorId?: string };

async function requireSponsorManager() {
  const user = await requireUser();
  if (!canManageSponsors(user)) throw new Error("Sem permissão");
  return user;
}

function revalidateSponsors(sponsorId?: string) {
  revalidatePath("/patrocinios");
  revalidatePath("/patrocinios/base");
  if (sponsorId) revalidatePath(`/patrocinios/${sponsorId}`);
}

/** Lê os pares parcela N (valor + vencimento) enviados pelo formulário —
 * ver create-sponsor-form.tsx, que renderiza installmentAmount_N/
 * installmentDueDate_N dinamicamente conforme o número de parcelas. */
function parseInstallments(formData: FormData) {
  const count = Number(formData.get("installmentCount") ?? 0);
  const installments: { number: number; amount: number; dueDate: Date }[] = [];
  for (let i = 0; i < count; i++) {
    const amount = Number(formData.get(`installmentAmount_${i}`) ?? 0);
    const dueDateRaw = String(formData.get(`installmentDueDate_${i}`) ?? "");
    if (amount > 0 && dueDateRaw) {
      installments.push({
        number: i + 1,
        amount,
        dueDate: new Date(`${dueDateRaw}T12:00:00`),
      });
    }
  }
  return installments;
}

function readSponsorFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const cnpj = String(formData.get("cnpj") ?? "").trim();
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const totalValue = Number(formData.get("totalValue") ?? 0);
  const paymentPlan = formData.get("paymentPlan") as SponsorPaymentPlan | null;
  const paymentMethod = formData.get("paymentMethod") as SponsorPaymentMethod | null;
  const paymentLink = String(formData.get("paymentLink") ?? "").trim() || null;
  const hasStageTime = formData.get("hasStageTime") === "on";
  const stageTimeMinutesRaw = String(formData.get("stageTimeMinutes") ?? "");
  const stageTimeMinutes = hasStageTime && stageTimeMinutesRaw ? Number(stageTimeMinutesRaw) : null;
  const eventId = String(formData.get("eventId") ?? "") || null;
  const isAnnual = formData.get("isAnnual") === "on";
  const tier = formData.get("tier") as SponsorTier | null;
  const status = formData.get("status") as SponsorDealStatus | null;
  const statusOther = String(formData.get("statusOther") ?? "").trim() || null;
  const presentationUrl = String(formData.get("presentationUrl") ?? "").trim() || null;
  const videoUrl = String(formData.get("videoUrl") ?? "").trim() || null;
  const activation = String(formData.get("activation") ?? "").trim() || null;

  const errors: string[] = [];
  if (!name) errors.push("nome do patrocinador");
  if (!cnpj) errors.push("CNPJ");
  if (!contactName) errors.push("pessoa de contato");
  if (!contactPhone) errors.push("número de contato");
  if (!totalValue || totalValue <= 0) errors.push("valor total do contrato");
  if (!paymentPlan) errors.push("à vista ou parcelado");
  if (!paymentMethod) errors.push("meio de pagamento");
  if (!tier) errors.push("cota");
  if (!status) errors.push("status");

  return {
    errors,
    data: {
      name,
      cnpj,
      contactName,
      contactPhone,
      totalValue,
      paymentPlan,
      paymentMethod,
      paymentLink,
      hasStageTime,
      stageTimeMinutes,
      eventId,
      isAnnual,
      tier,
      status,
      statusOther,
      presentationUrl,
      videoUrl,
      activation,
    },
  };
}

export async function createSponsorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireSponsorManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const { errors, data } = readSponsorFields(formData);
  if (errors.length > 0) {
    return { error: `Preencha: ${errors.join(", ")}.` };
  }

  const installments = data.paymentPlan === "parcelado" ? parseInstallments(formData) : [];
  if (data.paymentPlan === "parcelado" && installments.length === 0) {
    return { error: "Adicione ao menos uma parcela com valor e vencimento." };
  }

  let paymentProofUrl: string | null = null;
  const proof = formData.get("paymentProof");
  if (proof instanceof File && proof.size > 0) {
    const v = validateUpload(proof, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido para o comprovante.");
    if (v.error) return { error: v.error };
    paymentProofUrl = await saveUpload(proof, "patrocinios");
  }

  let logoUrl: string | null = null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const v = validateUpload(logo, UPLOAD_TYPES.image, "Envie uma imagem válida para o logo.");
    if (v.error) return { error: v.error };
    logoUrl = await saveUpload(logo, "patrocinios");
  }

  let nfUrl: string | null = null;
  const nf = formData.get("nf");
  if (nf instanceof File && nf.size > 0) {
    const v = validateUpload(nf, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido para a NF.");
    if (v.error) return { error: v.error };
    nfUrl = await saveUpload(nf, "patrocinios");
  }

  const sponsor = await prisma.sponsor.create({
    data: {
      ...data,
      paymentPlan: data.paymentPlan!,
      paymentMethod: data.paymentMethod!,
      tier: data.tier!,
      status: data.status!,
      paymentProofUrl,
      logoUrl,
      nfUrl,
      createdById: user.id,
      installments: { create: installments },
    },
  });

  revalidateSponsors(sponsor.id);
  if (data.eventId) revalidatePath(`/eventos/${data.eventId}`);
  return { success: true, sponsorId: sponsor.id };
}

export async function updateSponsorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSponsorManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const sponsorId = String(formData.get("sponsorId") ?? "");
  if (!sponsorId) return { error: "Patrocinador não encontrado." };

  const { errors, data } = readSponsorFields(formData);
  if (errors.length > 0) {
    return { error: `Preencha: ${errors.join(", ")}.` };
  }

  const existing = await prisma.sponsor.findUnique({ where: { id: sponsorId } });
  if (!existing) return { error: "Patrocinador não encontrado." };

  let paymentProofUrl = existing.paymentProofUrl;
  const proof = formData.get("paymentProof");
  if (proof instanceof File && proof.size > 0) {
    const v = validateUpload(proof, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido para o comprovante.");
    if (v.error) return { error: v.error };
    paymentProofUrl = await saveUpload(proof, "patrocinios");
  }

  let logoUrl = existing.logoUrl;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    const v = validateUpload(logo, UPLOAD_TYPES.image, "Envie uma imagem válida para o logo.");
    if (v.error) return { error: v.error };
    logoUrl = await saveUpload(logo, "patrocinios");
  }

  let nfUrl = existing.nfUrl;
  const nf = formData.get("nf");
  if (nf instanceof File && nf.size > 0) {
    const v = validateUpload(nf, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido para a NF.");
    if (v.error) return { error: v.error };
    nfUrl = await saveUpload(nf, "patrocinios");
  }

  await prisma.sponsor.update({
    where: { id: sponsorId },
    data: {
      ...data,
      paymentPlan: data.paymentPlan!,
      paymentMethod: data.paymentMethod!,
      tier: data.tier!,
      status: data.status!,
      paymentProofUrl,
      logoUrl,
      nfUrl,
    },
  });

  revalidateSponsors(sponsorId);
  if (existing.eventId) revalidatePath(`/eventos/${existing.eventId}`);
  if (data.eventId && data.eventId !== existing.eventId) revalidatePath(`/eventos/${data.eventId}`);
  return { success: true, sponsorId };
}

// ---------------------------------------------------------------------------
// Parcelas
// ---------------------------------------------------------------------------

export async function toggleSponsorInstallmentPaidAction(formData: FormData) {
  try {
    await requireSponsorManager();
  } catch {
    return;
  }
  const installmentId = String(formData.get("installmentId") ?? "");
  const sponsorId = String(formData.get("sponsorId") ?? "");
  if (!installmentId) return;

  const installment = await prisma.sponsorInstallment.findUnique({ where: { id: installmentId } });
  if (!installment) return;

  await prisma.sponsorInstallment.update({
    where: { id: installmentId },
    data: { paid: !installment.paid, paidDate: !installment.paid ? new Date() : null },
  });

  revalidateSponsors(sponsorId);
}

// ---------------------------------------------------------------------------
// Histórico de interações
// ---------------------------------------------------------------------------

export async function addSponsorInteractionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireSponsorManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const sponsorId = String(formData.get("sponsorId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!sponsorId || !content) return { error: "Escreva a interação." };

  await prisma.sponsorInteraction.create({
    data: { sponsorId, authorId: user.id, content },
  });

  revalidateSponsors(sponsorId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Vendas de leads (ROI)
// ---------------------------------------------------------------------------

export async function addSponsorLeadSaleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSponsorManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const sponsorId = String(formData.get("sponsorId") ?? "");
  const description = String(formData.get("description") ?? "").trim() || null;
  const value = Number(formData.get("value") ?? 0);
  const saleDateRaw = String(formData.get("saleDate") ?? "");
  if (!sponsorId || !value || value <= 0) return { error: "Informe o valor da venda." };

  await prisma.sponsorLeadSale.create({
    data: {
      sponsorId,
      description,
      value,
      saleDate: saleDateRaw ? new Date(`${saleDateRaw}T12:00:00`) : null,
    },
  });

  revalidateSponsors(sponsorId);
  return { success: true };
}

export async function deleteSponsorLeadSaleAction(formData: FormData) {
  try {
    await requireSponsorManager();
  } catch {
    return;
  }
  const id = String(formData.get("id") ?? "");
  const sponsorId = String(formData.get("sponsorId") ?? "");
  if (!id) return;
  await prisma.sponsorLeadSale.delete({ where: { id } });
  revalidateSponsors(sponsorId);
}
