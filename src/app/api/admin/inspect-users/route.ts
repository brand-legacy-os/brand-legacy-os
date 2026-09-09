import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const customerCount = await prisma.customer.count();

  return NextResponse.json({ users, customerCount });
}
