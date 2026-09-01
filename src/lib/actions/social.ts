"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis } from "@/lib/permissions";
import { scrapeReporteiDashboard } from "@/lib/reportei-scraper";
import { generateReporteiInsights } from "@/lib/reportei-insights";
import type {
  PodcastStatus,
  PodcastSource,
  SocialLeadStatus,
  ContentFormat,
  ContentPostStatus,
} from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

async function requireSocialManager() {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) {
    throw new Error("Sem permissão");
  }
  return user;
}

function revalidateSocial() {
  revalidatePath("/social");
  revalidatePath("/social/colaboradores");
  revalidatePath("/social/calendario");
  revalidatePath("/social/tarefas");
  revalidatePath("/social/crm");
  revalidatePath("/social/podcast");
  revalidatePath("/social/dashboard");
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

  const profile = await prisma.socialProfile.findUnique({ where: { id: profileId } });
  if (!profile || !profile.reporteiUrl) {
    return { error: "Este perfil não tem link do Reportei vinculado." };
  }

  let metrics;
  try {
    metrics = await scrapeReporteiDashboard(profile.reporteiUrl);
  } catch {
    return { error: "Não foi possível carregar o Reportei agora. Tente novamente em instantes." };
  }
  if (metrics.length === 0) {
    return { error: "O Reportei não retornou dados legíveis dessa vez. Tente novamente." };
  }

  const insights = generateReporteiInsights(metrics);

  await prisma.$transaction([
    prisma.socialReporteiMetric.deleteMany({ where: { profileId } }),
    prisma.socialReporteiInsight.deleteMany({ where: { profileId } }),
    prisma.socialReporteiMetric.createMany({
      data: metrics.map((m) => ({ profileId, ...m })),
    }),
    prisma.socialReporteiInsight.createMany({
      data: insights.map((i) => ({ profileId, ...i })),
    }),
  ]);

  revalidateSocial();
  return { success: true, count: metrics.length };
}

// ---------------------------------------------------------------------------
// Podcast
// ---------------------------------------------------------------------------

export async function createPodcastEpisodeAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await requireSocialManager();
  } catch {
    return { error: "Sem permissão." };
  }

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
  const status = (formData.get("status") as PodcastStatus | null) || "agendado";
  const source = formData.get("source") as PodcastSource | null;

  const episodeNumber = Number(episodeNumberRaw);
  if (!guestName || !episodeNumberRaw || Number.isNaN(episodeNumber) || !source) {
    return { error: "Preencha número do episódio, convidado e fonte." };
  }

  await prisma.podcastEpisode.create({
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
    },
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

  await prisma.contentCalendarPost.create({
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
  return { success: true };
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

export async function deleteContentPostAction(formData: FormData) {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "social")) return;

  const postId = String(formData.get("postId") ?? "");
  if (!postId) return;
  await prisma.contentCalendarPost.delete({ where: { id: postId } });
  revalidateSocial();
}
