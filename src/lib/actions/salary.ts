"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { canManageSalaryRecords } from "@/lib/permissions";

export type ActionState = { error?: string; success?: boolean };

export async function upsertSalaryRecordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!canManageSalaryRecords(user)) return { error: "Sem permissão." };

  const userId = String(formData.get("userId") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const areaLabel = String(formData.get("areaLabel") ?? "").trim();
  const salaryRaw = String(formData.get("salary") ?? "").replace(",", ".");
  const salary = Number(salaryRaw);

  if (!userId || !fullName || !cargo || !areaLabel || !salaryRaw || Number.isNaN(salary)) {
    return { error: "Preencha pessoa, nome completo, cargo, área e salário." };
  }

  await prisma.salaryRecord.upsert({
    where: { userId },
    create: { userId, fullName, cargo, areaLabel, salary },
    update: { fullName, cargo, areaLabel, salary },
  });

  revalidatePath("/rh/cargos-salarios");
  return { success: true };
}

export async function deleteSalaryRecordAction(formData: FormData) {
  const user = await requireUser();
  if (!canManageSalaryRecords(user)) return;

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await prisma.salaryRecord.delete({ where: { id } });
  revalidatePath("/rh/cargos-salarios");
}
