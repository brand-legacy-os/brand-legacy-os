"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { canEditAreaKpis } from "@/lib/permissions";
import { refreshTrafficMetrics } from "@/lib/traffic-refresh";
import { prisma } from "@/lib/db";
import type { TrafficCategory } from "@prisma/client";

export type TrafficRefreshState = {
  error?: string;
  success?: boolean;
  campaigns?: number;
  ads?: number;
  mqlLeads?: number;
};

function revalidateTraffic() {
  revalidatePath("/trafego");
  revalidatePath("/areas/comercial");
}

export async function refreshTrafficAction(
  _prev: TrafficRefreshState,
  _formData: FormData
): Promise<TrafficRefreshState> {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "comercial")) return { error: "Sem permissão." };

  const result = await refreshTrafficMetrics();
  if (result.error) return { error: result.error };

  revalidateTraffic();
  return { success: true, campaigns: result.campaigns, ads: result.ads, mqlLeads: result.mqlLeads };
}

export async function setCampaignCategoryAction(formData: FormData) {
  const user = await requireUser();
  if (!canEditAreaKpis(user, "comercial")) return;

  const campaignId = String(formData.get("campaignId") ?? "");
  const category = formData.get("category") as TrafficCategory | null;
  if (!campaignId || !category) return;

  await prisma.trafficCampaignCategoryOverride.upsert({
    where: { campaignId },
    create: { campaignId, category },
    update: { category },
  });
  // Reaplica imediatamente nas linhas já salvas, sem esperar o próximo
  // "Atualizar" pra refletir a correção manual.
  await prisma.trafficCampaignMetric.updateMany({ where: { campaignId }, data: { category } });

  revalidateTraffic();
}
