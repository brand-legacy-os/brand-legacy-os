import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

const EMAILS = [
  "lucas.carvalho@brandlegacy.com.br",
  "gabriel@brandlegacy.com.br",
  "guilherme.rocha@brandlegacy.com.br",
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
    await prisma.membership.upsert({
      where: { userId_areaId: { userId: person.id, areaId: area.id } },
      create: { userId: person.id, areaId: area.id, role: "colaborador", title: "Convidado" },
      update: {},
    });
    results.push({ email, status: "granted" });
  }

  return NextResponse.json({ results });
}
