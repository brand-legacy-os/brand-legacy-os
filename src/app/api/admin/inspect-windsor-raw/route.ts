import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { TRAFFIC_FACEBOOK_ACCOUNT_ID, TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID } from "@/lib/traffic";

const WINDSOR_BASE = "https://connectors.windsor.ai";

async function rawFetch(connector: string, params: Record<string, string>) {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) throw new Error("WINDSOR_API_KEY não configurada.");
  const url = new URL(`${WINDSOR_BASE}/${connector}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("api_key", apiKey);
  const res = await fetch(url.toString());
  const json = await res.json();
  const dataLen = Array.isArray(json.data) ? json.data.length : null;
  const otherKeys = Object.keys(json).filter((k) => k !== "data");
  const meta: Record<string, unknown> = {};
  for (const k of otherKeys) meta[k] = json[k];
  return { status: res.status, dataLen, meta, sampleFirst: json.data?.[0], sampleLast: json.data?.[dataLen ? dataLen - 1 : 0] };
}

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const today = now.toISOString().slice(0, 10);

  const [campaigns, opportunities, contacts] = await Promise.all([
    rawFetch("facebook", {
      fields: "account_id,campaign_id,campaign,date,spend,actions_lead",
      select_accounts: TRAFFIC_FACEBOOK_ACCOUNT_ID,
      date_from: yearStart,
      date_to: today,
    }),
    rawFetch("gohighlevel", {
      fields: "opportunity_id,opportunity_pipeline_id,opportunity_created_at",
      select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
      date_from: yearStart,
      date_to: today,
    }),
    rawFetch("gohighlevel", {
      fields: "contact_id,contact_date_added",
      select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
      date_from: yearStart,
      date_to: today,
    }),
  ]);

  return NextResponse.json({ campaigns, opportunities, contacts });
}
