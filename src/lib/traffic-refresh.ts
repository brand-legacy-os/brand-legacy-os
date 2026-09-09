import { prisma } from "@/lib/db";
import { windsorGet, windsorNumber, windsorText } from "@/lib/windsor";
import { classifyCampaign, TRAFFIC_FACEBOOK_ACCOUNT_ID, TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID } from "@/lib/traffic";
import type { TrafficCategory } from "@prisma/client";

/** Puxa campanhas (90d, pra tendência), anúncios/criativos (30d, pra
 * ranking "o que está funcionando agora") e leads com a tag "mql" no
 * GoHighLevel (sem limite de data — são raros) do Windsor.ai. Mesmo
 * mecanismo usado pelo botão "Atualizar" e pelo cron diário das 7h. Não
 * lança: erros viram { error } pro chamador decidir como reportar. */
export async function refreshTrafficMetrics(): Promise<{
  error?: string;
  campaigns?: number;
  ads?: number;
  mqlLeads?: number;
}> {
  let campaignRows, adRows, mqlRows;
  try {
    [campaignRows, adRows, mqlRows] = await Promise.all([
      windsorGet("facebook", {
        fields: "account_id,account_name,campaign_id,campaign,campaign_objective,date,spend,actions_lead",
        select_accounts: TRAFFIC_FACEBOOK_ACCOUNT_ID,
        date_preset: "last_90dT",
      }),
      windsorGet("facebook", {
        fields: "account_id,campaign_id,campaign,ad_id,ad_name,date,spend,actions_lead",
        select_accounts: TRAFFIC_FACEBOOK_ACCOUNT_ID,
        date_preset: "last_30dT",
      }),
      windsorGet("gohighlevel", {
        fields: "contact_id,contact_first_name,contact_last_name,contact_date_added,contact_tags",
        select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
        date_from: "2020-01-01",
        date_to: new Date().toISOString().slice(0, 10),
        filter: JSON.stringify([["contact_tags", "contains", "mql"]]),
      }),
    ]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível carregar o Windsor.ai." };
  }

  const overrides = await prisma.trafficCampaignCategoryOverride.findMany();
  const overrideMap = new Map(overrides.map((o) => [o.campaignId, o.category as TrafficCategory]));

  const campaignData = campaignRows
    .map((row) => {
      const campaignId = windsorText(row, "campaign_id");
      const dateRaw = windsorText(row, "date");
      const objective = windsorText(row, "campaign_objective") || null;
      const campaignName = windsorText(row, "campaign");
      return {
        campaignId,
        date: dateRaw ? new Date(`${dateRaw}T12:00:00`) : null,
        accountId: windsorText(row, "account_id"),
        accountName: windsorText(row, "account_name"),
        campaignName,
        objective,
        category: overrideMap.get(campaignId) ?? classifyCampaign(campaignName, objective),
        spend: windsorNumber(row, "spend"),
        leads: windsorNumber(row, "actions_lead"),
      };
    })
    .filter((r): r is typeof r & { date: Date } => Boolean(r.campaignId && r.date));

  for (const row of campaignData) {
    await prisma.trafficCampaignMetric.upsert({
      where: { campaignId_date: { campaignId: row.campaignId, date: row.date } },
      create: row,
      update: row,
    });
  }

  const adData = adRows
    .map((row) => {
      const adId = windsorText(row, "ad_id");
      const dateRaw = windsorText(row, "date");
      return {
        adId,
        date: dateRaw ? new Date(`${dateRaw}T12:00:00`) : null,
        accountId: windsorText(row, "account_id"),
        campaignId: windsorText(row, "campaign_id"),
        campaignName: windsorText(row, "campaign"),
        adName: windsorText(row, "ad_name"),
        spend: windsorNumber(row, "spend"),
        leads: windsorNumber(row, "actions_lead"),
      };
    })
    .filter((r): r is typeof r & { date: Date } => Boolean(r.adId && r.date));

  for (const row of adData) {
    await prisma.trafficAdMetric.upsert({
      where: { adId_date: { adId: row.adId, date: row.date } },
      create: row,
      update: row,
    });
  }

  const mqlData = mqlRows
    .map((row) => {
      const externalId = windsorText(row, "contact_id");
      const first = windsorText(row, "contact_first_name");
      const last = windsorText(row, "contact_last_name");
      const dateAddedRaw = windsorText(row, "contact_date_added");
      return {
        externalId,
        contactName: [first, last].filter(Boolean).join(" ") || null,
        dateAdded: dateAddedRaw ? new Date(dateAddedRaw) : new Date(),
      };
    })
    .filter((r) => r.externalId);

  for (const row of mqlData) {
    await prisma.trafficMqlLead.upsert({
      where: { externalId: row.externalId },
      create: row,
      update: row,
    });
  }

  return { campaigns: campaignData.length, ads: adData.length, mqlLeads: mqlData.length };
}
