import type { RhReview, RhClassification } from "@prisma/client";

export const RH_TYPE_META: Record<RhReview["type"], { label: string; cadenceMonths: number }> = {
  one_on_one: { label: "One-on-One", cadenceMonths: 1 },
  trimestral: { label: "Avaliação trimestral", cadenceMonths: 3 },
  anual: { label: "Avaliação anual", cadenceMonths: 12 },
};

export const RH_CLASSIFICATION_META: Record<RhClassification, { label: string }> = {
  projeto_a_validar: { label: "Projeto a validar" },
  potencial: { label: "Potencial" },
  performance: { label: "Performance" },
  potencial_performance: { label: "Potencial Performance" },
};

/** Reviews cujo liderado já respondeu mas o líder ainda não formalizou. */
export function pendingLeaderFormalization(reviews: RhReview[]) {
  return reviews.filter((r) => r.selfSubmittedAt && !r.leaderSubmittedAt);
}

function monthsSince(date: Date, now: Date) {
  return (
    (now.getFullYear() - date.getFullYear()) * 12 +
    (now.getMonth() - date.getMonth()) -
    (now.getDate() < date.getDate() ? 1 : 0)
  );
}

export type RhCadenceStatus = {
  type: RhReview["type"];
  label: string;
  last: RhReview | null;
  overdue: boolean;
  dueNote: string;
};

/**
 * Não há "meta" fabricada aqui — a cadência (mensal/trimestral/anual em
 * dezembro) é a regra combinada com o usuário, e o status é sempre
 * derivado do último RhReview real que existir, nunca de um valor
 * inventado.
 */
export function computeRhCadence(reviews: RhReview[], now: Date): RhCadenceStatus[] {
  const byType = (type: RhReview["type"]) =>
    reviews
      .filter((r) => r.type === type)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

  const oneOnOnes = byType("one_on_one");
  const lastOneOnOne = oneOnOnes[0] ?? null;
  const oneOnOneOverdue = !lastOneOnOne || monthsSince(lastOneOnOne.date, now) >= 1;

  const trimestrais = byType("trimestral");
  const lastTrimestral = trimestrais[0] ?? null;
  const trimestralOverdue = !lastTrimestral || monthsSince(lastTrimestral.date, now) >= 3;

  const anuais = byType("anual");
  const lastAnual = anuais[0] ?? null;
  const doneThisYear = anuais.some((r) => r.date.getFullYear() === now.getFullYear());
  const isDecemberOrLater = now.getMonth() === 11;
  const anualOverdue = isDecemberOrLater && !doneThisYear;

  return [
    {
      type: "one_on_one",
      label: "One-on-One",
      last: lastOneOnOne,
      overdue: oneOnOneOverdue,
      dueNote: lastOneOnOne
        ? oneOnOneOverdue
          ? "Vencido — já passou 1 mês do último"
          : "Em dia"
        : "Nunca feito",
    },
    {
      type: "trimestral",
      label: "Avaliação trimestral",
      last: lastTrimestral,
      overdue: trimestralOverdue,
      dueNote: lastTrimestral
        ? trimestralOverdue
          ? "Vencido — já passou 3 meses do último"
          : "Em dia"
        : "Nunca feito",
    },
    {
      type: "anual",
      label: "Avaliação anual",
      last: lastAnual,
      overdue: anualOverdue,
      dueNote: doneThisYear
        ? `Feita em ${now.getFullYear()}`
        : isDecemberOrLater
          ? "Vencida — é dezembro e ainda não foi feita"
          : "Acontece em dezembro",
    },
  ];
}
