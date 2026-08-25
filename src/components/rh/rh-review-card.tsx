import { RH_TYPE_META, RH_CLASSIFICATION_META } from "@/lib/rh";
import { formatDate, formatDateTime } from "@/lib/format";
import { LeaderFeedbackForm } from "./leader-feedback-form";
import { deleteRhReviewAction } from "@/lib/actions/rh";
import type { RhReview } from "@prisma/client";

export function RhReviewCard({
  review,
  evaluatorName,
  canFormalize,
  canDelete,
}: {
  review: RhReview;
  evaluatorName: string;
  canFormalize: boolean;
  canDelete: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-gold-tint px-2.5 py-0.5 text-[11px] font-medium text-gold-ink">
            {RH_TYPE_META[review.type].label}
          </span>
          <span className="text-[12.5px] text-ink">{formatDate(review.date)}</span>
        </div>
        {canDelete && (
          <form action={deleteRhReviewAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button className="text-[11.5px] font-medium text-critical hover:underline">
              Excluir
            </button>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 border-t border-border pt-3 lg:grid-cols-2">
        {/* Esquerda: autoavaliação do liderado */}
        <div className="flex flex-col gap-2 lg:border-r lg:border-border lg:pr-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
            Autoavaliação do liderado
          </p>
          {review.selfSubmittedAt ? (
            <>
              {review.selfClassification && (
                <span className="w-fit rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                  {RH_CLASSIFICATION_META[review.selfClassification].label}
                </span>
              )}
              <div className="flex flex-col gap-1.5 text-[13px] text-ink-soft">
                <p>
                  <span className="font-medium text-ink">Equilíbrio vida/trabalho: </span>
                  {review.selfWorkLifeBalance}
                </p>
                <p>
                  <span className="font-medium text-ink">
                    Contribuição: {review.selfContributionScore}/10 —{" "}
                  </span>
                  {review.selfContributionReason}
                </p>
                {review.selfHighlights && (
                  <p>
                    <span className="font-medium text-ink">Pontos fortes: </span>
                    {review.selfHighlights}
                  </p>
                )}
                {review.selfImprovements && (
                  <p>
                    <span className="font-medium text-ink">Quer se desenvolver em: </span>
                    {review.selfImprovements}
                  </p>
                )}
                {review.selfFeedbackToLeader && (
                  <p>
                    <span className="font-medium text-ink">Feedback ao líder: </span>
                    {review.selfFeedbackToLeader}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-ink-faint">
                respondido {formatDateTime(review.selfSubmittedAt)}
              </span>
            </>
          ) : (
            <p className="text-[13px] text-ink-faint">
              Aguardando a autoavaliação do liderado.
            </p>
          )}
        </div>

        {/* Direita: formalização do líder */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.05em] text-ink-faint">
            Visão formalizada por {evaluatorName}
          </p>
          {review.leaderSubmittedAt ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {review.leaderClassification && (
                  <span className="w-fit rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                    {RH_CLASSIFICATION_META[review.leaderClassification].label}
                  </span>
                )}
                {review.rating && (
                  <span className="text-[12px] text-ink-faint">nota {review.rating}/5</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5 text-[13px] text-ink-soft">
                {review.highlights && (
                  <p>
                    <span className="font-medium text-ink">Pontos fortes: </span>
                    {review.highlights}
                  </p>
                )}
                {review.improvements && (
                  <p>
                    <span className="font-medium text-ink">Desenvolvimento: </span>
                    {review.improvements}
                  </p>
                )}
                {review.actionItems && (
                  <p>
                    <span className="font-medium text-ink">Combinados: </span>
                    {review.actionItems}
                  </p>
                )}
                {review.notes && (
                  <p>
                    <span className="font-medium text-ink">Observações: </span>
                    {review.notes}
                  </p>
                )}
              </div>
              <span className="text-[11px] text-ink-faint">
                formalizado {formatDateTime(review.leaderSubmittedAt)}
              </span>
            </>
          ) : canFormalize ? (
            review.selfSubmittedAt ? (
              <LeaderFeedbackForm reviewId={review.id} />
            ) : (
              <p className="text-[13px] text-ink-faint">
                Você poderá formalizar sua visão assim que o liderado responder.
              </p>
            )
          ) : (
            <p className="text-[13px] text-ink-faint">
              Ainda não formalizado.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
