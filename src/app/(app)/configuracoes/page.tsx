import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function SettingsPage() {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/dashboard");

  const areas = await prisma.area.findMany({
    orderBy: { order: "asc" },
    include: {
      _count: { select: { kpis: true, projects: true, tasks: true } },
      memberships: true,
    },
  });
  const users = await prisma.user.findMany({
    include: { memberships: { include: { area: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Estrutura clara é o que sustenta o crescimento."
        subtitle="Área, papel e responsabilidade bem definidos evitam retrabalho e dão liberdade pra cada um fazer a sua parte."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Administração
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Configurações
        </h1>
        <p className="max-w-[62ch] text-[13px] text-ink-soft">
          Visão geral da estrutura da empresa dentro do Brand Legacy OS.
          Cadastro e edição por aqui (criar áreas, KPIs e papéis direto na
          interface) é o próximo passo — hoje a estrutura é mantida via
          seed/administração de banco.
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Áreas ({areas.length})
        </h2>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Área</th>
                <th className="px-4 py-2.5 font-medium">Pessoas</th>
                <th className="px-4 py-2.5 font-medium">KPIs</th>
                <th className="px-4 py-2.5 font-medium">Projetos</th>
                <th className="px-4 py-2.5 font-medium">Tarefas</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 text-ink">{a.name}</td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">
                    {a.memberships.length}
                  </td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">
                    {a._count.kpis}
                  </td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">
                    {a._count.projects}
                  </td>
                  <td className="tnum px-4 py-2.5 text-ink-soft">
                    {a._count.tasks}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Pessoas ({users.length})
        </h2>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11.5px] text-ink-faint">
                <th className="px-4 py-2.5 font-medium">Nome</th>
                <th className="px-4 py-2.5 font-medium">E-mail</th>
                <th className="px-4 py-2.5 font-medium">Vínculos</th>
                <th className="px-4 py-2.5 font-medium">Papel</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-2.5 text-ink">{u.name}</td>
                  <td className="px-4 py-2.5 text-ink-faint">{u.email}</td>
                  <td className="px-4 py-2.5 text-ink-soft">
                    {u.memberships
                      .map((m) => `${m.area.name} (${m.title})`)
                      .join(" · ")}
                  </td>
                  <td className="px-4 py-2.5">
                    {u.isGlobalAdmin ? (
                      <span className="rounded-full bg-gold-tint px-2 py-0.5 text-[11px] font-medium text-gold-ink">
                        Administrador
                      </span>
                    ) : u.memberships.some((m) => m.role === "lider") ? (
                      <span className="rounded-full bg-positive-bg px-2 py-0.5 text-[11px] font-medium text-positive">
                        Líder
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-ink-soft">
                        Colaborador
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
