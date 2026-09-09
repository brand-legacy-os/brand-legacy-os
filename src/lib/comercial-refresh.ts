import { prisma } from "@/lib/db";
import { windsorGet, windsorText, windsorNumber } from "@/lib/windsor";
import { TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID } from "@/lib/traffic";
import { classifyChannel, parseProduct } from "@/lib/comercial";
import type { GhlOpportunityStatus } from "@prisma/client";

type PipelineStage = { id: string; name?: string; position: number };

/// Organização do Calendly conectada (confirmada via users-get_current_user
/// na sessão que criou este módulo) — única org usada pelo time hoje.
const CALENDLY_ORG_URI = "https://api.calendly.com/organizations/6611da7e-3ef1-4f9a-b85c-861b7bfe12d8";
const CALENDLY_BASE = "https://api.calendly.com";
/// Janela em que buscamos o detalhe de no-show por convidado (1 chamada de
/// API por reunião) — pra trás disso listamos as reuniões (volume/closer)
/// mas não marcamos no-show individualmente, pra não fazer milhares de
/// chamadas sequenciais num único "Atualizar". Ajustável se necessário.
const NO_SHOW_LOOKBACK_DAYS = 180;

async function calendlyGet(path: string, params: Record<string, string> = {}) {
  const token = process.env.CALENDLY_API_TOKEN;
  if (!token) return null;
  const url = new URL(path.startsWith("http") ? path : `${CALENDLY_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Calendly respondeu ${res.status} em ${path}`);
  return res.json();
}

async function fetchAllCalendlyEvents(minStart: string, maxStart: string) {
  const events: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  do {
    const data = await calendlyGet("/scheduled_events", {
      organization: CALENDLY_ORG_URI,
      min_start_time: minStart,
      max_start_time: maxStart,
      count: "100",
      ...(pageToken ? { page_token: pageToken } : {}),
    });
    if (!data) return events;
    events.push(...(data.collection ?? []));
    pageToken = data.pagination?.next_page_token ?? undefined;
  } while (pageToken);
  return events;
}

async function fetchInviteeNoShowAndUtm(eventUri: string): Promise<{ noShow: boolean; utmSource: string | null }> {
  const data = await calendlyGet(`${eventUri}/invitees`, { count: "25" });
  const invitees = (data?.collection ?? []) as Record<string, unknown>[];
  const anyNoShow = invitees.some((i) => i.no_show != null);
  const utmSource = invitees.length > 0 ? ((invitees[0].tracking as Record<string, unknown> | undefined)?.utm_source as string | undefined) ?? null : null;
  return { noShow: anyNoShow, utmSource };
}

/** Puxa oportunidades + pipelines + usuários do GoHighLevel (via Windsor) e
 * reuniões do Calendly (API direta, precisa de CALENDLY_API_TOKEN) desde o
 * início do ano corrente. Mesmo mecanismo do botão "Atualizar" e do cron
 * diário das 7h. Não lança: erros viram { error } pro chamador reportar. */
export async function refreshComercialMetrics(): Promise<{
  error?: string;
  opportunities?: number;
  meetings?: number;
  calendlySkipped?: boolean;
}> {
  const now = new Date();
  const yearStart = `${now.getFullYear()}-01-01`;
  const today = now.toISOString().slice(0, 10);

  let opportunityRows, pipelineRows, userRows;
  try {
    [opportunityRows, pipelineRows, userRows] = await Promise.all([
      windsorGet("gohighlevel", {
        fields:
          "opportunity_id,opportunity_name,opportunity_monetary_value,opportunity_status,opportunity_pipeline_id,opportunity_pipeline_stage_id,opportunity_assigned_to,opportunity_created_at,opportunity_last_status_change_at",
        select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
        date_from: yearStart,
        date_to: today,
      }),
      windsorGet("gohighlevel", {
        fields: "pipeline_id,pipeline_name,pipeline_stages",
        select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
      }),
      windsorGet("gohighlevel", {
        fields: "user_id,user_email,user_first_name,user_last_name",
        select_accounts: TRAFFIC_GOHIGHLEVEL_ACCOUNT_ID,
      }),
    ]);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Não foi possível carregar o GoHighLevel." };
  }

  const pipelineNameById = new Map<string, string>();
  const stageNameById = new Map<string, string>();
  for (const row of pipelineRows) {
    const pipelineId = windsorText(row, "pipeline_id");
    const pipelineName = windsorText(row, "pipeline_name");
    if (pipelineId) pipelineNameById.set(pipelineId, pipelineName);
    let stages = row["pipeline_stages"];
    if (typeof stages === "string") {
      try {
        stages = JSON.parse(stages);
      } catch {
        continue;
      }
    }
    if (Array.isArray(stages)) {
      for (const s of stages as PipelineStage[]) {
        if (s.id && s.name) stageNameById.set(s.id, s.name);
      }
    }
  }

  const emailByUserId = new Map<string, string>();
  for (const row of userRows) {
    const userId = windsorText(row, "user_id");
    const email = windsorText(row, "user_email");
    if (userId && email) emailByUserId.set(userId, email);
  }

  const opportunityData = opportunityRows
    .map((row) => {
      const externalId = windsorText(row, "opportunity_id");
      const pipelineId = windsorText(row, "opportunity_pipeline_id");
      const pipelineName = pipelineNameById.get(pipelineId) ?? "";
      const stageId = windsorText(row, "opportunity_pipeline_stage_id");
      const name = windsorText(row, "opportunity_name");
      const createdAtRaw = windsorText(row, "opportunity_created_at");
      const statusChangeRaw = windsorText(row, "opportunity_last_status_change_at");
      const status = (windsorText(row, "opportunity_status") || "open") as GhlOpportunityStatus;
      const assignedToId = windsorText(row, "opportunity_assigned_to");
      return {
        externalId,
        name,
        monetaryValue: windsorNumber(row, "opportunity_monetary_value"),
        status,
        pipelineId,
        pipelineName,
        stageId,
        stageName: stageNameById.get(stageId) ?? null,
        channel: classifyChannel(pipelineName),
        product: parseProduct(name, pipelineName),
        assignedToEmail: assignedToId ? emailByUserId.get(assignedToId) ?? null : null,
        createdAt: createdAtRaw ? new Date(createdAtRaw) : null,
        wonAt: status === "won" && statusChangeRaw ? new Date(statusChangeRaw) : null,
      };
    })
    .filter((r): r is typeof r & { createdAt: Date } => Boolean(r.externalId && r.createdAt));

  for (const row of opportunityData) {
    await prisma.ghlOpportunity.upsert({
      where: { externalId: row.externalId },
      create: row,
      update: row,
    });
  }

  // Calendly — só roda se o token estiver configurado (senão, pula com aviso
  // em vez de quebrar o resto do refresh).
  const token = process.env.CALENDLY_API_TOKEN;
  if (!token) {
    return { opportunities: opportunityData.length, meetings: 0, calendlySkipped: true };
  }

  let events: Record<string, unknown>[];
  try {
    events = await fetchAllCalendlyEvents(`${yearStart}T00:00:00.000000Z`, `${today}T23:59:59.000000Z`);
  } catch (e) {
    return {
      opportunities: opportunityData.length,
      error: `GoHighLevel ok, mas Calendly falhou: ${e instanceof Error ? e.message : "erro desconhecido"}`,
    };
  }

  const noShowCutoff = new Date();
  noShowCutoff.setDate(noShowCutoff.getDate() - NO_SHOW_LOOKBACK_DAYS);

  let meetingCount = 0;
  for (const ev of events) {
    const externalId = windsorText(ev, "uri");
    const startTimeRaw = windsorText(ev, "start_time");
    const status = windsorText(ev, "status") || "active";
    const name = windsorText(ev, "name") || "Reunião";
    const memberships = (ev["event_memberships"] as { user_email?: string }[] | undefined) ?? [];
    const assigneeEmail = memberships[0]?.user_email ?? null;
    if (!externalId || !startTimeRaw) continue;
    const startTime = new Date(startTimeRaw);

    let noShow = false;
    let utmSource: string | null = null;
    if (status === "active" && startTime >= noShowCutoff) {
      try {
        const detail = await fetchInviteeNoShowAndUtm(externalId);
        noShow = detail.noShow;
        utmSource = detail.utmSource;
      } catch {
        // segue sem no-show/utm pra essa reunião específica — não trava o resto
      }
    }

    await prisma.calendlyMeeting.upsert({
      where: { externalId },
      create: { externalId, eventTypeName: name, assigneeEmail, startTime, status, noShow, utmSource },
      update: { eventTypeName: name, assigneeEmail, startTime, status, noShow, utmSource },
    });
    meetingCount++;
  }

  return { opportunities: opportunityData.length, meetings: meetingCount };
}
