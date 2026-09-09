import { prisma } from "@/lib/db";
import { windsorGet, windsorNumber, windsorText } from "@/lib/windsor";
import { classifyCampaign, TRAFFIC_FACEBOOK_ACCOUNT_ID, TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID } from "@/lib/traffic";
import { batchUpsert } from "@/lib/db-batch";
import type { TrafficCategory } from "@prisma/client";

type PipelineStage = { id: string; position: number };

/** Modelo do funil confirmado com o usuário: tráfego gera Leads (Facebook
 * Ads), o formulário de captura já qualifica quem entra no CRM — todo
 * contato que chega no GoHighLevel via tráfego é um MQL (não depende de tag,
 * a tag "mql" praticamente não é usada). Só avançam pro funil comercial
 * (SQL) as oportunidades que saem do primeiro estágio do pipeline.
 *
 * Puxa campanhas + anúncios/criativos + contatos (MQL) + oportunidades (SQL)
 * desde o início do ano corrente. Mesmo mecanismo usado pelo botão
 * "Atualizar" e pelo cron diário das 7h. Não lança: erros viram { error }
 * pro chamador decidir como reportar. */
export async function refreshTrafficMetrics(): Promise<{
  error?: string;
  campaigns?: number;
  ads?: number;
  mqlLeads?: number;
  sqlLeads?: number;
}> {
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const today = now.toISOString().slice(0, 10);

  let campaignRows, adRows, contactRows, opportunityRows, pipelineRows;
  try {
    [campaignRows, adRows, contactRows, opportunityRows, pipelineRows] = await Promise.all([
      windsorGet("facebook", {
        fields: "account_id,account_name,campaign_id,campaign,campaign_objective,date,spend,actions_lead",
        select_accounts: TRAFFIC_FACEBOOK_ACCOUNT_ID,
        date_from: yearStart,
        date_to: today,
      }),
      windsorGet("facebook", {
        fields: "account_id,campaign_id,campaign,ad_id,ad_name,date,spend,actions_lead",
        select_accounts: TRAFFIC_FACEBOOK_ACCOUNT_ID,
        date_preset: "last_30dT",
      }),
      windsorGet("gohighlevel", {
        fields: "contact_id,contact_first_name,contact_last_name,contact_date_added",
        select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
        date_from: yearStart,
        date_to: today,
      }),
      windsorGet("gohighlevel", {
        fields: "opportunity_id,opportunity_pipeline_id,opportunity_pipeline_stage_id,opportunity_status,opportunity_created_at",
        select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
        date_from: yearStart,
        date_to: today,
      }),
      windsorGet("gohighlevel", {
        fields: "pipeline_id,pipeline_stages",
        select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
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

  await batchUpsert(campaignData, (row) =>
    prisma.trafficCampaignMetric.upsert({
      where: { campaignId_date: { campaignId: row.campaignId, date: row.date } },
      create: row,
      update: row,
    })
  );

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

  await batchUpsert(adData, (row) =>
    prisma.trafficAdMetric.upsert({
      where: { adId_date: { adId: row.adId, date: row.date } },
      create: row,
      update: row,
    })
  );

  // MQL = todo contato que chega no CRM (o formulário do Facebook já
  // qualifica quem entra) — não filtra por tag.
  const mqlData = contactRows
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

  await batchUpsert(mqlData, (row) =>
    prisma.trafficMqlLead.upsert({
      where: { externalId: row.externalId },
      create: row,
      update: row,
    })
  );

  // SQL = oportunidade que saiu do primeiro estágio (position 0) do seu
  // pipeline — "só avançam pras próximas etapas os qualificados".
  const firstStageByPipeline = new Map<string, string>();
  for (const row of pipelineRows) {
    const pipelineId = windsorText(row, "pipeline_id");
    let stages = row["pipeline_stages"];
    if (typeof stages === "string") {
      try {
        stages = JSON.parse(stages);
      } catch {
        continue;
      }
    }
    if (!pipelineId || !Array.isArray(stages)) continue;
    const first = (stages as PipelineStage[]).find((s) => s.position === 0);
    if (first) firstStageByPipeline.set(pipelineId, first.id);
  }

  const sqlData = opportunityRows
    .map((row) => {
      const externalId = windsorText(row, "opportunity_id");
      const pipelineId = windsorText(row, "opportunity_pipeline_id");
      const stageId = windsorText(row, "opportunity_pipeline_stage_id");
      const createdAtRaw = windsorText(row, "opportunity_created_at");
      const firstStageId = firstStageByPipeline.get(pipelineId);
      return {
        externalId,
        pipelineId,
        stageId,
        status: windsorText(row, "opportunity_status"),
        isAdvanced: Boolean(firstStageId) && stageId !== firstStageId,
        createdAt: createdAtRaw ? new Date(createdAtRaw) : new Date(),
      };
    })
    .filter((r) => r.externalId);

  await batchUpsert(sqlData, (row) =>
    prisma.trafficSqlLead.upsert({
      where: { externalId: row.externalId },
      create: row,
      update: row,
    })
  );

  return {
    campaigns: campaignData.length,
    ads: adData.length,
    mqlLeads: mqlData.length,
    sqlLeads: sqlData.filter((r) => r.isAdvanced).length,
  };
}
