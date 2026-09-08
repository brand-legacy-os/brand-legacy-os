import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";

/**
 * Rota temporária, gated por segredo de infraestrutura (env var
 * ONETIME_ADMIN_SECRET, não uma senha de usuário), pra três ajustes
 * pontuais em produção: (1) garantir Membership em "eventos" pra 5 pessoas
 * específicas; (2) excluir o Renzo (saiu do time); (3) resetar a senha de
 * operacoes@brandlegacy.com.br (login de produção estava travado). Chamada
 * uma única vez via fetch com o header x-onetime-secret, depois removida do
 * repositório junto com a env var.
 */
export async function POST(request: Request) {
  const secret = request.headers.get("x-onetime-secret");
  if (!secret || secret !== process.env.ONETIME_ADMIN_SECRET) {
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

  let requestedPassword: string | null = null;
  try {
    const body = await request.json();
    if (typeof body?.newPassword === "string" && body.newPassword.length >= 8) {
      requestedPassword = body.newPassword;
    }
  } catch {
    // sem corpo JSON — usa a senha gerada
  }
  const newPassword = requestedPassword ?? `BL#Reset${randomBytes(3).toString("hex")}`;
  const passwordHash = await bcrypt.hash(newPassword, 10);
  const marcus = await prisma.user.update({
    where: { email: "operacoes@brandlegacy.com.br" },
    data: { passwordHash },
  });

  return NextResponse.json({
    membershipResults,
    renzoResult,
    passwordReset: { email: marcus.email, newPassword },
  });
}
