"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis } from "@/lib/permissions";

export type AddKpiEntryState = { error?: string; success?: boolean };

export async function addKpiEntryAction(
  _prev: AddKpiEntryState,
  formData: FormData
): Promise<AddKpiEntryState> {
  const user = await requireUser();

  const kpiId = String(formData.get("kpiId") ?? "");
  const rawValue = String(formData.get("value") ?? "").replace(",", ".");
  const value = Number(rawValue);
  const note = String(formData.get("note") ?? "").trim() || null;
  const dateRaw = String(formData.get("date") ?? "");

  if (!kpiId || Number.isNaN(value)) {
    return { error: "Informe um valor numérico válido." };
  }

  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: { area: true },
  });
  if (!kpi) return { error: "Indicador não encontrado." };

  if (!canEditAreaKpis(user, kpi.area.slug)) {
    return { error: "Você não tem permissão para preencher este indicador." };
  }

  const date = dateRaw ? new Date(`${dateRaw}T12:00:00`) : new Date();

  await prisma.kpiEntry.create({
    data: { kpiId, value, note, date, createdById: user.id },
  });

  revalidatePath(`/areas/${kpi.area.slug}`);
  revalidatePath("/dashboard");

  return { success: true };
}

export type SetKpiTargetState = { error?: string; success?: boolean };

export async function setKpiTargetAction(
  _prev: SetKpiTargetState,
  formData: FormData
): Promise<SetKpiTargetState> {
  const user = await requireUser();

  const kpiId = String(formData.get("kpiId") ?? "");
  const periodKey = String(formData.get("periodKey") ?? "").trim();
  const rawTarget = String(formData.get("target") ?? "").replace(",", ".");
  const target = Number(rawTarget);

  if (!kpiId || !periodKey || Number.isNaN(target)) {
    return { error: "Informe o mês e um valor de meta válido." };
  }

  const kpi = await prisma.kpi.findUnique({
    where: { id: kpiId },
    include: { area: true },
  });
  if (!kpi) return { error: "Indicador não encontrado." };

  if (!canEditAreaKpis(user, kpi.area.slug)) {
    return { error: "Você não tem permissão para definir a meta deste indicador." };
  }

  await prisma.kpiTarget.upsert({
    where: { kpiId_periodKey: { kpiId, periodKey } },
    create: { kpiId, periodKey, target },
    update: { target },
  });

  revalidatePath(`/areas/${kpi.area.slug}`);
  revalidatePath("/dashboard");

  return { success: true };
}
