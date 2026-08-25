"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageRhFor } from "@/lib/permissions";
import type { RhReviewType, RhClassification } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

/**
 * Quem formaliza a autoavaliação de alguém: para um líder, é o Marcus
 * (líder direto de todos os líderes, por definição do negócio); para um
 * colaborador, é o líder da área em que ele está.
 */
async function getManagerId(subjectId: string): Promise<string | null> {
  const subject = await prisma.user.findUnique({
    where: { id: subjectId },
    include: { memberships: true },
  });
  if (!subject) return null;

  const isLeaderSomewhere = subject.memberships.some((m) => m.role === "lider");
  if (isLeaderSomewhere) {
    const marcus = await prisma.user.findUnique({
      where: { email: "operacoes@brandlegacy.com.br" },
    });
    return marcus?.id ?? null;
  }

  for (const m of subject.memberships) {
    const leaderMembership = await prisma.membership.findFirst({
      where: { areaId: m.areaId, role: "lider" },
    });
    if (leaderMembership) return leaderMembership.userId;
  }
  return null;
}

export async function submitSelfAssessmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const type = formData.get("type") as RhReviewType | null;
  const dateRaw = String(formData.get("date") ?? "");
  const classification = (formData.get("classification") as RhClassification | null) || null;
  const workLifeBalance = String(formData.get("workLifeBalance") ?? "").trim();
  const scoreRaw = String(formData.get("contributionScore") ?? "");
  const contributionReason = String(formData.get("contributionReason") ?? "").trim();
  const feedbackToLeader = String(formData.get("feedbackToLeader") ?? "").trim() || null;
  const selfHighlights = String(formData.get("selfHighlights") ?? "").trim() || null;
  const selfImprovements = String(formData.get("selfImprovements") ?? "").trim() || null;

  if (!type || !dateRaw || !workLifeBalance || !scoreRaw || !contributionReason) {
    return {
      error:
        "Preencha tipo, data, equilíbrio vida/trabalho, nota de contribuição e o porquê.",
    };
  }

  const contributionScore = Math.max(0, Math.min(10, Number(scoreRaw)));
  if (Number.isNaN(contributionScore)) {
    return { error: "Nota de contribuição inválida." };
  }

  const evaluatorId = await getManagerId(user.id);
  if (!evaluatorId) {
    return { error: "Não encontramos seu líder direto para formalizar esta avaliação." };
  }

  const review = await prisma.rhReview.create({
    data: {
      subjectId: user.id,
      evaluatorId,
      type,
      date: new Date(`${dateRaw}T12:00:00`),
      selfClassification: classification,
      selfWorkLifeBalance: workLifeBalance,
      selfContributionScore: contributionScore,
      selfContributionReason: contributionReason,
      selfFeedbackToLeader: feedbackToLeader,
      selfHighlights,
      selfImprovements,
      selfSubmittedAt: new Date(),
    },
  });

  revalidatePath("/rh");
  revalidatePath(`/rh/${user.id}`);
  return { success: true };
}

export async function submitLeaderFeedbackAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const reviewId = String(formData.get("reviewId") ?? "");
  const classification = (formData.get("classification") as RhClassification | null) || null;
  const ratingRaw = String(formData.get("rating") ?? "");
  const highlights = String(formData.get("highlights") ?? "").trim() || null;
  const improvements = String(formData.get("improvements") ?? "").trim() || null;
  const actionItems = String(formData.get("actionItems") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const review = await prisma.rhReview.findUnique({
    where: { id: reviewId },
    include: { subject: { include: { memberships: { include: { area: true } } } } },
  });
  if (!review) return { error: "Encontro não encontrado." };
  if (!review.selfSubmittedAt) {
    return { error: "A autoavaliação do liderado ainda não foi respondida." };
  }

  const areaSlugs = review.subject.memberships.map((m) => m.area.slug);
  if (!canManageRhFor(user, { areaSlugs })) {
    return { error: "Você não pode formalizar o RH desta pessoa." };
  }

  const rating = ratingRaw ? Math.max(1, Math.min(5, Number(ratingRaw))) : null;
  if (ratingRaw && Number.isNaN(rating)) {
    return { error: "Nota inválida." };
  }

  await prisma.rhReview.update({
    where: { id: reviewId },
    data: {
      leaderClassification: classification,
      rating,
      highlights,
      improvements,
      actionItems,
      notes,
      leaderSubmittedAt: new Date(),
    },
  });

  revalidatePath("/rh");
  revalidatePath(`/rh/${review.subjectId}`);
  return { success: true };
}

export async function deleteRhReviewAction(formData: FormData) {
  const user = await requireUser();
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await prisma.rhReview.findUnique({
    where: { id: reviewId },
    include: { subject: { include: { memberships: { include: { area: true } } } } },
  });
  if (!review) return;

  const areaSlugs = review.subject.memberships.map((m) => m.area.slug);
  if (
    !canManageRhFor(user, { areaSlugs }) &&
    review.evaluatorId !== user.id &&
    review.subjectId !== user.id
  ) {
    return;
  }

  await prisma.rhReview.delete({ where: { id: reviewId } });

  revalidatePath("/rh");
  revalidatePath(`/rh/${review.subjectId}`);
}
