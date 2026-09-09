"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis } from "@/lib/permissions";
import { refreshProfileReportei } from "@/lib/reportei-refresh";
import { saveUpload, validateUpload, UPLOAD_TYPES } from "@/lib/upload";
import type {
  PodcastStatus,
  PodcastSource,
  SocialLeadStatus,
  ContentFormat,
  ContentPostStatus,
} from "@prisma/client";

export type ActionState = { error?: string; success?: boolean; postId?: string };

async function requireSocialManager() {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) {
    throw new Error("Sem permissão");
  }
  return user;
}

function revalidateSocial() {
  revalidatePath("/social");
  revalidatePath("/social/introducao");
  revalidatePath("/social/conteudo");
  revalidatePath("/social/calendario");
  revalidatePath("/social/tarefas");
  revalidatePath("/social/crm");
  revalidatePath("/social/podcast");
  revalidatePath("/social/dashboard");
  revalidatePath("/social/relatorio");
}

// ---------------------------------------------------------------------------
// Perfis
// ---------------------------------------------------------------------------

export async function updateSocialProfileAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const profileId = String(formData.get("profileId") ?? "");
  const contentScope = String(formData.get("contentScope") ?? "").trim() || null;
  const reporteiUrl = String(formData.get("reporteiUrl") ?? "").trim() || null;

  if (!profileId) return { error: "Perfil não encontrado." };
  if (reporteiUrl && !/^https:\/\//i.test(reporteiUrl)) {
    return { error: "O link do Reportei precisa começar com https://" };
  }

  await prisma.socialProfile.update({
    where: { id: profileId },
    data: { contentScope, reporteiUrl },
  });

  revalidateSocial();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Dashboard Reportei
// ---------------------------------------------------------------------------

export type ReporteiRefreshState = { error?: string; success?: boolean; count?: number };

export async function refreshSocialReporteiAction(
  _prev: ReporteiRefreshState,
  formData: FormData
): Promise<ReporteiRefreshState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const profileId = String(formData.get("profileId") ?? "");
  if (!profileId) return { error: "Perfil não encontrado." };

  const result = await refreshProfileReportei(profileId);
  if (result.error) return { error: result.error };

  revalidateSocial();
  return { success: true, count: result.count };
}

export async function upsertFollowerSnapshotAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const profileId = String(formData.get("profileId") ?? "");
  const monthKey = String(formData.get("monthKey") ?? "");
  const countRaw = String(formData.get("count") ?? "");
  const count = Number(countRaw);

  if (!profileId || !monthKey || !countRaw || Number.isNaN(count) || count < 0) {
    return { error: "Informe um número de seguidores válido." };
  }

  await prisma.socialFollowerSnapshot.upsert({
    where: { profileId_monthKey: { profileId, monthKey } },
    create: { profileId, monthKey, count },
    update: { count },
  });

  revalidateSocial();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Conteúdo — tabela de referência semanal (perfil x dia)
// ---------------------------------------------------------------------------

export async function updateContentWeekPlanCellAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const profileId = String(formData.get("profileId") ?? "");
  const weekday = Number(formData.get("weekday") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!profileId || !weekday || weekday < 1 || weekday > 7) {
    return { error: "Perfil ou dia da semana inválido." };
  }

  await prisma.contentWeekPlanCell.upsert({
    where: { profileId_weekday: { profileId, weekday } },
    create: { profileId, weekday, content },
    update: { content },
  });

  revalidateSocial();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Podcast
// ---------------------------------------------------------------------------

/** Lê um select de responsável que pode ter "outro" selecionado, caso em
 * que o id vai null e o texto livre (nome de `${name}Other`) é usado. */
function readResponsibleField(formData: FormData, name: string) {
  const raw = String(formData.get(name) ?? "");
  if (raw === "outro") {
    return { id: null, other: String(formData.get(`${name}Other`) ?? "").trim() || null };
  }
  return { id: raw || null, other: null };
}

function readPodcastFields(formData: FormData) {
  const episodeNumberRaw = String(formData.get("episodeNumber") ?? "");
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestBrand = String(formData.get("guestBrand") ?? "").trim() || null;
  const recordingDateRaw = String(formData.get("recordingDate") ?? "");
  const guestBrandInstagram = String(formData.get("guestBrandInstagram") ?? "").trim() || null;
  const guestPersonalInstagram = String(formData.get("guestPersonalInstagram") ?? "").trim() || null;
  const materialDeadlineRaw = String(formData.get("materialDeadline") ?? "");
  const postDateRaw = String(formData.get("postDate") ?? "");
  const rawMaterialUrl = String(formData.get("rawMaterialUrl") ?? "").trim() || null;
  const editedMaterialUrl = String(formData.get("editedMaterialUrl") ?? "").trim() || null;
  const status = (formData.get("status") as PodcastStatus | null) || "entrevista_marcada";
  const source = formData.get("source") as PodcastSource | null;
  const sourceOther = source === "outro" ? String(formData.get("sourceOther") ?? "").trim() || null : null;
  const recording = readResponsibleField(formData, "recordingResponsibleId");
  const material = readResponsibleField(formData, "materialResponsibleId");
  const post = readResponsibleField(formData, "postResponsibleId");
  const transcript = String(formData.get("transcript") ?? "").trim() || null;
  const dispatchCopy = String(formData.get("dispatchCopy") ?? "").trim() || null;
  const dispatchDateRaw = String(formData.get("dispatchDate") ?? "");
  const dispatch = readResponsibleField(formData, "dispatchResponsibleId");
  const dispatchStatus = (formData.get("dispatchStatus") as "planejado" | "enviado" | null) || null;

  const episodeNumber = episodeNumberRaw ? Number(episodeNumberRaw) : null;
  const error =
    !guestName || (episodeNumberRaw && Number.isNaN(episodeNumber)) || !source
      ? "Preencha convidado e fonte (número do episódio é opcional pra leads ainda no funil)."
      : null;

  return {
    error,
    data: {
      episodeNumber,
      guestName,
      guestBrand,
      recordingDate: recordingDateRaw ? new Date(`${recordingDateRaw}T12:00:00`) : null,
      guestBrandInstagram,
      guestPersonalInstagram,
      materialDeadline: materialDeadlineRaw ? new Date(`${materialDeadlineRaw}T12:00:00`) : null,
      postDate: postDateRaw ? new Date(`${postDateRaw}T12:00:00`) : null,
      rawMaterialUrl,
      editedMaterialUrl,
      status,
      source,
      sourceOther,
      recordingResponsibleId: recording.id,
      recordingResponsibleOther: recording.other,
      materialResponsibleId: material.id,
      materialResponsibleOther: material.other,
      postResponsibleId: post.id,
      postResponsibleOther: post.other,
      transcript,
      dispatchCopy,
      dispatchDate: dispatchDateRaw ? new Date(`${dispatchDateRaw}T12:00:00`) : null,
      dispatchResponsibleId: dispatch.id,
      dispatchResponsibleOther: dispatch.other,
      dispatchStatus,
    },
  };
}

export async function createPodcastEpisodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const { error, data } = readPodcastFields(formData);
  if (error || !data.source) return { error: error ?? "Preencha os campos obrigatórios." };

  await prisma.podcastEpisode.create({ data: { ...data, source: data.source } });

  revalidateSocial();
  return { success: true };
}

export async function updatePodcastEpisodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const episodeId = String(formData.get("episodeId") ?? "");
  if (!episodeId) return { error: "Episódio não encontrado." };

  const { error, data } = readPodcastFields(formData);
  if (error || !data.source) return { error: error ?? "Preencha os campos obrigatórios." };

  await prisma.podcastEpisode.update({
    where: { id: episodeId },
    data: { ...data, source: data.source },
  });

  revalidateSocial();
  return { success: true };
}

export async function updatePodcastStatusAction(formData: FormData) {
  try {
    await requireSocialManager();
  } catch {
    return;
  }
  const episodeId = String(formData.get("episodeId") ?? "");
  const status = formData.get("status") as PodcastStatus | null;
  if (!episodeId || !status) return;

  await prisma.podcastEpisode.update({ where: { id: episodeId }, data: { status } });
  revalidateSocial();
}

export async function deletePodcastEpisodeAction(formData: FormData) {
  try {
    await requireSocialManager();
  } catch {
    return;
  }
  const episodeId = String(formData.get("episodeId") ?? "");
  if (!episodeId) return;
  await prisma.podcastEpisode.delete({ where: { id: episodeId } });
  revalidateSocial();
}

// ---------------------------------------------------------------------------
// CRM de Social Selling
// ---------------------------------------------------------------------------

export async function createSocialLeadAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const leadName = String(formData.get("leadName") ?? "").trim();
  const companyName = String(formData.get("companyName") ?? "").trim() || null;
  const contactPerson = String(formData.get("contactPerson") ?? "").trim() || null;
  const salespersonId = String(formData.get("salespersonId") ?? "") || null;
  const meetingDateRaw = String(formData.get("meetingDate") ?? "");
  const status = (formData.get("status") as SocialLeadStatus | null) || "sem_resposta";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!leadName) return { error: "Informe o nome do lead." };

  await prisma.socialSellingLead.create({
    data: {
      leadName,
      companyName,
      contactPerson,
      salespersonId,
      meetingDate: meetingDateRaw ? new Date(`${meetingDateRaw}T12:00:00`) : null,
      status,
      notes,
    },
  });

  revalidateSocial();
  return { success: true };
}

export async function updateSocialLeadStatusAction(formData: FormData) {
  try {
    await requireSocialManager();
  } catch {
    return;
  }
  const leadId = String(formData.get("leadId") ?? "");
  const status = formData.get("status") as SocialLeadStatus | null;
  if (!leadId || !status) return;

  await prisma.socialSellingLead.update({ where: { id: leadId }, data: { status } });
  revalidateSocial();
}

export async function updateSocialLeadSaleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const leadId = String(formData.get("leadId") ?? "");
  const saleProduct = String(formData.get("saleProduct") ?? "").trim() || null;
  const saleValueRaw = String(formData.get("saleValue") ?? "");
  const saleDateRaw = String(formData.get("saleDate") ?? "");

  if (!leadId) return { error: "Lead não encontrado." };

  const saleValue = saleValueRaw ? Number(saleValueRaw) : null;
  if (saleValueRaw && (saleValue === null || Number.isNaN(saleValue))) {
    return { error: "Valor de venda inválido." };
  }

  await prisma.socialSellingLead.update({
    where: { id: leadId },
    data: {
      saleProduct,
      saleValue,
      saleDate: saleDateRaw ? new Date(`${saleDateRaw}T12:00:00`) : null,
    },
  });

  revalidateSocial();
  return { success: true };
}

export async function deleteSocialLeadAction(formData: FormData) {
  try {
    await requireSocialManager();
  } catch {
    return;
  }
  const leadId = String(formData.get("leadId") ?? "");
  if (!leadId) return;
  await prisma.socialSellingLead.delete({ where: { id: leadId } });
  revalidateSocial();
}

// ---------------------------------------------------------------------------
// Calendário de conteúdo
// ---------------------------------------------------------------------------

export async function createContentPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) return { error: "Sem permissão." };

  const dateRaw = String(formData.get("date") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const format = formData.get("format") as ContentFormat | null;
  const theme = String(formData.get("theme") ?? "").trim();
  const status = (formData.get("status") as ContentPostStatus | null) || "planejado";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!dateRaw || !profileId || !format || !theme) {
    return { error: "Preencha data, perfil, formato e tema." };
  }

  const post = await prisma.contentCalendarPost.create({
    data: {
      date: new Date(`${dateRaw}T12:00:00`),
      profileId,
      format,
      theme,
      status,
      notes,
      createdById: user.id,
    },
  });

  revalidateSocial();
  return { success: true, postId: post.id };
}

// ---------------------------------------------------------------------------
// Card do post (estilo Asana) — links de apoio
// ---------------------------------------------------------------------------

export async function createContentPostLinkAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const postId = String(formData.get("postId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  let url = String(formData.get("url") ?? "").trim();

  if (!postId) return { error: "Post não encontrado." };
  if (!label) return { error: "Dê um nome para o link/arquivo." };

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const v = validateUpload(file, UPLOAD_TYPES.imagePdfOrPresentation, "Envie uma imagem, PDF ou PPT válido.");
    if (v.error) return { error: v.error };
    url = await saveUpload(file, "social/calendario-links");
  } else if (!url) {
    return { error: "Anexe um arquivo ou informe um link." };
  } else if (!/^https:\/\//i.test(url)) {
    return { error: "O link precisa começar com https://" };
  }

  await prisma.contentCalendarPostLink.create({ data: { postId, label, url } });

  revalidateSocial();
  return { success: true, postId };
}

export async function deleteContentPostLinkAction(formData: FormData) {
  try {
    await requireSocialManager();
  } catch {
    return;
  }
  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) return;
  await prisma.contentCalendarPostLink.delete({ where: { id: linkId } });
  revalidateSocial();
}

export async function updateContentPostStatusAction(formData: FormData) {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) return;

  const postId = String(formData.get("postId") ?? "");
  const status = formData.get("status") as ContentPostStatus | null;
  if (!postId || !status) return;

  await prisma.contentCalendarPost.update({ where: { id: postId }, data: { status } });
  revalidateSocial();
}

export async function updateContentPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) return { error: "Sem permissão." };

  const postId = String(formData.get("postId") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const format = formData.get("format") as ContentFormat | null;
  const theme = String(formData.get("theme") ?? "").trim();
  const status = (formData.get("status") as ContentPostStatus | null) || "planejado";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!postId) return { error: "Post não encontrado." };
  if (!dateRaw || !profileId || !format || !theme) {
    return { error: "Preencha data, perfil, formato e tema." };
  }

  await prisma.contentCalendarPost.update({
    where: { id: postId },
    data: { date: new Date(`${dateRaw}T12:00:00`), profileId, format, theme, status, notes },
  });

  revalidateSocial();
  return { success: true, postId };
}

export async function deleteContentPostAction(formData: FormData) {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) return;

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;
  await prisma.contentCalendarPost.delete({ where: { id: postId } });
  revalidateSocial();
}

export async function deleteContentPostByIdAction(postId: string): Promise<ActionState> {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) return { error: "Sem permissão." };
  if (!postId) return { error: "Post não encontrado." };
  await prisma.contentCalendarPost.delete({ where: { id: postId } });
  revalidateSocial();
  return { success: true };
}

// ---------------------------------------------------------------------------
// Relatórios por perfil
// ---------------------------------------------------------------------------

function readProfileReportFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const reportMonth = String(formData.get("reportMonth") ?? "").trim();
  const dueDateRaw = String(formData.get("dueDate") ?? "");
  const periodAnalyzed = String(formData.get("periodAnalyzed") ?? "").trim() || null;
  const summary = String(formData.get("summary") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!title || !reportMonth) return { error: "Preencha título e mês do relatório." as string | null, data: null };

  return {
    error: null as string | null,
    data: {
      title,
      reportMonth,
      dueDate: dueDateRaw ? new Date(`${dueDateRaw}T12:00:00`) : null,
      periodAnalyzed,
      summary,
      notes,
    },
  };
}

export async function addProfileReportAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  let user;
  try {
    user = await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const profileId = String(formData.get("profileId") ?? "");
  if (!profileId) return { error: "Selecione o perfil." };

  const { error, data } = readProfileReportFields(formData);
  if (error || !data) return { error: error ?? "Preencha os campos obrigatórios." };

  // Anexo é opcional na criação — quem já tem o arquivo em mãos não precisa
  // criar o relatório e depois abrir de novo só pra anexar.
  const file = formData.get("file");
  let attachmentUrl: string | null = null;
  if (file instanceof File && file.size > 0) {
    const v = validateUpload(file, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido.");
    if (v.error) return { error: v.error };
    attachmentUrl = await saveUpload(file, "social/relatorios");
  }
  const attachmentLabel =
    String(formData.get("attachmentLabel") ?? "").trim() || (file instanceof File ? file.name : "");

  const report = await prisma.socialProfileReport.create({
    data: { profileId, ...data, createdById: user.id },
  });

  if (attachmentUrl) {
    await prisma.socialProfileReportAttachment.create({
      data: { reportId: report.id, label: attachmentLabel || "Anexo", url: attachmentUrl },
    });
  }

  revalidateSocial();
  return { success: true };
}

export async function updateProfileReportAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return { error: "Relatório não encontrado." };

  const { error, data } = readProfileReportFields(formData);
  if (error || !data) return { error: error ?? "Preencha os campos obrigatórios." };

  await prisma.socialProfileReport.update({ where: { id: reportId }, data });

  revalidateSocial();
  return { success: true };
}

export async function addReportAttachmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

  const reportId = String(formData.get("reportId") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const externalUrl = String(formData.get("externalUrl") ?? "").trim();

  if (!reportId) return { error: "Relatório não encontrado." };

  let url = externalUrl;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const v = validateUpload(file, UPLOAD_TYPES.imageOrPdf, "Envie uma imagem ou PDF válido.");
    if (v.error) return { error: v.error };
    url = await saveUpload(file, "social/relatorios");
  }
  if (!url) return { error: "Anexe um arquivo ou informe um link." };
  if (!label) return { error: "Dê um nome para o anexo." };

  await prisma.socialProfileReportAttachment.create({ data: { reportId, label, url } });

  revalidateSocial();
  return { success: true };
}

export async function deleteReportAttachmentAction(formData: FormData) {
  try {
    await requireSocialManager();
  } catch {
    return;
  }
  const attachmentId = String(formData.get("attachmentId") ?? "");
  if (!attachmentId) return;
  await prisma.socialProfileReportAttachment.delete({ where: { id: attachmentId } });
  revalidateSocial();
}

export async function deleteProfileReportAction(formData: FormData) {
  try {
    await requireSocialManager();
  } catch {
    return;
  }
  const reportId = String(formData.get("reportId") ?? "");
  if (!reportId) return;
  await prisma.socialProfileReport.delete({ where: { id: reportId } });
  revalidateSocial();
}
