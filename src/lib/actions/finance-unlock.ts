"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasFinanceRole, unlockFinance } from "@/lib/finance-auth";
import { FINANCE_PASSCODE_HASH } from "@/lib/finance-passcode";

export type UnlockState = { error?: string };

export async function unlockFinanceAction(
  _prev: UnlockState,
  formData: FormData
): Promise<UnlockState> {
  const user = await requireUser();
  if (!hasFinanceRole(user)) {
    return { error: "Este módulo é restrito a sócios e ao Financeiro." };
  }

  const passcode = String(formData.get("passcode") ?? "");
  const valid = await bcrypt.compare(passcode, FINANCE_PASSCODE_HASH);
  if (!valid) {
    return { error: "Senha incorreta." };
  }

  await unlockFinance();
  redirect("/financeiro");
}
