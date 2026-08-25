import type {
  PodcastStatus,
  PodcastSource,
  SocialLeadStatus,
  ContentFormat,
  ContentPostStatus,
} from "@prisma/client";

/// Categorias reais do controle interno deles (Notion) — usadas como
/// sugestão no campo "produto/categoria" das tarefas de Social.
export const SOCIAL_TASK_CATEGORIES = [
  "Produto - EAD",
  "Rotina",
  "Produto Mentoria",
  "Produto SAAS",
] as const;

export const PODCAST_STATUS_META: Record<PodcastStatus, { label: string }> = {
  editando: { label: "Editando" },
  gravacao_disponivel: { label: "Gravação disponível" },
  agendado: { label: "Agendado" },
  reagendar: { label: "Reagendar" },
};

export const PODCAST_SOURCE_META: Record<PodcastSource, { label: string }> = {
  dom: { label: "Dom" },
  karina_social_seller: { label: "Karina (Social Seller)" },
};

export const SOCIAL_LEAD_STATUS_META: Record<SocialLeadStatus, { label: string }> = {
  qualificado: { label: "Qualificado" },
  desqualificado: { label: "Desqualificado" },
  reagendando: { label: "Reagendando" },
  sem_resposta: { label: "Sem resposta" },
};

export const CONTENT_FORMAT_META: Record<ContentFormat, { label: string }> = {
  reels: { label: "Reels" },
  stories: { label: "Stories" },
  carrossel: { label: "Carrossel" },
  youtube: { label: "YouTube" },
  post_feed: { label: "Post feed" },
};

export const CONTENT_POST_STATUS_META: Record<ContentPostStatus, { label: string }> = {
  planejado: { label: "Planejado" },
  gravado: { label: "Gravado" },
  editado: { label: "Editado" },
  agendado: { label: "Agendado" },
  publicado: { label: "Publicado" },
};

/// Links de referência reais do time — dashboards, ferramentas e planilhas
/// externas que continuam sendo a fonte oficial (não replicamos os dados
/// aqui, só linkamos).
export const SOCIAL_REFERENCE_LINKS = {
  materialVisual: "https://drive.google.com/drive/folders/1A8N1YIlUaSq8Y8diIVWF2LnGxRXwIfjl?usp=sharing",
  metricasSpreadsheet: "https://docs.google.com/spreadsheets/d/1E1dkReLqtMm6e_40SsyjzoNsmTdu2xj_avjC6qHy88Y/edit?gid=645714597#gid=645714597",
  jornalLegado: "https://brandlegacy-journal.vercel.app/",
  ferramentas: [
    { name: "Epidemic Sound", url: "https://www.epidemicsound.com/pt/music/featured/" },
    { name: "Filmvibes", url: "https://filmvibes.io/" },
    { name: "HypeAuditor", url: "https://www.hypeauditor.com/" },
  ],
};

/// Metodologia semanal de conteúdo, preservada literalmente como o time
/// colou no Notion — não foi decomposta em uma tabela dia-a-dia porque a
/// colagem original tinha ambiguidade real entre colunas (ex.: domingo
/// aparecia como "sem post" numa leitura e "com post" em outra, dependendo
/// de onde a quebra de coluna caía). Melhor mostrar o texto real do que
/// arriscar atribuir conteúdo ao dia errado.
export const WEEKLY_METHODOLOGY_RAW = `SEGUNDA | TERÇA | QUARTA | QUINTA | SEXTA | SÁBADO | DOMINGO

• REELS: depoimento
• STORIES: levantada de mão → [desdobrar a dor / problema do depoimento]

• REELS [collab]: Podcast
• STORIES [podcast]: sequência narrativa

• REELS [manhã - collab]: plano perfeito OU shark
• YouTube: PP ou Shark
• STORIES [reels collab]: sequência com link para YouTube

• CARROSSEL: jornal
    ◦ STORIES: levantada de mão
    ◦ NEWs / COMUNIDADE: desdobrar infos do jornal
• REELS [collab]: collab com sócios (um por semana)

• CARROSSEL [manhã]: depoimento
• REELS [início tarde]: bate bola sócios

• CARROSSEL: DUMP (aprendizados da semana)

—

Semana seguinte (variação):

• CARROSSEL: jornal - "O que aconteceu na semana passada e você não viu"
• REELS: Operação de mentorado | Vira case, prova social e conteúdo para os dois perfis [estratégia Dih]
    ◦ STORIES: levantada de mão

• REELS [collab]: Podcast
• STORIES [podcast]: sequência narrativa

• REELS [manhã - collab]: plano perfeito OU shark
• STORIES [reels collab]: sequência com link para YouTube
• REELS [tarde]: corte da Carol no PP ou Shark
• STORIES [reels tarde]: narrativa para autoridade

• CARROSSEL: polêmica / divisão de opinião (política, finanças…)
• STORIES: levantada de mão
• REELS RP [collab]: Podcast externo ou collab

• REELS: microlearning do curso EAD
    ◦ enquanto não temos, vamos postar cortes da imersão
    ◦ YOUTUBE: postar os microlearnings com link e CTA para nosso curso

• CARROSSEL: DUMP (aprendizados da semana)

• REELS: individual dele no podcast [Derick do podcast tem que nos enviar semanalmente]

—

Outra variação registrada:

• POST FEED [manhã]: Frase compartilhável
• REELS [tarde]: conteúdo mais profundo - Marketing de Influência
• STORIES [tarde]: levantada de mão

• REELS [collab]: Podcast
• STORIES [podcast]: sequência narrativa
• REELS [collab]: bate bola

• REELS [manhã - collab]: plano perfeito OU shark
• STORIES [reels collab]: sequência com link para YouTube
• REELS [tarde]: corte da Carol no PP ou Shark
• STORIES [reels tarde]: narrativa para autoridade

• REELS: conteúdo sobre aprendizados no empreendedorismo [Carol vai produzir]
• STORIES: levantada de mão
• REELS RP [collab]: Podcast externo ou collab

• REELS [collab]: bate bola
• REELS: Operação de mentorado | Vira case, prova social e conteúdo para os dois perfis [estratégia Dih]
    ◦ STORIES: levantada de mão

• REELS: arrume-se comigo OU YAP fala sincera com empreendedoras [Carol vai produzir]

• CARROSSEL: DUMP da semana [Carol vai produzir]

—

CONTEÚDO SAZONAL / VARIÁVEL — Jantar ou microevento (ajustar no calendário conforme demanda):
• REELS: resumo de como foi o jantar (teaser)
• CARROSSEL: principais insights sobre o evento
• STORIES: sequência narrativa com CTA intencional`;
