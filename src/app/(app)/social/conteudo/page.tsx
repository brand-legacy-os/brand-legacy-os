import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditAreaKpis, canViewArea } from "@/lib/permissions";
import { SocialTabs } from "@/components/social/social-tabs";
import { ContentWeekCell } from "@/components/social/content-week-cell";
import { CONTENT_WEEKDAYS } from "@/lib/social";
import { CultureBanner } from "@/components/dashboard/culture-banner";
import { notFound } from "next/navigation";

export default async function SocialConteudoPage() {
  const user = await requireUser();
  if (!canViewArea(user, "social")) notFound();
  const canEdit = canEditAreaKpis(user, "social");

  const profiles = await prisma.socialProfile.findMany({
    orderBy: { order: "asc" },
    include: { weekPlanCells: true },
  });

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Marca forte não acontece por acaso — se constrói todo dia."
        subtitle="Consistência, autenticidade e presença — cada post é um tijolo na autoridade da marca."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Área
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Social
        </h1>
        <p className="max-w-[62ch] text-[13px] text-ink-soft">
          Modelo de conteúdo por perfil e dia da semana — referência pra
          montar o Calendário, não o calendário em si.
        </p>
      </div>

      <SocialTabs />

      <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
        <h2 className="text-[13px] font-medium text-ink-soft">Introdução</h2>
        <div className="flex flex-col gap-1.5 rounded-(--radius-s) bg-gold-tint p-3.5">
          <p className="text-[12px] font-medium text-gold-ink">
            Variável: Jantar ou microevento — ajustar no calendário conforme demanda
          </p>
          <ul className="flex flex-col gap-1 text-[12px] leading-relaxed text-ink-soft">
            <li>
              <strong className="text-ink">REELS:</strong> resumo de como foi o jantar (teaser)
            </li>
            <li>
              <strong className="text-ink">CARROSSEL:</strong> principais insights sobre o evento
            </li>
            <li>
              <strong className="text-ink">STORIES:</strong> sequência narrativa com CTA intencional
            </li>
          </ul>
        </div>
        <p className="text-[12px] text-ink-faint">
          A tabela abaixo é editável — clique numa célula pra ajustar o
          modelo daquele perfil naquele dia. Use <code>**negrito**</code>,{" "}
          <code>*itálico*</code> e uma linha começando com dois espaços pra
          virar sub-item.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">Tabela semanal por perfil</h2>
        <div className="overflow-x-auto rounded-(--radius-l) border border-border bg-surface">
          <table className="w-full min-w-[1400px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[11px] uppercase tracking-[0.04em] text-ink-faint">
                <th className="sticky left-0 z-10 min-w-[160px] bg-surface px-4 py-3 font-medium">Perfil</th>
                {CONTENT_WEEKDAYS.map((d) => (
                  <th key={d.value} className="border-l border-border px-2 py-3 font-medium">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr key={p.id} className="border-b border-border align-top last:border-b-0">
                  <td className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-[12.5px] font-medium text-ink">
                    {p.name}
                  </td>
                  {CONTENT_WEEKDAYS.map((d) => {
                    const cell = p.weekPlanCells.find((c) => c.weekday === d.value);
                    return (
                      <td key={d.value} className="border-l border-border p-0 align-top">
                        <ContentWeekCell
                          profileId={p.id}
                          weekday={d.value}
                          content={cell?.content ?? ""}
                          canEdit={canEdit}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-ink-faint">
                    Nenhum perfil cadastrado ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
