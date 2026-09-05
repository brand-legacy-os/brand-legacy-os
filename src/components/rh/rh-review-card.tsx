import {
  RH_TYPE_META,
  RH_CLASSIFICATION_META,
  RH_QUESTIONS_BY_TYPE,
  legacyOneOnOneAnswers,
  legacyLeaderComments,
} from "@/lib/rh";
import { formatDate, formatDateTime, formatCurrency } from "@/lib/format";
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
  const questions = RH_QUESTIONS_BY_TYPE[review.type];
  const selfAnswers = (review.selfAnswers as Record<string, string> | null) ?? legacyOneOnOneAnswers(review);
  const leaderComments = (review.leaderComments as Record<string, string> | null) ?? legacyLeaderComments(review);

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
                <div className="flex flex-col gap-1">
                  <span className="w-fit rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-ink-soft">
                    {RH_CLASSIFICATION_META[review.selfClassification].label}
                  </span>
                  {review.selfClassificationReason && (
                    <p className="text-[12.5px] text-ink-soft">{review.selfClassificationReason}</p>
                  )}
                </div>
              )}
              <div className="flex flex-col gap-2 text-[13px] text-ink-soft">
                {questions.map((q) =>
                  selfAnswers[q.key] ? (
                    <p key={q.key}>
                      <span className="font-medium text-ink">{q.label}: </span>
                      {selfAnswers[q.key]}
                    </p>
                  ) : null
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
              {review.leaderClassificationComment && (
                <p className="text-[13px] text-ink-soft">{review.leaderClassificationComment}</p>
              )}
              <div className="flex flex-col gap-2 text-[13px] text-ink-soft">
                {questions.map((q) =>
                  leaderComments[q.key] ? (
                    <p key={q.key}>
                      <span className="font-medium text-ink">{q.label}: </span>
                      {leaderComments[q.key]}
                    </p>
                  ) : null
                )}
              </div>
              {review.type === "anual" &&
                (review.leaderSalaryHistory ||
                  review.leaderPostReviewSalary !== null ||
                  review.leaderExceptionalBonus !== null ||
                  review.leaderRoleChanged !== null ||
                  review.leaderNextYearRole) && (
                  <div className="flex flex-col gap-1 rounded-(--radius-s) bg-surface-muted p-2.5 text-[12.5px] text-ink-soft">
                    <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-ink-faint">
                      Retorno de remuneração
                    </p>
                    {review.leaderSalaryHistory && (
                      <p>
                        <span className="font-medium text-ink">Histórico (3 anos): </span>
                        {review.leaderSalaryHistory}
                      </p>
                    )}
                    {review.leaderPostReviewSalary !== null && (
                      <p>
                        <span className="font-medium text-ink">Salário pós retorno: </span>
                        {formatCurrency(review.leaderPostReviewSalary)}
                      </p>
                    )}
                    {review.leaderExceptionalBonus !== null && (
                      <p>
                        <span className="font-medium text-ink">Prêmio excepcional: </span>
                        {formatCurrency(review.leaderExceptionalBonus)}
                      </p>
                    )}
                    {review.leaderRoleChanged !== null && (
                      <p>
                        <span className="font-medium text-ink">Recolocação de cargo: </span>
                        {review.leaderRoleChanged ? "Sim" : "Não"}
                      </p>
                    )}
                    {review.leaderNextYearRole && (
                      <p>
                        <span className="font-medium text-ink">Cargo próximo ano: </span>
                        {review.leaderNextYearRole}
                      </p>
                    )}
                  </div>
                )}
              <span className="text-[11px] text-ink-faint">
                formalizado {formatDateTime(review.leaderSubmittedAt)}
              </span>
            </>
          ) : canFormalize ? (
            review.selfSubmittedAt ? (
              <LeaderFeedbackForm review={review} />
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
