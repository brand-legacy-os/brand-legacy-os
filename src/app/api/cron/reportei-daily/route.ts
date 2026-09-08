import { NextResponse } from "next/server";
import { refreshAllProfilesReportei } from "@/lib/reportei-refresh";

/**
 * Chamado 1x/dia (Railway Cron, 07:00) pra puxar o Reportei de todos os
 * perfis vinculados — gated por um segredo de infra (CRON_SECRET), não por
 * sessão de usuário, já que o job roda sem ninguém logado.
 */
export async function GET(request: Request) {
  const secret = request.headers.get("x-cron-secret") ?? new URL(request.url).searchParams.get("secret");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const results = await refreshAllProfilesReportei();
  return NextResponse.json({ results });
}
