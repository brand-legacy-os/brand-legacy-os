"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canViewArea } from "@/lib/permissions";
import { saveUpload, validateUpload, UPLOAD_TYPES } from "@/lib/upload";
import { FUNNEL_STAGES } from "@/lib/crm";
import type { LeadFunnel, LeadOrigin } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean; leadId?: string };

/** Fase 1 (esqueleto): qualquer membro de Comercial pode criar/mover/
 * comentar leads — restringir por papel (ex.: só líder cria) é ajuste fácil
 * depois, se o usuário pedir, trocando essa checagem. */
async function requireCrmAccess() {
  const user = await requireUser();
  if (!canViewArea(user, "comercial")) throw new Error("Sem permissão");
  return user;
}

function revalidateCrm(leadId?: string) {
  revalidatePath("/comercial/crm");
  if (leadId) revalidatePath(`/comercial/crm/leads/${leadId}`);
}

function readLeadFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const funnel = formData.get("funnel") as LeadFunnel | null;
  const origin = formData.get("origin") as LeadOrigin | null;
  if (!name || !funnel || !origin) return { error: "Preencha nome, funil e origem." };

  const company = String(formData.get("company") ?? "").trim() || null;
  const email = String(formData.get("email") ?? "").trim() || null;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const instagram = String(formData.get("instagram") ?? "").trim() || null;
  const valueRaw = String(formData.get("value") ?? "").replace(",", ".");
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const assignedToId = String(formData.get("assignedToId") ?? "") || null;
  const disqualified = formData.get("disqualified") === "on";
  const stageKeyRaw = String(formData.get("stageKey") ?? "");
  const validStageKeys = FUNNEL_STAGES[funnel].map((s) => s.key);
  const stageKey = validStageKeys.includes(stageKeyRaw) ? stageKeyRaw : validStageKeys[0];

  return {
    data: {
      name,
      funnel,
      origin,
      company,
      email,
      phone,
      instagram,
      value: valueRaw ? Number(valueRaw) : null,
      notes,
      assignedToId,
      disqualified,
      stageKey,
    },
  };
}

export async function createLeadAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireCrmAccess();
  } catch {
    return { error: "Sem permissão." };
  }

  const { error, data } = readLeadFields(formData);
  if (error || !data) return { error: error ?? "Preencha os campos obrigatórios." };

  const lead = await prisma.lead.create({ data });
  revalidateCrm(lead.id);
  return { success: true, leadId: lead.id };
}

export async function updateLeadAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireCrmAccess();
  } catch {
    return { error: "Sem permissão." };
  }

  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return { error: "Lead não encontrado." };

  const { error, data } = readLeadFields(formData);
  if (error || !data) return { error: error ?? "Preencha os campos obrigatórios." };

  await prisma.lead.update({ where: { id: leadId }, data });
  revalidateCrm(leadId);
  return { success: true, leadId };
}

/** Mover de etapa direto do card do board — mesmo padrão do
 * AutoSubmitSelect já usado em updateSocialLeadStatusAction. */
export async function moveLeadStageAction(formData: FormData) {
  try {
    await requireCrmAccess();
  } catch {
    return;
  }
  const leadId = String(formData.get("leadId") ?? "");
  const stageKey = String(formData.get("stageKey") ?? "");
  if (!leadId || !stageKey) return;

  await prisma.lead.update({ where: { id: leadId }, data: { stageKey } });
  revalidateCrm(leadId);
}

export async function deleteLeadAction(formData: FormData) {
  try {
    await requireCrmAccess();
  } catch {
    return;
  }
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return;
  await prisma.lead.delete({ where: { id: leadId } });
  revalidateCrm();
}

// ---------------------------------------------------------------------------
// Histórico de interações
// ---------------------------------------------------------------------------

export async function addLeadInteractionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireCrmAccess();
  } catch {
    return { error: "Sem permissão." };
  }

  const leadId = String(formData.get("leadId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!leadId || !content) return { error: "Escreva a interação." };

  await prisma.leadInteraction.create({
    data: { leadId, authorId: user.id, content },
  });

  revalidateCrm(leadId);
  return { success: true, leadId };
}

// ---------------------------------------------------------------------------
// Anexos (arquivo ou link)
// ---------------------------------------------------------------------------

export async function addLeadAttachmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireCrmAccess();
  } catch {
    return { error: "Sem permissão." };
  }

  const leadId = String(formData.get("leadId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const externalUrl = String(formData.get("url") ?? "").trim();
  const kind = String(formData.get("kind") ?? "referencia") === "entrega" ? "entrega" : "referencia";
  if (!leadId) return { error: "Lead não encontrado." };

  let url = externalUrl;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const v = validateUpload(file, UPLOAD_TYPES.imagePdfOrPresentation, "Envie uma imagem, PDF ou PPT válido.");
    if (v.error) return { error: v.error };
    url = await saveUpload(file, "crm/leads");
  }
  if (!url) return { error: "Anexe um arquivo ou informe um link." };
  if (!label) return { error: "Dê um nome para o anexo." };

  await prisma.leadAttachment.create({ data: { leadId, label, url, kind } });
  revalidateCrm(leadId);
  return { success: true, leadId };
}

export async function deleteLeadAttachmentAction(formData: FormData) {
  try {
    await requireCrmAccess();
  } catch {
    return;
  }
  const attachmentId = String(formData.get("attachmentId") ?? "");
  const leadId = String(formData.get("leadId") ?? "");
  if (!attachmentId) return;
  await prisma.leadAttachment.delete({ where: { id: attachmentId } });
  revalidateCrm(leadId);
}
