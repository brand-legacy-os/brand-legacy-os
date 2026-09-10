import type { Prisma, LeadFunnel, LeadOrigin } from "@prisma/client";
import type { CrmRole } from "@/lib/permissions";

export const LEAD_FUNNEL_META: Record<LeadFunnel, { label: string }> = {
  eventos: { label: "Eventos" },
  consultoria_gratuita: { label: "Consultoria Gratuita" },
  plataformas: { label: "Plataformas" },
};

export const LEAD_ORIGIN_META: Record<LeadOrigin, { label: string; color: string }> = {
  trafego: { label: "Tráfego", color: "bg-blue-100 text-blue-700" },
  indicacao: { label: "Indicação/Referidos", color: "bg-violet-100 text-violet-700" },
  organico: { label: "Orgânico", color: "bg-emerald-100 text-emerald-700" },
  email_marketing: { label: "E-mail Marketing", color: "bg-amber-100 text-amber-700" },
  prospeccao_ativa: { label: "Prospecção Ativa", color: "bg-rose-100 text-rose-700" },
  recuperacao: { label: "Recuperação", color: "bg-slate-200 text-slate-700" },
};

/**
 * Etapas reais do GoHighLevel (puxadas ao vivo via Windsor.ai/MCP no
 * planejamento desta feature) — "as etapas devem seguir as mesmas etapas do
 * Highlevel", pedido explícito do usuário. Eventos usa o molde compartilhado
 * pelos 4 pipelines de Imersão/Club (todos idênticos); Consultoria Gratuita
 * usa o pipeline real "Sessão estratégica - Brand Legacy"; Plataformas ainda
 * não existe no GoHighLevel — por decisão do usuário, usa o mesmo molde da
 * Consultoria Gratuita até ganhar pipeline próprio.
 */
export const FUNNEL_STAGES: Record<LeadFunnel, { key: string; label: string }[]> = {
  eventos: [
    { key: "aplicacao_gold", label: "Aplicação Gold" },
    { key: "aplicacao_vip", label: "Aplicação VIP" },
    { key: "aplicacao_shark", label: "Aplicação Shark" },
    { key: "contato_1", label: "1 contato" },
    { key: "contato_2", label: "2 contato" },
    { key: "contato_3", label: "3 contato" },
    { key: "sem_resposta", label: "Sem resposta" },
    { key: "em_contato", label: "Em contato" },
    { key: "reuniao_agendada", label: "Reunião Agendada" },
    { key: "reuniao_realizada", label: "Reunião realizada" },
    { key: "negociacao", label: "Negociação" },
    { key: "remarcacao", label: "Remarcação" },
    { key: "follow_up", label: "Follow UP" },
    { key: "perdido", label: "Perdido" },
    { key: "venda", label: "Venda" },
  ],
  consultoria_gratuita: [
    { key: "base", label: "Base" },
    { key: "contato_1", label: "1 Contato" },
    { key: "contato_2", label: "2 Contato" },
    { key: "contato_3", label: "3 Contato" },
    { key: "sem_resposta", label: "Sem resposta" },
    { key: "em_contato", label: "Em contato" },
    { key: "reuniao_agendada", label: "Reunião Agendada" },
    { key: "remarcacao", label: "Remarcação" },
    { key: "reuniao_realizada", label: "Reunião realizada" },
    { key: "follow_up", label: "Follow UP" },
    { key: "negociacao", label: "Negociação" },
    { key: "perdido", label: "Perdido" },
    { key: "venda", label: "Venda" },
  ],
  plataformas: [
    { key: "base", label: "Base" },
    { key: "contato_1", label: "1 Contato" },
    { key: "contato_2", label: "2 Contato" },
    { key: "contato_3", label: "3 Contato" },
    { key: "sem_resposta", label: "Sem resposta" },
    { key: "em_contato", label: "Em contato" },
    { key: "reuniao_agendada", label: "Reunião Agendada" },
    { key: "remarcacao", label: "Remarcação" },
    { key: "reuniao_realizada", label: "Reunião realizada" },
    { key: "follow_up", label: "Follow UP" },
    { key: "negociacao", label: "Negociação" },
    { key: "perdido", label: "Perdido" },
    { key: "venda", label: "Venda" },
  ],
};

export function isTerminalStage(funnel: LeadFunnel, stageKey: string) {
  return stageKey === "perdido" || stageKey === "venda";
}

export function stageLabel(funnel: LeadFunnel, stageKey: string) {
  return FUNNEL_STAGES[funnel].find((s) => s.key === stageKey)?.label ?? stageKey;
}

/**
 * Recorte de leads por papel (ver decisões do usuário): líder vê tudo,
 * closer só o que está atribuído a ele (com opção de ver todos via
 * `showAll`), SDR vê desqualificados de qualquer origem + indicação +
 * prospecção ativa, Social Selling vê orgânico + e-mail marketing.
 */
export function whereForCrmRole(
  role: CrmRole,
  userId: string,
  showAll: boolean
): Prisma.LeadWhereInput {
  switch (role) {
    case "lider":
      return {};
    case "closer":
      return showAll ? {} : { assignedToId: userId };
    case "sdr":
      return {
        OR: [
          { disqualified: true },
          { origin: { in: ["indicacao", "prospeccao_ativa"] } },
        ],
      };
    case "social_selling":
      return { origin: { in: ["organico", "email_marketing"] } };
  }
}
