import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin, isLeaderOf } from "@/lib/permissions";
import { computeRhCadence, pendingLeaderFormalization } from "@/lib/rh";
import { RhCadenceBadges } from "@/components/rh/rh-cadence-badges";
import { CultureBanner } from "@/components/dashboard/culture-banner";

export default async function RhPage() {
  const user = await requireUser();

  const [allUsers, allReviews] = await Promise.all([
    prisma.user.findMany({
      include: { memberships: { include: { area: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.rhReview.findMany({ orderBy: { date: "desc" } }),
  ]);

  const reviewsBySubject = new Map<string, typeof allReviews>();
  for (const r of allReviews) {
    const arr = reviewsBySubject.get(r.subjectId) ?? [];
    arr.push(r);
    reviewsBySubject.set(r.subjectId, arr);
  }

  const now = new Date();
  const admin = isAdmin(user);

  const myTeam = admin
    ? allUsers.filter((u) => u.id !== user.id)
    : allUsers.filter(
        (u) =>
          u.id !== user.id &&
          u.memberships.some((m) => isLeaderOf(user, m.area.slug))
      );

  const myOwnReviews = reviewsBySubject.get(user.id) ?? [];
  const myOwnStatuses = computeRhCadence(myOwnReviews, now);

  return (
    <>
      <CultureBanner
        eyebrow="Cultura Brand Legacy"
        title="Gente que cresce é empresa que cresce."
        subtitle="Feedback honesto e frequente — não só uma vez por ano — é o que transforma potencial em performance de verdade."
      />

      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          RH
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Pessoas
        </h1>
        <p className="max-w-[60ch] text-[13px] text-ink-soft">
          One-on-One mensal, avaliação trimestral e avaliação anual (dezembro).
          O liderado responde a autoavaliação primeiro; o líder formaliza a
          visão dele depois.{" "}
          {admin
            ? "Você vê o RH de toda a empresa."
            : "Você vê sua equipe e seus próprios encontros com seu líder direto."}
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Meus encontros
        </h2>
        <Link
          href={`/rh/${user.id}`}
          className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface p-5 transition-colors hover:border-brand-deep-2"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-deep text-[12px] font-semibold text-gold-soft">
              {user.avatarInitials}
            </span>
            <div className="flex flex-col">
              <span className="text-[13.5px] font-medium text-ink">
                {user.name}
              </span>
              <span className="text-[11.5px] text-ink-faint">{user.title}</span>
            </div>
          </div>
          <RhCadenceBadges statuses={myOwnStatuses} />
        </Link>
      </section>

      {myTeam.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-[13px] font-medium text-ink-soft">
            {admin ? `Toda a empresa (${myTeam.length})` : `Minha equipe (${myTeam.length})`}
          </h2>
          <div className="flex flex-col gap-2.5">
            {myTeam.map((person) => {
              const personReviews = reviewsBySubject.get(person.id) ?? [];
              const statuses = computeRhCadence(personReviews, now);
              const pending = pendingLeaderFormalization(personReviews);
              return (
                <Link
                  key={person.id}
                  href={`/rh/${person.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-(--radius-l) border border-border bg-surface p-4 transition-colors hover:border-brand-deep-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-[11px] font-medium text-ink-soft">
                      {person.avatarInitials}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-ink">
                        {person.name}
                      </span>
                      <span className="text-[11px] text-ink-faint">
                        {person.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {pending.length > 0 && (
                      <span className="rounded-full bg-warning-bg px-2.5 py-1 text-[11.5px] font-medium text-warning">
                        {pending.length} aguardando sua formalização
                      </span>
                    )}
                    <RhCadenceBadges statuses={statuses} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
