import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Rota temporária, gated por segredo de infraestrutura (env var
 * ONETIME_ADMIN_SECRET, não uma senha de usuário) — mesmo padrão já usado
 * antes nesse repo. Faz um único ajuste pontual: quem já tinha o campo
 * geral "Presente" marcado antes da presença diária existir passa a contar
 * como presente no 1º dia do evento em que estava inscrito, em todos os
 * eventos. Chamada uma única vez via fetch com o header x-onetime-secret,
 * depois removida do repositório junto com a env var.
 */
function dateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export async function POST(request: Request) {
  const secret = request.headers.get("x-onetime-secret");
  if (!secret || secret !== process.env.ONETIME_ADMIN_SECRET) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const events = await prisma.event.findMany({
    where: { attendees: { some: { checkedIn: true } } },
    select: { id: true, name: true, startDate: true },
  });

  let created = 0;
  const results: Record<string, number> = {};
  for (const event of events) {
    const day1 = dateOnly(event.startDate);
    const attendees = await prisma.eventAttendee.findMany({
      where: { eventId: event.id, checkedIn: true },
      select: { id: true },
    });
    let eventCreated = 0;
    for (const attendee of attendees) {
      const existing = await prisma.eventAttendeeCheckin.findUnique({
        where: { attendeeId_date: { attendeeId: attendee.id, date: day1 } },
      });
      if (!existing) {
        await prisma.eventAttendeeCheckin.create({
          data: { attendeeId: attendee.id, date: day1, present: true },
        });
        created++;
        eventCreated++;
      }
    }
    results[event.name] = eventCreated;
  }

  return NextResponse.json({ created, results });
}
