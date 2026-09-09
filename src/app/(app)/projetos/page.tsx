import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { visibleAreaSlugs } from "@/lib/permissions";
import { formatDate } from "@/lib/format";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { ProjetosTabs } from "@/components/projetos/projetos-tabs";
import { StatTile } from "@/components/dashboard/stat-tile";
import { DonutChart } from "@/components/charts/donut-chart";

export default async function ProjetosDashboardPage() {
  const user = await requireUser();
  const visible = visibleAreaSlugs(user);

  const areas = await prisma.area.findMany({
    where: visible === "all" ? undefined : { slug: { in: visible } },
    orderBy: { order: "asc" },
    include: {
      projects: { include: { owner: true } },
      tasks: { include: { assignee: true } },
    },
  });

  const now = new Date();
  const in7d = new Date(now.getTime() + 7 * 86400000);
  const staleThreshold = new Date(now.getTime() - 5 * 86400000);

  const areaStats = areas.map((a) => ({
    slug: a.slug,
    name: a.name,
    total: a.tasks.length,
    risco: a.tasks.filter((t) => t.status === "atencao").length,
    atrasadas: a.tasks.filter((t) => t.status === "atrasada").length,
  }));

  const totalTasks = areaStats.reduce((s, a) => s + a.total, 0);
  const totalRisco = areaStats.reduce((s, a) => s + a.risco, 0);
  const totalAtrasadas = areaStats.reduce((s, a) => s + a.atrasadas, 0);

  const tasksByAreaData = areaStats
    .filter((a) => a.total > 0)
    .map((a) => ({ label: a.name, value: a.total }));

  const allTasks = areas.flatMap((a) =>
    a.tasks.map((t) => ({ ...t, areaName: a.name, areaSlug: a.slug }))
  );
  const allProjects = areas.flatMap((a) =>
    a.projects.map((p) => ({ ...p, areaName: a.name, areaSlug: a.slug }))
  );

  const upcomingDeadlines = allTasks
    .filter((t) => t.deadline <= in7d && !["concluida", "cancelada"].includes(t.status))
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());

  const staleProjects = allProjects.filter(
    (p) => p.updatedAt < staleThreshold && p.status !== "concluido"
  );

  function groupByArea<T extends { areaSlug: string; areaName: string }>(items: T[]) {
    const map = new Map<string, { areaName: string; items: T[] }>();
    for (const item of items) {
      const entry = map.get(item.areaSlug) ?? { areaName: item.areaName, items: [] };
      entry.items.push(item);
      map.set(item.areaSlug, entry);
    }
    return [...map.entries()];
  }

  const deadlinesByArea = groupByArea(upcomingDeadlines);
  const staleByArea = groupByArea(staleProjects);

  // Clientes sem atualização — carteira ativa (inclui em risco/pausado, não
  // cancelado) sem contato registrado há mais de 5 dias e/ou sem nenhuma
  // interação lançada ainda. Mesmo limiar de 5 dias já usado pra projetos
  // parados nesta página, pra manter o critério consistente.
  const canSeeCsSection = visible === "all" || visible.includes("cs");
  const staleCustomers = canSeeCsSection
    ? await prisma.customer
        .findMany({
          where: { status: { in: ["ativo", "em_risco", "pausado"] } },
          include: { cs: true, _count: { select: { interactions: true } } },
        })
        .then((rows) =>
          rows
            .filter((c) => c._count.interactions === 0 || !c.lastContactAt || c.lastContactAt < staleThreshold)
            .sort((a, b) => (a.lastContactAt?.getTime() ?? 0) - (b.lastContactAt?.getTime() ?? 0))
        )
    : [];
  const staleCustomersByCs = (() => {
    const map = new Map<string, { csName: string; items: typeof staleCustomers }>();
    for (const c of staleCustomers) {
      const entry = map.get(c.csId) ?? { csName: c.cs.name, items: [] };
      entry.items.push(c);
      map.set(c.csId, entry);
    }
    return [...map.entries()];
  })();

  // Áreas com módulo próprio têm sua própria página de tarefas; as demais
  // usam a seção "Tarefas" embutida na página genérica da área (com âncora,
  // pra já abrir direto nela em vez do topo da página).
  function areaTasksHref(slug: string) {
    if (slug === "social") return "/social/tarefas";
    if (slug === "cs") return "/cs/tarefas";
    return `/areas/${slug}#tarefas`;
  }

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Projeto sem cobrança vira intenção, não entrega."
        subtitle="Acompanhar de perto não é desconfiar do time — é garantir que cada prazo combinado vire resultado real."
      />

      <ProjetosTabs />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Operações
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Dashboard
        </h1>
        <p className="text-[13px] text-ink-soft">
          Visão de acompanhamento e cobrança de execução, para {user.name}.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatTile label="Tarefas totais" value={String(totalTasks)} />
        <StatTile label="Em risco" value={String(totalRisco)} />
        <StatTile label="Atrasadas" value={String(totalAtrasadas)} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">Tarefas por área</h2>
          <div className="flex flex-col">
            {areaStats.map((a) => (
              <Link
                key={a.slug}
                href={areaTasksHref(a.slug)}
                className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0 hover:bg-surface-muted"
              >
                <span className="text-[13px] text-ink">{a.name}</span>
                <span className="flex items-center gap-3 text-[11.5px] text-ink-faint">
                  <span className="tnum">{a.total} total</span>
                  <span className="tnum text-warning">{a.risco} em risco</span>
                  <span className="tnum text-critical">{a.atrasadas} atrasadas</span>
                </span>
              </Link>
            ))}
            {areaStats.length === 0 && (
              <p className="py-3 text-[13px] text-ink-faint">Nenhuma área visível.</p>
            )}
          </div>
        </section>

        {tasksByAreaData.length > 1 && (
          <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
            <h2 className="text-[13px] font-medium text-ink-soft">Atividades por área</h2>
            <DonutChart
              data={tasksByAreaData}
              formatValue={(v) => `${v}`}
              centerLabel="tarefas"
              ariaLabel="Distribuição de tarefas por área"
            />
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Deadlines próximos (7 dias) ({upcomingDeadlines.length})
          </h2>
          <div className="flex flex-col gap-3">
            {deadlinesByArea.map(([slug, { areaName, items }]) => (
              <div key={slug} className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">
                  {areaName}
                </span>
                {items.map((t) => (
                  <Link
                    key={t.id}
                    href={areaTasksHref(t.areaSlug)}
                    className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0 hover:bg-surface-muted"
                  >
                    <div className="flex flex-col">
                      <span className="text-[13px] text-ink">{t.title}</span>
                      <span className="text-[11.5px] text-ink-faint">{t.assignee.name}</span>
                    </div>
                    <span className="tnum text-[12.5px] text-ink-soft">
                      {formatDate(t.deadline)}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
            {upcomingDeadlines.length === 0 && (
              <p className="py-3 text-[13px] text-ink-faint">
                Nada vencendo nos próximos 7 dias.
              </p>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <h2 className="text-[13px] font-medium text-ink-soft">
            Atividades sem atualização (5+ dias)
          </h2>
          <div className="flex flex-col gap-3">
            {staleByArea.map(([slug, { areaName, items }]) => (
              <div key={slug} className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">
                  {areaName}
                </span>
                {items.map((p) => (
                  <Link
                    key={p.id}
                    href={`/areas/${p.areaSlug}`}
                    className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0 hover:bg-surface-muted"
                  >
                    <div className="flex flex-col">
                      <span className="text-[13px] text-ink">{p.name}</span>
                      <span className="text-[11.5px] text-ink-faint">{p.owner.name}</span>
                    </div>
                    <span className="tnum text-[12.5px] text-critical">
                      desde {formatDate(p.updatedAt)}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
            {staleProjects.length === 0 && (
              <p className="py-3 text-[13px] text-ink-faint">
                Todos os projetos foram atualizados recentemente.
              </p>
            )}
          </div>
        </section>
      </div>

      {canSeeCsSection && (
        <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-[13px] font-medium text-ink-soft">
              Clientes sem atualização ({staleCustomers.length})
            </h2>
            <p className="text-[11.5px] text-ink-faint">
              Carteira ativa sem contato há mais de 5 dias e/ou sem nenhuma interação registrada ainda.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {staleCustomersByCs.map(([csId, { csName, items }]) => (
              <div key={csId} className="flex flex-col">
                <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">{csName}</span>
                {items.map((c) => (
                  <Link
                    key={c.id}
                    href={`/cs/mentorados/${c.id}`}
                    className="flex items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0 hover:bg-surface-muted"
                  >
                    <div className="flex flex-col">
                      <span className="text-[13px] text-ink">{c.name}</span>
                      <span className="text-[11.5px] text-ink-faint">{c.company ?? "—"}</span>
                    </div>
                    <span className="tnum text-[12.5px] text-critical">
                      {c.lastContactAt ? `desde ${formatDate(c.lastContactAt)}` : "nunca contatado"}
                    </span>
                  </Link>
                ))}
              </div>
            ))}
            {staleCustomers.length === 0 && (
              <p className="py-3 text-[13px] text-ink-faint">Toda a carteira ativa está com contato em dia.</p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
