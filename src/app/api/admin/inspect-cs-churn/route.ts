import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const byStatus = await prisma.customer.groupBy({ by: ["status"], _count: true });
  const cancelados = await prisma.customer.findMany({
    where: { status: "cancelado" },
    select: { name: true, endDate: true, entryDate: true },
  });
  const withMrr = await prisma.customer.count({ where: { mrr: { not: null } } });
  const total = await prisma.customer.count();

  return NextResponse.json({ byStatus, canceladosCount: cancelados.length, cancelados, withMrr, total });
}
