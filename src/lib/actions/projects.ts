"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis, isAdmin } from "@/lib/permissions";
import type { ProjectStatus } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

function revalidateProjectViews(areaSlug: string) {
  revalidatePath(`/areas/${areaSlug}`);
  revalidatePath("/projetos");
  revalidatePath("/dashboard");
}

export async function createProjectAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const areaId = String(formData.get("areaId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const ownerId = String(formData.get("ownerId") ?? "");
  const startRaw = String(formData.get("startDate") ?? "");
  const deadlineRaw = String(formData.get("deadline") ?? "");

  const area = await prisma.area.findUnique({ where: { id: areaId } });
  if (!area) return { error: "Área inválida." };

  if (!isAdmin(user) && !canEditAreaKpis(user, area.slug)) {
    return { error: "Apenas o líder da área pode criar projetos." };
  }

  if (!name || !ownerId || !startRaw || !deadlineRaw) {
    return { error: "Preencha nome, responsável, início e prazo." };
  }

  await prisma.project.create({
    data: {
      areaId,
      name,
      description: description || "—",
      ownerId,
      startDate: new Date(`${startRaw}T09:00:00`),
      deadline: new Date(`${deadlineRaw}T18:00:00`),
      status: "no_ritmo",
      progressPct: 0,
    },
  });

  revalidateProjectViews(area.slug);
  return { success: true };
}

export async function updateProjectAction(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") ?? "");
  const status = formData.get("status") as ProjectStatus | null;
  const progressRaw = formData.get("progressPct");

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { area: true },
  });
  if (!project) return;

  if (!isAdmin(user) && !canEditAreaKpis(user, project.area.slug) && project.ownerId !== user.id) {
    return;
  }

  const data: { status?: ProjectStatus; progressPct?: number } = {};
  if (status) data.status = status;
  if (progressRaw !== null) {
    const progressPct = Math.max(0, Math.min(100, Number(progressRaw)));
    if (!Number.isNaN(progressPct)) data.progressPct = progressPct;
  }

  if (Object.keys(data).length > 0) {
    await prisma.project.update({ where: { id: projectId }, data });
  }

  revalidateProjectViews(project.area.slug);
}
