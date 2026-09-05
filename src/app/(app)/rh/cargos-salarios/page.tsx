import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessSalaryArea, canViewSalaryFor, canManageSalaryRecords } from "@/lib/permissions";
import { formatCompactCurrency } from "@/lib/format";
import { SalaryRecordForm } from "@/components/rh/salary-record-form";
import { SalaryRecordRow } from "@/components/rh/salary-record-row";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function CargosSalariosPage() {
  const user = await requireUser();
  if (!canAccessSalaryArea(user)) notFound();
  const canManage = canManageSalaryRecords(user);

  const [records, allUsers] = await Promise.all([
    prisma.salaryRecord.findMany({
      include: { user: { include: { memberships: { include: { area: true } } } } },
      orderBy: { fullName: "asc" },
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const visible = records.filter((r) =>
    canViewSalaryFor(user, { areaSlugs: r.user.memberships.map((m) => m.area.slug) })
  );

  const byArea = new Map<string, typeof visible>();
  for (const r of visible) {
    const arr = byArea.get(r.areaLabel) ?? [];
    arr.push(r);
    byArea.set(r.areaLabel, arr);
  }
  const groups = [...byArea.entries()].sort(([a], [b]) => a.localeCompare(b));
  const total = visible.reduce((s, r) => s + r.salary, 0);

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Remuneração justa é reconhecimento com transparência."
        subtitle="Informação sensível, acesso restrito — cada líder cuida da própria área com o cuidado que ela merece."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">RH</p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">Cargos e Salários</h1>
        <p className="max-w-[70ch] text-[13px] text-ink-soft">
          Acesso restrito — admin e Financeiro veem toda a empresa; cada líder vê só a
          própria área. Colaboradores não têm acesso a esta tela.
        </p>
        <Link href="/rh" className="w-fit text-[12px] font-medium text-brand hover:underline">
          ← Voltar para RH
        </Link>
      </div>

      {visible.length > 0 && (
        <div className="rounded-(--radius-l) border border-border bg-surface p-4">
          <p className="text-[12px] text-ink-soft">Folha total visível para você</p>
          <p className="tnum font-(family-name:--font-display) text-[22px] text-ink">
            {formatCompactCurrency(total)}
          </p>
        </div>
      )}

      {canManage && <SalaryRecordForm users={allUsers} />}

      <div className="flex flex-col gap-5">
        {groups.map(([areaLabel, rows]) => (
          <section key={areaLabel} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-[13.5px] font-medium text-ink">{areaLabel}</h2>
              <span className="text-[11.5px] text-ink-faint">
                {rows.length} pessoa{rows.length === 1 ? "" : "s"} ·{" "}
                {formatCompactCurrency(rows.reduce((s, r) => s + r.salary, 0))}
              </span>
            </div>
            <div className="rounded-(--radius-l) border border-border bg-surface px-4">
              {rows.map((r) => (
                <SalaryRecordRow
                  key={r.id}
                  record={r}
                  users={allUsers}
                  isLeader={r.user.memberships.some((m) => m.role === "lider")}
                  canManage={canManage}
                />
              ))}
            </div>
          </section>
        ))}
        {groups.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
            {canManage ? "Nenhum cargo cadastrado ainda." : "Nenhum cargo visível para você ainda."}
          </p>
        )}
      </div>
    </>
  );
}
