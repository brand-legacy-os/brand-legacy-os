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
  em_conversa: { label: "Em conversa" },
  entrevista_marcada: { label: "Entrevista marcada" },
  entrevista_reagendando: { label: "Entrevista sendo reagendada" },
  esperando_material: { label: "Esperando material" },
  material_em_edicao: { label: "Material em edição" },
  episodio_agendado: { label: "Episódio agendado" },
  episodio_postado: { label: "Episódio postado" },
};

export const PODCAST_SOURCE_META: Record<PodcastSource, { label: string }> = {
  dom: { label: "Dom" },
  karina_social_seller: { label: "Social Seller" },
  carol: { label: "Carol" },
  outro: { label: "Outros" },
};

export const SOCIAL_LEAD_STATUS_META: Record<SocialLeadStatus, { label: string }> = {
  qualificado: { label: "Qualificado" },
  desqualificado: { label: "Desqualificado" },
  reagendando: { label: "Reagendando" },
  sem_resposta: { label: "Sem resposta" },
};

/// Produtos vendidos via Social Selling — texto livre no banco (não enum),
/// mesmo padrão de PRODUCTS em src/lib/products.ts.
export const SOCIAL_SALE_PRODUCTS = [
  "Plataforma EAD",
  "Axoly Brand",
  "Cadeiras VIP Imersão",
  "Cadeiras Gold",
  "Club",
  "Tração",
  "Master",
] as const;

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
  agendaAnual: "https://docs.google.com/spreadsheets/d/1synMgfT43M9T93tWx_9HLfmyVido_tTK4PWhFvmAYO8/edit?gid=0#gid=0",
  driveAlphaville: "https://drive.google.com/drive/folders/10_kXnXxGiviXmS_1IAUJX-Ot5O3D0AR8",
  estilosEdicao: "https://app.notion.com/p/3c09d21c36c680b78406d5332346c11c?v=3c09d21c36c680239ad3000c9c50121d",
  jornalLegado: "https://brandlegacy-journal.vercel.app/",
  ferramentas: [
    { name: "Epidemic Sound", url: "https://www.epidemicsound.com/pt/music/featured/" },
    { name: "Filmvibes", url: "https://filmvibes.io/" },
    { name: "HypeAuditor", url: "https://www.hypeauditor.com/" },
  ],
};

/// Dias da semana da tabela de referência de Conteúdo — 1=segunda..7=domingo
/// (ISO), pra bater com a ordem natural "Segunda..Domingo" pedida.
export const CONTENT_WEEKDAYS = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
] as const;

/** Soma curtidas+comentários+salvamentos+compartilhamentos de um conjunto de
 * posts (SocialReporteiPost) e calcula engajamento por alcance —
 * ((interações) / alcance) x 100. Usado nos Indicadores Gerais e na
 * comparação de períodos do Dashboard Reportei. */
export function computeReachEngagement(
  posts: {
    alcance: number | null;
    curtidas: number | null;
    comentarios: number | null;
    salvamentos: number | null;
    compartilhamentos: number | null;
  }[]
) {
  const interactions = posts.reduce(
    (s, p) => s + (p.curtidas ?? 0) + (p.comentarios ?? 0) + (p.salvamentos ?? 0) + (p.compartilhamentos ?? 0),
    0
  );
  const reach = posts.reduce((s, p) => s + (p.alcance ?? 0), 0);
  return {
    postCount: posts.length,
    interactions,
    reach,
    engagementPct: reach > 0 ? (interactions / reach) * 100 : null,
  };
}
