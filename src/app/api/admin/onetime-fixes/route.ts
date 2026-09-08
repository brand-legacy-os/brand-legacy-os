import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";

/**
 * Rota temporária, admin-gated, para dois ajustes pontuais em produção:
 * (1) garantir Membership em "eventos" pra 5 pessoas específicas; (2)
 * excluir o Renzo (saiu do time). Chamada uma única vez via fetch
 * autenticado, depois removida do repositório.
 */
export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const eventosArea = await prisma.area.findUnique({ where: { slug: "eventos" } });
  if (!eventosArea) {
    return NextResponse.json({ error: "Área 'eventos' não encontrada." }, { status: 500 });
  }

  const emails = [
    "karina.carvalho@brandlegacy.com.br",
    "camila.leite@brandlegacy.com.br",
    "alessandra.siqueira@brandlegacy.com.br",
    "lara.pujalte@brandlegacy.com.br",
    "igor.luis@brandlegacy.com.br",
  ];

  const membershipResults: Record<string, string> = {};
  for (const email of emails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (!u) {
      membershipResults[email] = "MISSING_USER";
      continue;
    }
    await prisma.membership.upsert({
      where: { userId_areaId: { userId: u.id, areaId: eventosArea.id } },
      create: { userId: u.id, areaId: eventosArea.id, role: "colaborador", title: "Convidado" },
      update: {},
    });
    membershipResults[email] = "OK";
  }

  const renzo = await prisma.user.findUnique({ where: { email: "renzo.pagio@brandlegacy.com.br" } });
  let renzoResult = "NOT_FOUND";
  if (renzo) {
    await prisma.user.delete({ where: { id: renzo.id } });
    renzoResult = "DELETED";
  }

  return NextResponse.json({ membershipResults, renzoResult });
}
