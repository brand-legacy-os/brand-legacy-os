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

/** Explicação de cada quadrante — mostrada num aviso oculto (recolhido por
 * padrão) junto do seletor de classificação, em toda autoavaliação. */
export const RH_CLASSIFICATION_QUADRANTS: Record<RhClassification, string> = {
  projeto_a_validar: "Não tem nem comportamento nem resultados.",
  potencial: "Apresenta comportamento, mas faltam resultados.",
  performance: "Tem resultados, mas falta comportamento.",
  potencial_performance: "Tem comportamentos e resultados.",
};

export type RhQuestion = { key: string; label: string; kind: "textarea" | "number" };

/**
 * Perguntas da autoavaliação, por tipo de encontro — a classificação (+
 * porquê) é comum aos três tipos e fica fora desta lista (tem campo
 * dedicado no schema: selfClassification/selfClassificationReason).
 * Toda pergunta aqui é obrigatória no formulário.
 */
export const RH_QUESTIONS_BY_TYPE: Record<RhReview["type"], RhQuestion[]> = {
  one_on_one: [
    { key: "workLifeBalance", label: "Existe equilíbrio entre a vida pessoal e profissional?", kind: "textarea" },
    { key: "contributionScore", label: "De 0 a 10, como você avalia sua contribuição para o time?", kind: "number" },
    { key: "contributionReason", label: "Por quê?", kind: "textarea" },
    { key: "highlights", label: "Seus pontos fortes no período", kind: "textarea" },
    { key: "improvements", label: "Onde você deve se desenvolver", kind: "textarea" },
    { key: "feedbackToLeader", label: "Deixe um feedback ao seu líder", kind: "textarea" },
  ],
  trimestral: [
    { key: "quarterSummary", label: "Como foi o meu trimestre?", kind: "textarea" },
    { key: "challenges", label: "Dificuldades, desafios e barreiras", kind: "textarea" },
    { key: "careerGoal1to2", label: "Projeto profissional — cargo esperado em 1-2 anos e por quê", kind: "textarea" },
    { key: "careerGoal3to4", label: "Projeto profissional — cargo esperado em 3-4 anos e por quê", kind: "textarea" },
    { key: "careerGoal5to6", label: "Projeto profissional — cargo esperado em 5-6 anos e por quê", kind: "textarea" },
    { key: "projectStrength", label: "Sobre meu projeto — principal força para concretização", kind: "textarea" },
    { key: "projectChallenge", label: "Sobre meu projeto — principal desafio", kind: "textarea" },
  ],
  anual: [
    {
      key: "bestMoments",
      label:
        "Quais foram os momentos em que me senti melhor e que me deram mais energia? (em minhas atribuições, com a equipe, com minha missão)",
      kind: "textarea",
    },
    {
      key: "hardMoments",
      label:
        "Quais foram os momentos nos quais tive mais dificuldade e que me tiraram mais energia? Como reagi e como quero reagir no futuro?",
      kind: "textarea",
    },
    {
      key: "learnings",
      label: "Ao viver esses momentos durante o ano, o que aprendi e que vai me ajudar no futuro?",
      kind: "textarea",
    },
    {
      key: "yearDeveloped",
      label:
        "Minhas atribuições — o que você desenvolveu esse ano? No que evoluiu? Cite situações e exemplos concretos",
      kind: "textarea",
    },
    { key: "yearToImprove", label: "Minhas atribuições — o que preciso melhorar", kind: "textarea" },
    {
      key: "nextYearTargetRole",
      label: "Meu projeto para o próximo ano — 1) Qual cargo você quer chegar (curto, médio e longo prazo)",
      kind: "textarea",
    },
    { key: "nextYearCurrentState", label: "2) Qual é o seu estado em relação ao ponto que quer chegar?", kind: "textarea" },
    { key: "nextYearActions", label: "3) O que você pode fazer para alcançar esse objetivo?", kind: "textarea" },
    { key: "nextYearSteps", label: "4) Quais passos você precisa trilhar para alcançar?", kind: "textarea" },
    { key: "nextYearLeaderSupport", label: "5) O que você espera do seu líder para alcançar esse objetivo?", kind: "textarea" },
    {
      key: "nextYearRealizationsAndDifficulties",
      label: "6) O que este projeto lhe trará de realizações e quais serão as dificuldades que você pode se deparar?",
      kind: "textarea",
    },
    { key: "nextYearAlternativePlan", label: "7) Você tem algum plano alternativo de projeto?", kind: "textarea" },
  ],
};

/** Extrai as respostas antigas (campos dedicados, pré-selfAnswers) de uma
 * review one_on_one legada pro mesmo formato {chave: valor} — só pra exibir
 * reviews criadas antes desta mudança, que não têm selfAnswers preenchido. */
export function legacyOneOnOneAnswers(review: RhReview): Record<string, string> {
  const answers: Record<string, string> = {};
  if (review.selfWorkLifeBalance) answers.workLifeBalance = review.selfWorkLifeBalance;
  if (review.selfContributionScore !== null) answers.contributionScore = String(review.selfContributionScore);
  if (review.selfContributionReason) answers.contributionReason = review.selfContributionReason;
  if (review.selfHighlights) answers.highlights = review.selfHighlights;
  if (review.selfImprovements) answers.improvements = review.selfImprovements;
  if (review.selfFeedbackToLeader) answers.feedbackToLeader = review.selfFeedbackToLeader;
  return answers;
}

/** Idem, pro lado do líder (highlights/improvements/actionItems/notes). */
export function legacyLeaderComments(review: RhReview): Record<string, string> {
  const comments: Record<string, string> = {};
  if (review.highlights) comments.highlights = review.highlights;
  if (review.improvements) comments.improvements = review.improvements;
  if (review.actionItems) comments.actionItems = review.actionItems;
  if (review.notes) comments.notes = review.notes;
  return comments;
}

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
