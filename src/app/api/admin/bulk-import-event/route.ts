import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/**
 * Endpoint temporário de uso único — importa dados reais (confirmados,
 * orçamento, jantar, comunicação) de um evento a partir da planilha oficial,
 * direto pro banco de produção, sem passar PII pelo histórico do git.
 * Remover depois de usado (ver commit que introduziu esta rota).
 */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  const eventId = new URL(request.url).searchParams.get("eventId");
  if (!eventId) return NextResponse.json({ error: "eventId obrigatório." }, { status: 400 });

  const [attendees, budgetLines, dinnerGuests, commsItems] = await Promise.all([
    prisma.eventAttendee.count({ where: { eventId } }),
    prisma.eventBudgetLine.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } }),
    prisma.eventDinnerGuest.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } }),
    prisma.eventCommsItem.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } }),
  ]);

  return NextResponse.json({ attendees, budgetLines, dinnerGuests, commsItems });
}

/**
 * Reverte dinnerGuests/commsItems adicionados pelo POST acima — o evento já
 * tinha esses dados reais lançados direto pelo time; só os confirmados
 * estavam faltando. Não mexe em budgetLines (dado financeiro) nem em
 * attendees (é o que precisava ficar). Escopado pelo prefixo de id do lote
 * (cuid gerado localmente nesta importação, não colide com dado real).
 */
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }
  const body = await request.json();
  const { dinnerGuestIds, commsItemIds } = body as { dinnerGuestIds: string[]; commsItemIds: string[] };

  const [dinnerGuests, commsItems] = await Promise.all([
    prisma.eventDinnerGuest.deleteMany({ where: { id: { in: dinnerGuestIds ?? [] } } }),
    prisma.eventCommsItem.deleteMany({ where: { id: { in: commsItemIds ?? [] } } }),
  ]);

  return NextResponse.json({ dinnerGuests: dinnerGuests.count, commsItems: commsItems.count });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await request.json();
  const { eventId, attendees, budgetLines, dinnerGuests, commsItems } = body as {
    eventId: string;
    attendees: Record<string, unknown>[];
    budgetLines: Record<string, unknown>[];
    dinnerGuests: Record<string, unknown>[];
    commsItems: Record<string, unknown>[];
  };

  if (!eventId) {
    return NextResponse.json({ error: "eventId obrigatório." }, { status: 400 });
  }

  const existing = await prisma.eventAttendee.count({ where: { eventId } });
  if (existing > 0) {
    return NextResponse.json(
      { error: `Este evento já tem ${existing} confirmados — importação já rodou, abortando pra não duplicar.` },
      { status: 409 }
    );
  }

  const strip = (rows: Record<string, unknown>[]) =>
    rows.map(({ id, createdAt, ...rest }) => rest);

  const result = await prisma.$transaction([
    prisma.eventAttendee.createMany({ data: strip(attendees) as never }),
    prisma.eventBudgetLine.createMany({ data: strip(budgetLines) as never }),
    prisma.eventDinnerGuest.createMany({ data: strip(dinnerGuests) as never }),
    prisma.eventCommsItem.createMany({
      data: strip(commsItems).map((c) => ({ ...c, date: new Date(c.date as string) })) as never,
    }),
  ]);

  return NextResponse.json({
    attendees: result[0].count,
    budgetLines: result[1].count,
    dinnerGuests: result[2].count,
    commsItems: result[3].count,
  });
}
