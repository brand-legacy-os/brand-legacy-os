import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { name: { contains: "Setembro" } },
    orderBy: { startDate: "desc" },
  });
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  const sponsors = await prisma.sponsor.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, totalValue: true, status: true, createdAt: true, contactName: true, contactPhone: true },
  });

  const budgetLines = await prisma.eventBudgetLine.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, item: true, category: true, actualValue: true, status: true, supplier: true, createdAt: true },
  });

  return NextResponse.json({ eventId: event.id, sponsors, budgetLines });
}
