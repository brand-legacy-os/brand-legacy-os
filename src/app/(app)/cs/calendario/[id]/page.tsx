import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewCsDepartment } from "@/lib/permissions";
import { AddExperienceForm } from "@/components/cs/add-experience-form";
import { formatDate } from "@/lib/format";

export default async function CsEventDetailPage({
  params,
  searchParams,
}: PageProps<"/cs/calendario/[id]">) {
  const user = await requireUser();
  if (!canViewCsDepartment(user)) notFound();
  const { id } = await params;
  const sp = await searchParams;
  const productFilter = typeof sp.produto === "string" ? sp.produto : "";
  const csFilter = typeof sp.carteira === "string" ? sp.carteira : "";
  const statusFilter = typeof sp.status === "string" ? sp.status : "";
  const presenceFilter = typeof sp.presenca === "string" ? sp.presenca : "";

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      attendees: {
        where: { customerId: { not: null } },
        include: { customer: { include: { cs: true } } },
        orderBy: { name: "asc" },
      },
      experiences: true,
    },
  });
  if (!event) notFound();

  const [csReps, allUsers] = await Promise.all([
    prisma.membership.findMany({ where: { area: { slug: "cs" } }, include: { user: true } }),
    prisma.user.findMany({ orderBy: { name: "asc" } }),
  ]);

  const experienceByCustomer = new Map(event.experiences.map((e) => [e.customerId as string, e]));
  const products = [...new Set(event.attendees.map((a) => a.customer?.product).filter(Boolean))] as string[];

  const filtered = event.attendees.filter((a) => {
    if (!a.customer) return false;
    if (productFilter && a.customer.product !== productFilter) return false;
    if (csFilter && a.customer.csId !== csFilter) return false;
    if (statusFilter === "confirmado" && !a.confirmed) return false;
    if (statusFilter === "convidado" && a.confirmed) return false;
    if (presenceFilter === "presente" && !a.checkedIn) return false;
    if (presenceFilter === "ausente" && a.checkedIn) return false;
    return true;
  });

  const confirmedCount = event.attendees.filter((a) => a.confirmed).length;
  const presentCount = event.attendees.filter((a) => a.checkedIn).length;
  const absentCount = event.attendees.filter((a) => a.confirmed && !a.checkedIn).length;

  return (
    <div className="flex flex-col gap-6">
      <Link href="/cs/calendario" className="w-fit text-[12.5px] font-medium text-ink-soft hover:text-brand-deep">
        ← Calendário de endomarketing
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="w-fit rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-medium text-gold-ink">
            {event.type}
          </span>
          <h1 className="font-(family-name:--font-display) text-[24px] text-ink">{event.name}</h1>
          <p className="text-[12.5px] text-ink-faint">{formatDate(event.startDate)}</p>
        </div>
        <Link href={`/eventos/${event.id}`} className="h-8 rounded-full border border-border bg-surface px-3 text-[12px] font-medium text-brand hover:bg-surface-muted">
          Ver evento completo →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Convidados (mentorados)</p>
          <p className="tnum text-[20px] font-medium text-ink">{event.attendees.length}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Confirmados</p>
          <p className="tnum text-[20px] font-medium text-ink">{confirmedCount}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Presentes</p>
          <p className="tnum text-[20px] font-medium text-positive">{presentCount}</p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[11px] text-ink-faint">Ausentes</p>
          <p className="tnum text-[20px] font-medium text-critical">{absentCount}</p>
        </div>
      </div>

      <form className="flex flex-wrap items-center gap-2" method="get">
        <select name="produto" defaultValue={productFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Todos os produtos</option>
          {products.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select name="carteira" defaultValue={csFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Todos os CS</option>
          {csReps.map((m) => <option key={m.userId} value={m.userId}>{m.user.name}</option>)}
        </select>
        <select name="status" defaultValue={statusFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Confirmado ou não</option>
          <option value="confirmado">Confirmados</option>
          <option value="convidado">Só convidados</option>
        </select>
        <select name="presenca" defaultValue={presenceFilter} className="h-9 rounded-full border border-border bg-surface px-3.5 text-[12.5px] text-ink-soft outline-none">
          <option value="">Presença</option>
          <option value="presente">Presentes</option>
          <option value="ausente">Ausentes</option>
        </select>
        <button type="submit" className="h-9 rounded-full bg-surface-muted px-4 text-[12.5px] font-medium text-ink-soft hover:bg-border-strong/40">
          Filtrar
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {filtered.map((a) => {
          const experience = a.customerId ? experienceByCustomer.get(a.customerId) : undefined;
          return (
            <div key={a.id} className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-col">
                  <Link href={`/cs/mentorados/${a.customerId}`} className="text-[13px] font-medium text-ink hover:text-brand-deep hover:underline">
                    {a.name}
                  </Link>
                  <span className="text-[11.5px] text-ink-faint">
                    {a.customer?.product} · CS: {a.customer?.cs.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${a.confirmed ? "bg-positive-bg text-positive" : "bg-surface-muted text-ink-faint"}`}>
                    {a.confirmed ? "Confirmado" : "Convidado"}
                  </span>
                  <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${a.checkedIn ? "bg-positive-bg text-positive" : "bg-warning-bg text-warning"}`}>
                    {a.checkedIn ? "Presente" : "Ausente"}
                  </span>
                </div>
              </div>
              {experience ? (
                <div className="rounded-(--radius-s) bg-surface-muted p-2.5 text-[12px] text-ink-soft">
                  Experiência já registrada {experience.score !== null ? `· nota ${experience.score}/10` : ""}
                  {experience.needsFollowUp && !experience.followUpDone && (
                    <span className="ml-2 rounded-full bg-warning-bg px-2 py-0.5 text-[10.5px] font-medium text-warning">
                      Follow-up pendente
                    </span>
                  )}
                </div>
              ) : (
                a.customerId && (
                  <AddExperienceForm customerId={a.customerId} events={[{ id: event.id, name: event.name }]} users={allUsers} />
                )
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
            Nenhum mentorado encontrado com esses filtros.
          </p>
        )}
      </div>
    </div>
  );
}
