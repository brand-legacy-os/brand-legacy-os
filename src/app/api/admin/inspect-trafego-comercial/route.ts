import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const [
    mqlCount,
    sqlAdvancedCount,
    sqlTotalCount,
    ghlOppTotalCount,
    ghlOppByChannel,
    lastMqlFetch,
    lastSqlFetch,
    lastGhlOppFetch,
    lastCampaignFetch,
    campaignCount,
    distinctPipelines,
  ] = await Promise.all([
    prisma.trafficMqlLead.count({ where: { dateAdded: { gte: yearStart, lte: now } } }),
    prisma.trafficSqlLead.count({ where: { isAdvanced: true, createdAt: { gte: yearStart, lte: now } } }),
    prisma.trafficSqlLead.count({ where: { createdAt: { gte: yearStart, lte: now } } }),
    prisma.ghlOpportunity.count({ where: { createdAt: { gte: yearStart, lte: now } } }),
    prisma.ghlOpportunity.groupBy({
      by: ["channel"],
      where: { createdAt: { gte: yearStart, lte: now } },
      _count: { _all: true },
    }),
    prisma.trafficMqlLead.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
    prisma.trafficSqlLead.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
    prisma.ghlOpportunity.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
    prisma.trafficCampaignMetric.findFirst({ orderBy: { fetchedAt: "desc" }, select: { fetchedAt: true } }),
    prisma.trafficCampaignMetric.count({ where: { date: { gte: yearStart, lte: now } } }),
    prisma.ghlOpportunity.groupBy({ by: ["pipelineName"], _count: { _all: true } }),
  ]);

  return NextResponse.json({
    mqlCount,
    sqlAdvancedCount,
    sqlTotalCount,
    ghlOppTotalCount,
    ghlOppByChannel,
    campaignCount,
    lastMqlFetch: lastMqlFetch?.fetchedAt ?? null,
    lastSqlFetch: lastSqlFetch?.fetchedAt ?? null,
    lastGhlOppFetch: lastGhlOppFetch?.fetchedAt ?? null,
    lastCampaignFetch: lastCampaignFetch?.fetchedAt ?? null,
    distinctPipelines: distinctPipelines.sort((a, b) => b._count._all - a._count._all),
  });
}
