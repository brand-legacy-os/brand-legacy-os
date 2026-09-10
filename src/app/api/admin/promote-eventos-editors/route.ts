import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

const EMAILS = [
  "lara.pujalte@brandlegacy.com.br",
  "igor.luis@brandlegacy.com.br",
  "karina.carvalho@brandlegacy.com.br",
  "lucas.carvalho@brandlegacy.com.br",
];

export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const area = await prisma.area.findUnique({ where: { slug: "eventos" } });
  if (!area) return NextResponse.json({ error: "Área não encontrada." }, { status: 404 });

  const results = [];
  for (const email of EMAILS) {
    const person = await prisma.user.findUnique({ where: { email } });
    if (!person) {
      results.push({ email, status: "user not found" });
      continue;
    }
    const m = await prisma.membership.upsert({
      where: { userId_areaId: { userId: person.id, areaId: area.id } },
      create: { userId: person.id, areaId: area.id, role: "lider", title: "Editor" },
      update: { role: "lider" },
    });
    results.push({ email, status: "promoted to lider", role: m.role });
  }

  return NextResponse.json({ results });
}
