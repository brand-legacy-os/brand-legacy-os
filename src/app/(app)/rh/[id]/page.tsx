import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewRhFor, canManageRhFor } from "@/lib/permissions";
import { computeRhCadence } from "@/lib/rh";
import { RhCadenceBadges } from "@/components/rh/rh-cadence-badges";
import { SelfAssessmentForm } from "@/components/rh/self-assessment-form";
import { RhReviewCard } from "@/components/rh/rh-review-card";

export default async function RhSubjectPage({
  params,
}: PageProps<"/rh/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const subject = await prisma.user.findUnique({
    where: { id },
    include: { memberships: { include: { area: true } } },
  });
  if (!subject) notFound();

  const areaSlugs = subject.memberships.map((m) => m.area.slug);
  if (!canViewRhFor(user, { userId: subject.id, areaSlugs })) notFound();

  const canManage = canManageRhFor(user, { areaSlugs });
  const isSelf = user.id === subject.id;

  const reviews = await prisma.rhReview.findMany({
    where: { subjectId: subject.id },
    include: { evaluator: true },
    orderBy: { date: "desc" },
  });

  const statuses = computeRhCadence(reviews, new Date());

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-6">
      <Link
        href="/rh"
        className="w-fit text-[12.5px] font-medium text-ink-soft hover:text-brand-deep"
      >
        ← RH
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-deep text-[14px] font-semibold text-gold-soft">
            {subject.avatarInitials}
          </span>
          <div className="flex flex-col">
            <h1 className="font-(family-name:--font-display) text-[22px] text-ink">
              {subject.name}
            </h1>
            <span className="text-[12.5px] text-ink-faint">{subject.title}</span>
          </div>
        </div>
        <RhCadenceBadges statuses={statuses} />
      </div>

      {isSelf && (
        <SelfAssessmentForm />
      )}
      {!isSelf && !canManage && (
        <p className="text-[12.5px] text-ink-faint">
          Somente {subject.name} pode responder a própria autoavaliação.
        </p>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-[13px] font-medium text-ink-soft">
          Histórico ({reviews.length})
        </h2>
        {reviews.map((r) => (
          <RhReviewCard
            key={r.id}
            review={r}
            evaluatorName={r.evaluator.name}
            canFormalize={canManage}
            canDelete={canManage || r.evaluatorId === user.id || r.subjectId === user.id}
          />
        ))}
        {reviews.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border-strong bg-surface px-4 py-6 text-center text-[13px] text-ink-faint">
            Nenhum encontro registrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
