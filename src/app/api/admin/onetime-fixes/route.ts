import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Rota temporária, gated por segredo de infraestrutura (env var
 * ONETIME_ADMIN_SECRET, não uma senha de usuário) — mesmo padrão já usado
 * antes nesse repo. Faz dois ajustes pontuais: (1) backfill de presença —
 * quem já tinha o campo geral "Presente" marcado antes da presença diária
 * existir passa a contar como presente no 1º dia do evento em que estava
 * inscrito, em todos os eventos; (2) opcionalmente, se o corpo da
 * requisição trouxer { eventId, referrals }, importa essa lista de
 * indicações pro evento indicado. Chamada uma única vez via fetch com o
 * header x-onetime-secret, depois removida do repositório junto com a env
 * var.
 */
function dateOnly(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

type ReferralInput = {
  referrerName?: string | null;
  referrerEmpresa?: string | null;
  referrerWhatsapp?: string | null;
  referredName: string;
  referredEmpresa?: string | null;
  referredInstagram?: string | null;
  referredWhatsapp?: string | null;
};

export async function POST(request: Request) {
  const secret = request.headers.get("x-onetime-secret");
  if (!secret || secret !== process.env.ONETIME_ADMIN_SECRET) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  let referralsImported = 0;
  try {
    const body = (await request.json()) as { eventId?: string; referrals?: ReferralInput[] };
    if (body?.eventId && Array.isArray(body.referrals)) {
      for (const r of body.referrals) {
        await prisma.eventReferral.create({
          data: {
            eventId: body.eventId,
            referrerName: r.referrerName ?? null,
            referrerEmpresa: r.referrerEmpresa ?? null,
            referrerWhatsapp: r.referrerWhatsapp ?? null,
            referredName: r.referredName,
            referredEmpresa: r.referredEmpresa ?? null,
            referredInstagram: r.referredInstagram ?? null,
            referredWhatsapp: r.referredWhatsapp ?? null,
          },
        });
        referralsImported++;
      }
    }
  } catch {
    // sem corpo JSON — só roda o backfill de presença abaixo
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

  return NextResponse.json({ created, results, referralsImported });
}
