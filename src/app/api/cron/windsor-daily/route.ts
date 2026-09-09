import { NextResponse } from "next/server";
import { refreshTrafficMetrics } from "@/lib/traffic-refresh";

/**
 * Chamado 1x/dia (Railway Cron, 07:00) pra puxar Facebook Ads + GoHighLevel
 * via Windsor.ai — gated por um segredo de infra (CRON_SECRET, o mesmo já
 * usado pelo cron do Reportei), não por sessão de usuário.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const result = await refreshTrafficMetrics();
  return NextResponse.json({ result });
}
