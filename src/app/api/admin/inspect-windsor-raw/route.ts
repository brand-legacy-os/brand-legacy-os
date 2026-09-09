import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { TRAFFIC_FACEBOOK_ACCOUNT_ID, TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID } from "@/lib/traffic";

const WINDSOR_BASE = "https://connectors.windsor.ai";

async function rawFetch(path: string, params: Record<string, string>) {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) throw new Error("WINDSOR_API_KEY não configurada.");
  const url = new URL(`${WINDSOR_BASE}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", apiKey);
  const res = await fetch(url.toString());
  const json = await res.json();
  return json as { data?: Record<string, unknown>[]; error?: string };
}

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const [campaignsJson, fbFieldsJson, ghlFieldsJson, dbCounts] = await Promise.all([
    rawFetch("facebook", {
      fields: "account_id,campaign_id,campaign,date,spend,actions_lead",
      select_accounts: TRAFFIC_FACEBOOK_ACCOUNT_ID,
      date_from: yearStart,
      date_to: today,
    }),
    rawFetch("facebook/fields", {}).catch(() => ({ data: [] })),
    rawFetch("gohighlevel/fields", {}).catch(() => ({ data: [] })),
    Promise.all([
      prisma.trafficCampaignMetric.count(),
      prisma.trafficAdMetric.count(),
      prisma.trafficMqlLead.count(),
      prisma.trafficSqlLead.count(),
      prisma.ghlOpportunity.count(),
    ]),
  ]);

  const campaigns = campaignsJson.data ?? [];
  const campaignsThisMonth = campaigns.filter((c) => String(c.date) >= monthStart);
  const spendThisMonth = campaignsThisMonth.reduce((s, c) => s + (Number(c.spend) || 0), 0);
  const distinctCampaignIds = new Set(campaigns.map((c) => c.campaign_id)).size;
  const spendByCampaign = new Map<string, number>();
  for (const c of campaigns) {
    const id = String(c.campaign_id);
    spendByCampaign.set(id, (spendByCampaign.get(id) ?? 0) + (Number(c.spend) || 0));
  }
  const topCampaigns = [...spendByCampaign.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Tentativa de descobrir se o connector do Facebook expõe algum campo de
  // account/data que sinalize múltiplas contas ativas (a conta configurada
  // hoje é só uma — TRAFFIC_FACEBOOK_ACCOUNT_ID).
  const fbFields = (fbFieldsJson.data ?? []).map((f) => f.id ?? f.name).filter(Boolean);
  const ghlFields = (ghlFieldsJson.data ?? []).map((f) => f.id ?? f.name).filter(Boolean);
  const tagRelatedFields = [...fbFields, ...ghlFields].filter((f) => String(f).toLowerCase().includes("tag"));

  return NextResponse.json({
    windsorCampaignRowsThisYear: campaigns.length,
    windsorDistinctCampaignIds: distinctCampaignIds,
    windsorSpendThisMonthMTD: spendThisMonth,
    windsorCampaignRowsThisMonth: campaignsThisMonth.length,
    topCampaignsBySpendThisYear: topCampaigns,
    dbCounts: {
      trafficCampaignMetric: dbCounts[0],
      trafficAdMetric: dbCounts[1],
      trafficMqlLead: dbCounts[2],
      trafficSqlLead: dbCounts[3],
      ghlOpportunity: dbCounts[4],
    },
    tagRelatedFieldsAvailable: tagRelatedFields,
    ghlFieldsSample: ghlFields.slice(0, 60),
  });
}
