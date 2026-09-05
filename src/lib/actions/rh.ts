"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageRhFor } from "@/lib/permissions";
import { RH_QUESTIONS_BY_TYPE } from "@/lib/rh";
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
  const classificationReason = String(formData.get("classificationReason") ?? "").trim();

  if (!type || !dateRaw || !classification || !classificationReason) {
    return { error: "Preencha tipo, data, classificação e o porquê." };
  }

  const questions = RH_QUESTIONS_BY_TYPE[type];
  const answers: Record<string, string> = {};
  for (const q of questions) {
    const raw = String(formData.get(`answer_${q.key}`) ?? "").trim();
    if (!raw) {
      return { error: `Preencha: ${q.label}` };
    }
    if (q.kind === "number") {
      const n = Math.max(0, Math.min(10, Number(raw)));
      if (Number.isNaN(n)) return { error: `Valor inválido em: ${q.label}` };
      answers[q.key] = String(n);
    } else {
      answers[q.key] = raw;
    }
  }

  const evaluatorId = await getManagerId(user.id);
  if (!evaluatorId) {
    return { error: "Não encontramos seu líder direto para formalizar esta avaliação." };
  }

  await prisma.rhReview.create({
    data: {
      subjectId: user.id,
      evaluatorId,
      type,
      date: new Date(`${dateRaw}T12:00:00`),
      selfClassification: classification,
      selfClassificationReason: classificationReason,
      selfAnswers: answers,
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
  const classificationComment = String(formData.get("classificationComment") ?? "").trim() || null;
  const ratingRaw = String(formData.get("rating") ?? "");

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

  // Um comentário do líder por pergunta que o liderado respondeu — mesma
  // chave de RH_QUESTIONS_BY_TYPE[review.type], vinda do formulário dinâmico.
  const comments: Record<string, string> = {};
  for (const q of RH_QUESTIONS_BY_TYPE[review.type]) {
    const raw = String(formData.get(`comment_${q.key}`) ?? "").trim();
    if (raw) comments[q.key] = raw;
  }

  const isAnual = review.type === "anual";
  const leaderSalaryHistory = isAnual ? String(formData.get("leaderSalaryHistory") ?? "").trim() || null : null;
  const postSalaryRaw = isAnual ? String(formData.get("leaderPostReviewSalary") ?? "").trim() : "";
  const bonusRaw = isAnual ? String(formData.get("leaderExceptionalBonus") ?? "").trim() : "";
  const roleChangedRaw = isAnual ? formData.get("leaderRoleChanged") : null;
  const leaderNextYearRole = isAnual ? String(formData.get("leaderNextYearRole") ?? "").trim() || null : null;

  await prisma.rhReview.update({
    where: { id: reviewId },
    data: {
      leaderClassification: classification,
      leaderClassificationComment: classificationComment,
      leaderComments: comments,
      rating,
      leaderSalaryHistory,
      leaderPostReviewSalary: postSalaryRaw ? Number(postSalaryRaw) : null,
      leaderExceptionalBonus: bonusRaw ? Number(bonusRaw) : null,
      leaderRoleChanged: roleChangedRaw === null ? null : roleChangedRaw === "sim",
      leaderNextYearRole,
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
