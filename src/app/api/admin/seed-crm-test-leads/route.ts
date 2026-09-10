import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { LeadFunnel, LeadOrigin } from "@prisma/client";

/**
 * Rota temporária — popula o esqueleto do CRM com leads de teste claramente
 * fictícios (prefixo "[TESTE]"), cobrindo os 3 funis, as 6 origens, pelo
 * menos 1 desqualificado (cross-funil) e leads atribuídos/sem closer, só
 * pra dar pra navegar no Kanban. Nada disso é dado real.
 */

type Row = {
  name: string;
  company: string;
  funnel: LeadFunnel;
  origin: LeadOrigin;
  stageKey: string;
  value: number;
  disqualified?: boolean;
  assigned?: boolean;
};

const ROWS: Row[] = [
  // Eventos
  { name: "[TESTE] Joana Ferraz", company: "Ferraz Cosméticos", funnel: "eventos", origin: "trafego", stageKey: "aplicacao_gold", value: 3000 },
  { name: "[TESTE] Marcelo Tavares", company: "Tavares Suplementos", funnel: "eventos", origin: "indicacao", stageKey: "em_contato", value: 3600, assigned: true },
  { name: "[TESTE] Bianca Reis", company: "Reis Joias", funnel: "eventos", origin: "prospeccao_ativa", stageKey: "reuniao_agendada", value: 4500 },
  { name: "[TESTE] Diego Pontes", company: "Pontes Fitness", funnel: "eventos", origin: "recuperacao", stageKey: "negociacao", value: 5000, assigned: true },
  { name: "[TESTE] Larissa Nogueira", company: "Nogueira Beauty", funnel: "eventos", origin: "organico", stageKey: "venda", value: 3300 },

  // Consultoria Gratuita
  { name: "[TESTE] Rafael Duarte", company: "Duarte Ecom", funnel: "consultoria_gratuita", origin: "trafego", stageKey: "base", value: 0 },
  { name: "[TESTE] Camila Prado", company: "Prado Wear", funnel: "consultoria_gratuita", origin: "email_marketing", stageKey: "em_contato", value: 0 },
  { name: "[TESTE] Thiago Lacerda", company: "Lacerda Store", funnel: "consultoria_gratuita", origin: "prospeccao_ativa", stageKey: "reuniao_agendada", value: 0, assigned: true },
  { name: "[TESTE] Vanessa Quadros", company: "Quadros Home", funnel: "consultoria_gratuita", origin: "organico", stageKey: "negociacao", value: 0, disqualified: true },
  { name: "[TESTE] Eduardo Sales", company: "Sales Pet", funnel: "consultoria_gratuita", origin: "indicacao", stageKey: "perdido", value: 0 },

  // Plataformas
  { name: "[TESTE] Patrícia Moreno", company: "Moreno Kids", funnel: "plataformas", origin: "recuperacao", stageKey: "base", value: 2000 },
  { name: "[TESTE] Igor Barreto", company: "Barreto Tech", funnel: "plataformas", origin: "trafego", stageKey: "contato_2", value: 2500 },
  { name: "[TESTE] Aline Correia", company: "Correia Moda", funnel: "plataformas", origin: "indicacao", stageKey: "reuniao_agendada", value: 2800, assigned: true },
  { name: "[TESTE] Bruno Siqueira", company: "Siqueira Decor", funnel: "plataformas", origin: "email_marketing", stageKey: "follow_up", value: 3100 },
  { name: "[TESTE] Fernanda Alcântara", company: "Alcântara Kids", funnel: "plataformas", origin: "organico", stageKey: "venda", value: 3400 },
];

export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const closer = await prisma.user.findUnique({ where: { email: "lucas.carvalho@brandlegacy.com.br" } });

  const created: string[] = [];
  let firstLeadId: string | null = null;
  for (const row of ROWS) {
    const lead = await prisma.lead.create({
      data: {
        name: row.name,
        company: row.company,
        funnel: row.funnel,
        origin: row.origin,
        stageKey: row.stageKey,
        value: row.value,
        disqualified: row.disqualified ?? false,
        assignedToId: row.assigned && closer ? closer.id : null,
        notes: "Lead de teste — criado só pra visualizar o esqueleto do CRM.",
      },
    });
    created.push(lead.id);
    if (!firstLeadId) firstLeadId = lead.id;
  }

  if (firstLeadId) {
    await prisma.leadInteraction.create({
      data: {
        leadId: firstLeadId,
        authorId: user.id,
        content: "[TESTE] Primeira ligação feita, lead demonstrou interesse — agendar follow-up.",
      },
    });
    await prisma.leadAttachment.create({
      data: {
        leadId: firstLeadId,
        label: "[TESTE] Proposta comercial (link)",
        url: "https://brandlegacy.com.br",
        kind: "referencia",
      },
    });
  }

  return NextResponse.json({ createdCount: created.length, closerFound: Boolean(closer), firstLeadId });
}
