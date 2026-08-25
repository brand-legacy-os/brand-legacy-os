"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";

export type ActionState = { error?: string; success?: boolean };

export async function toggleTrainingRsvpAction(formData: FormData) {
  const user = await requireUser();
  const trainingId = String(formData.get("trainingId") ?? "");
  if (!trainingId) return;

  const existing = await prisma.trainingAttendee.findUnique({
    where: { trainingId_userId: { trainingId, userId: user.id } },
  });

  if (existing) {
    await prisma.trainingAttendee.delete({ where: { id: existing.id } });
  } else {
    await prisma.trainingAttendee.create({
      data: { trainingId, userId: user.id },
    });
  }

  revalidatePath("/treinamentos");
}

export async function updateTrainingDetailsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!isAdmin(user)) return { error: "Sem permissão." };

  const trainingId = String(formData.get("trainingId") ?? "");
  const meetLink = String(formData.get("meetLink") ?? "").trim() || null;
  const npsRaw = String(formData.get("nps") ?? "");
  const npsResponsesRaw = String(formData.get("npsResponses") ?? "");

  if (!trainingId) return { error: "Treinamento não encontrado." };
  if (meetLink && !/^https:\/\//i.test(meetLink)) {
    return { error: "O link do Meet precisa começar com https://" };
  }

  const nps = npsRaw ? Number(npsRaw) : null;
  const npsResponses = npsResponsesRaw ? Math.max(0, Math.round(Number(npsResponsesRaw))) : null;
  if (npsRaw && Number.isNaN(nps)) return { error: "NPS inválido." };

  await prisma.training.update({
    where: { id: trainingId },
    data: { meetLink, nps, npsResponses },
  });

  revalidatePath("/treinamentos");
  return { success: true };
}

export async function addTrainingMaterialAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!isAdmin(user)) return { error: "Sem permissão." };

  const trainingId = String(formData.get("trainingId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();

  if (!trainingId || !title || !type || !url) {
    return { error: "Preencha título, tipo e link do material." };
  }
  if (!/^https:\/\//i.test(url)) {
    return { error: "O link precisa começar com https://" };
  }

  await prisma.trainingMaterial.create({
    data: { trainingId, title, type, url },
  });

  revalidatePath("/treinamentos");
  return { success: true };
}

export async function deleteTrainingMaterialAction(formData: FormData) {
  const user = await requireUser();
  if (!isAdmin(user)) return;
  const materialId = String(formData.get("materialId") ?? "");
  if (!materialId) return;
  await prisma.trainingMaterial.delete({ where: { id: materialId } });
  revalidatePath("/treinamentos");
}
