import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const all = await prisma.sponsor.findMany({
    select: { id: true, name: true, totalValue: true, status: true, updatedAt: true, createdAt: true, eventId: true },
    orderBy: { updatedAt: "desc" },
  });

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const closedThisMonth = all.filter(
    (s) => !["em_negociacao", "cancelado"].includes(s.status) && s.updatedAt >= monthStart && s.updatedAt <= now
  );

  return NextResponse.json({
    totalSponsors: all.length,
    closedThisMonthCount: closedThisMonth.length,
    closedThisMonthValue: closedThisMonth.reduce((s, r) => s + r.totalValue, 0),
    closedThisMonthRows: closedThisMonth.map((s) => ({
      name: s.name,
      totalValue: s.totalValue,
      status: s.status,
      updatedAt: s.updatedAt,
      createdAt: s.createdAt,
    })),
    allRows: all.map((s) => ({ name: s.name, totalValue: s.totalValue, status: s.status, updatedAt: s.updatedAt, createdAt: s.createdAt })),
  });
}
