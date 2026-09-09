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

  const attendees = await prisma.eventAttendee.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, category: true, ticketType: true, empresa: true, email: true, phone: true,
      cpfRg: true, revenueRange: true, instagram: true, createdAt: true, inDinner: true,
    },
  });

  const dinnerGuests = await prisma.eventDinnerGuest.findMany({
    where: { eventId: event.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, category: true, empresa: true, phone: true, email: true, attendeeId: true, createdAt: true },
  });

  return NextResponse.json({ eventId: event.id, attendees, dinnerGuests });
}
