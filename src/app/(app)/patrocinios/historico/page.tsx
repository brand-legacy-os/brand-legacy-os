import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewSponsors } from "@/lib/permissions";
import { formatCompactCurrency } from "@/lib/format";
import { StatusPill, type Tone } from "@/components/ui/status-pill";
import { PatrociniosTabs } from "@/components/patrocinios/patrocinios-tabs";

const STATUS_TONE: Record<string, Tone> = {
  Pago: "positive",
  "A vencer": "neutral",
  "Em negociação": "warning",
  "Em atraso": "critical",
};

export default async function PatrociniosHistoricoPage() {
  const user = await requireUser();
  if (!canViewSponsors(user)) notFound();

  const sponsorships = await prisma.sponsorship.findMany({
    include: { event: true },
    orderBy: [{ dueDate: "asc" }],
  });

  const totalPlanned = sponsorships.reduce((s, r) => s + (r.plannedValue ?? 0), 0);
  const totalPaid = sponsorships.reduce((s, r) => s + (r.paidValue ?? 0), 0);
  const totalOpen = sponsorships
    .filter((r) => r.status !== "Pago")
    .reduce((s, r) => s + (r.plannedValue ?? 0), 0);

  const byMonth = new Map<string, typeof sponsorships>();
  for (const s of sponsorships) {
    const key = s.cashMonth || s.competencia || "Sem competência";
    byMonth.set(key, [...(byMonth.get(key) ?? []), s]);
  }
  const months = [...byMonth.keys()].sort();

  const bySponsor = new Map<string, { planned: number; paid: number; count: number }>();
  for (const s of sponsorships) {
    const cur = bySponsor.get(s.sponsorName) ?? { planned: 0, paid: 0, count: 0 };
    cur.planned += s.plannedValue ?? 0;
    cur.paid += s.paidValue ?? 0;
    cur.count += 1;
    bySponsor.set(s.sponsorName, cur);
  }
  const topSponsors = [...bySponsor.entries()]
    .sort((a, b) => b[1].paid - a[1].paid)
    .slice(0, 8);

  return (
    <>
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Patrocínios
        </h1>
      </div>

      <PatrociniosTabs />

      <p className="max-w-[72ch] text-[13px] text-ink-soft">
        Histórico real de patrocínios (Abril/2025 – hoje), importado direto da
        planilha do time — só leitura, preservado como referência. Novos
        patrocínios vivem na aba Dashboard/Base de patrocinadores.
      </p>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Total contratado (histórico)</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-ink">
            {formatCompactCurrency(totalPlanned)}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Total recebido</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-positive">
            {formatCompactCurrency(totalPaid)}
          </p>
        </div>
        <div className="rounded-(--radius-l) border border-border bg-surface p-5">
          <p className="text-[12px] text-ink-soft">Em aberto (não pago)</p>
          <p className="tnum font-(family-name:--font-display) text-[24px] text-warning">
            {formatCompactCurrency(totalOpen)}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">Maiores patrocinadores (histórico)</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {topSponsors.map(([name, v]) => (
            <div key={name} className="flex items-center justify-between rounded-(--radius-s) bg-surface-muted px-3 py-2">
              <div className="flex flex-col">
                <span className="text-[12.5px] font-medium text-ink">{name}</span>
                <span className="text-[11px] text-ink-faint">{v.count} contrato(s)</span>
              </div>
              <span className="tnum text-[13px] font-medium text-ink">{formatCompactCurrency(v.paid)}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[14px] font-medium text-ink">Histórico completo por competência</h2>
        {months.map((month) => {
          const rows = byMonth.get(month) ?? [];
          const monthPlanned = rows.reduce((s, r) => s + (r.plannedValue ?? 0), 0);
          const monthPaid = rows.reduce((s, r) => s + (r.paidValue ?? 0), 0);
          return (
            <div key={month} className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                <span className="text-[12.5px] font-medium text-ink">{month}</span>
                <span className="tnum text-[12px] text-ink-faint">
                  {formatCompactCurrency(monthPaid)} / {formatCompactCurrency(monthPlanned)}
                </span>
              </div>
              <table className="w-full min-w-[820px] border-collapse text-[12.5px]">
                <thead>
                  <tr className="border-b border-border text-left text-[10.5px] uppercase tracking-[0.04em] text-ink-faint">
                    <th className="px-3 py-2 font-medium">Patrocinador</th>
                    <th className="px-3 py-2 font-medium">Categoria</th>
                    <th className="px-3 py-2 font-medium">Evento vinculado</th>
                    <th className="px-3 py-2 font-medium">Previsto</th>
                    <th className="px-3 py-2 font-medium">Pago</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-b-0 hover:bg-surface-muted">
                      <td className="px-3 py-2 text-ink">{r.sponsorName}</td>
                      <td className="px-3 py-2 text-ink-soft">{r.category ?? "—"}</td>
                      <td className="px-3 py-2">
                        {r.event ? (
                          <Link href={`/eventos/${r.event.id}`} className="font-medium text-brand hover:underline">
                            {r.event.name}
                          </Link>
                        ) : (
                          <span className="text-ink-faint">—</span>
                        )}
                      </td>
                      <td className="tnum px-3 py-2 text-ink-soft">
                        {r.plannedValue !== null ? formatCompactCurrency(r.plannedValue) : "—"}
                      </td>
                      <td className="tnum px-3 py-2 text-ink-soft">
                        {r.paidValue !== null ? formatCompactCurrency(r.paidValue) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {r.status && (
                          <StatusPill label={r.status} tone={STATUS_TONE[r.status] ?? "neutral"} />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })}
        {sponsorships.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
            Nenhum patrocínio importado ainda.
          </p>
        )}
      </section>
    </>
  );
}
