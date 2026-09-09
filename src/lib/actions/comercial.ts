"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis } from "@/lib/permissions";
import { refreshComercialMetrics } from "@/lib/comercial-refresh";

export type ComercialRefreshState = {
  error?: string;
  success?: boolean;
  opportunities?: number;
  meetings?: number;
  calendlySkipped?: boolean;
};

export async function refreshComercialAction(
  _prev: ComercialRefreshState,
  _formData: FormData
): Promise<ComercialRefreshState> {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "comercial")) return { error: "Sem permissão." };

  const result = await refreshComercialMetrics();
  if (result.error && !result.opportunities) return { error: result.error };

  revalidatePath("/areas/comercial");
  revalidatePath("/social/crm");
  return {
    success: true,
    error: result.error,
    opportunities: result.opportunities,
    meetings: result.meetings,
    calendlySkipped: result.calendlySkipped,
  };
}
