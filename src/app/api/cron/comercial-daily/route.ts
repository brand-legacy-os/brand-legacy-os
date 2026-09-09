import { NextResponse } from "next/server";
import { refreshComercialMetrics } from "@/lib/comercial-refresh";

/**
 * Chamado 1x/dia (Railway Cron, 07:00) pra puxar GoHighLevel (Opportunities)
 * + Calendly (reuniões) — gated pelo mesmo CRON_SECRET dos outros crons.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const result = await refreshComercialMetrics();
  return NextResponse.json({ result });
}
