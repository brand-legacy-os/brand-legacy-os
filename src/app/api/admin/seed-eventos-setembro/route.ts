import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import type { EventBudgetCategory, SponsorTier, SponsorDealStatus, SponsorPaymentPlan, SponsorPaymentMethod } from "@prisma/client";

// Dados extraídos de "Dashboard Brand Legacy — Eventos 2026 (2).xlsx",
// aba "Scale Setembro 2026", seções GASTO REAL e PATROCÍNIO — colados
// literalmente (ver sessão que criou esta rota pro parsing original).
const DATA = {
  budgetLines: [
    { category: "press_kit_gold", item: "Credencial", quantity: null, unitValue: 3.74, actualValue: null, supplier: "Visual PVC", paymentMethod: "", status: "Entregue", description: "NF: Nota Fiscal" },
    { category: "press_kit_gold", item: "Cordão Credencial", quantity: null, unitValue: 3.74, actualValue: null, supplier: "Visual PVC", paymentMethod: "", status: "Entregue", description: "NF: Nota Fiscal" },
    { category: "press_kit_gold", item: "Caneta", quantity: 25, unitValue: 5.7, actualValue: 142.5, supplier: "Piron", paymentMethod: "31/08 - 09/09", status: "50 % Pago", description: "Pagamento: 31/08 - 09/09 · NF: Nota Fiscal" },
    { category: "press_kit_gold", item: "Moleskine", quantity: 25, unitValue: 25.9, actualValue: 647.5, supplier: "Piron", paymentMethod: "31/08 - 09/09", status: "50 % Pago", description: "Pagamento: 31/08 - 09/09 · NF: Nota Fiscal" },
    { category: "press_kit_vip", item: "Credencial", quantity: null, unitValue: 3.74, actualValue: null, supplier: "Visual PVC", paymentMethod: "", status: "Entregue", description: "NF: Nota Fiscal" },
    { category: "press_kit_vip", item: "Cordão Credencial", quantity: null, unitValue: 3.74, actualValue: null, supplier: "Visual PVC", paymentMethod: "", status: "Entregue", description: "NF: Nota Fiscal" },
    { category: "press_kit_vip", item: "Caneta", quantity: 25, unitValue: 5.7, actualValue: 142.5, supplier: "Piron", paymentMethod: "31/08 - 09/09", status: "50 % Pago", description: "Pagamento: 31/08 - 09/09 · NF: Nota Fiscal" },
    { category: "press_kit_vip", item: "Moleskine", quantity: 25, unitValue: 25.9, actualValue: 647.5, supplier: "Piron", paymentMethod: "31/08 - 09/09", status: "50 % Pago", description: "Pagamento: 31/08 - 09/09 · NF: Nota Fiscal" },
    { category: "press_kit_vip", item: "Marcador de Mesa", quantity: 60, unitValue: 4, actualValue: 240, supplier: "New York CV", paymentMethod: "2026-08-01", status: "Entregue", description: "NF: Nota Fiscal" },
    { category: "press_kit_vip", item: "Formulário de Indicação", quantity: 40, unitValue: 1.5, actualValue: 60, supplier: "Papelaria Flor de Papel", paymentMethod: "2026-08-01", status: "Aprovado", description: "NF: Não" },
    { category: "a_e_b", item: "Buffet", quantity: null, unitValue: 42.5, actualValue: 12750, supplier: "Migliori", paymentMethod: "31/08 - 20/09", status: "50 % Pago", description: "Unidade: 100 px / 3 dias · Pagamento: 31/08 - 20/09 · NF: Nota Fiscal" },
    { category: "a_e_b", item: "Ativação Café", quantity: null, unitValue: 7000, actualValue: 7000, supplier: "Kafé Intinerante", paymentMethod: "01/09 - 14/09", status: "50 % Pago", description: "Unidade: 100 pessoas · Pagamento: 01/09 - 14/09 · NF: Nota Fiscal" },
    { category: "a_e_b", item: "Vinhos", quantity: null, unitValue: 82, actualValue: 4100, supplier: "Paulo Wine", paymentMethod: "2026-09-17", status: "Aprovado", description: "Unidade: 36 garrafas · NF: Não" },
    { category: "a_e_b", item: "Água Personalizada", quantity: null, unitValue: null, actualValue: 3600, supplier: "2HL", paymentMethod: "28/08 - 09/09", status: "50 % Pago", description: "Unidade: 1.700 garrafas · Vl. unitário: 2,10 / 2,20 · Pagamento: 28/08 - 09/09 · NF: Nota Fiscal" },
    { category: "a_e_b", item: "Energético", quantity: null, unitValue: 8.55, actualValue: 3078, supplier: "Smart Power", paymentMethod: "31/08 - 09/09", status: "100% Pago", description: "Unidade: 360 latas · Pagamento: 31/08 - 09/09 · NF: Nota Fiscal" },
    { category: "a_e_b", item: "Jantar", quantity: null, unitValue: 350, actualValue: 10500, supplier: "Le Mont Bleu", paymentMethod: "2026-09-15", status: "Aprovado", description: "Unidade: 30 pessoas · NF: Nota Fiscal" },
    { category: "audiovisual", item: "Foto e Vídeo", quantity: null, unitValue: 33000, actualValue: 33000, supplier: "Abner", paymentMethod: "", status: "Aprovado", description: "Unidade: 3 dias · NF: Nota Fiscal" },
    { category: "audiovisual", item: "Storymaker", quantity: null, unitValue: 3000, actualValue: 3000, supplier: "Thais", paymentMethod: "", status: "Aprovado", description: "Unidade: 3 dias" },
    { category: "audiovisual", item: "Técnico de Som/Luz", quantity: null, unitValue: null, actualValue: 2200, supplier: "Guilherme/CAUP", paymentMethod: "2026-09-10", status: "Em Pagamento", description: "Unidade: 3 dias · Vl. unitário: R$ 2.200,00 · NF: Nota Fiscal" },
    { category: "audiovisual", item: "Técnico de Imagem", quantity: null, unitValue: 2200, actualValue: 2200, supplier: "André/CAUP", paymentMethod: "2026-09-10", status: "Em Pagamento", description: "Unidade: 3 dias · NF: Nota Fiscal" },
    { category: "audiovisual", item: "Saxofonista", quantity: null, unitValue: 1300, actualValue: null, supplier: "Paulo Sax", paymentMethod: "", status: "Reprovado", description: "Unidade: 1 dias" },
    { category: "cenografia", item: "Backdrop", quantity: 1, unitValue: 2650, actualValue: null, supplier: "Lub Eventos", paymentMethod: "", status: "Reprovado", description: null },
    { category: "cenografia", item: "Arranjos (mesa do buffet)", quantity: 6, unitValue: 545, actualValue: 545, supplier: "Leea Rubra", paymentMethod: "28/08 - 09/09", status: "50 % Pago", description: "Pagamento: 28/08 - 09/09 · NF: Nota Fiscal" },
    { category: "cenografia", item: "Unifilas (divisão das áreas)", quantity: 10, unitValue: 66.66, actualValue: 500, supplier: "Porta Banner Brasil", paymentMethod: "2026-09-21", status: "Em Pagamento", description: "NF: Nota Fiscal" },
    { category: "staff", item: "Hall Prédio + Plenária", quantity: null, unitValue: 1300, actualValue: 1300, supplier: "Juliana", paymentMethod: "2026-09-10", status: "Aprovado", description: "Unidade: 3 dias · NF: Nota Fiscal" },
    { category: "staff", item: "Volante", quantity: null, unitValue: 1500, actualValue: 1500, supplier: "Osmar", paymentMethod: "2026-09-10", status: "Aprovado", description: "Unidade: 3 dias · NF: Não" },
    { category: "staff", item: "Limpeza", quantity: null, unitValue: 1400, actualValue: 1400, supplier: "Lucilene/Daiana", paymentMethod: "2026-09-10", status: "Aprovado", description: "Unidade: 2 pessoas · NF: Não" },
    { category: "staff", item: "Montadores", quantity: null, unitValue: 600, actualValue: 600, supplier: "Alef", paymentMethod: "2026-09-10", status: "Aprovado", description: "Unidade: 1 pessoa · NF: Não" },
    { category: "staff", item: "Passagem Lucas", quantity: null, unitValue: null, actualValue: 1728.81, supplier: "Azul", paymentMethod: "2026-08-31", status: "100% Pago", description: "Unidade: 1 ida/1 volta · Vl. unitário: R$ 593,96 / R$ 956,65 · NF: Nota Fiscal" },
    { category: "staff", item: "Passagem Josias", quantity: null, unitValue: null, actualValue: null, supplier: "Azul", paymentMethod: "2026-08-31", status: "Reprovado", description: "Unidade: 1 ida/1 volta · NF: Nota Fiscal" },
    { category: "staff", item: "Passagem Guilherme", quantity: null, unitValue: null, actualValue: 1497, supplier: "Gol", paymentMethod: "2026-08-31", status: "100% Pago", description: "Unidade: 1 ida / 1 volta · Vl. unitário: R$ 744,86 / R$ 753,04 · NF: Nota Fiscal" },
    { category: "outro", item: "Hospedagem — Lucas", quantity: null, unitValue: 1865.58, actualValue: 1865.58, supplier: "Radisson", paymentMethod: "", status: "100% Pago", description: "Unidade: 2 pessoas / 2 noites · NF: Nota Fiscal" },
    { category: "outro", item: "Hospedagem — Nivaldo", quantity: null, unitValue: 1900, actualValue: null, supplier: "Radisson", paymentMethod: "", status: "Em Negociação", description: "Unidade: 2 pessoas / 2 noites · NF: Nota Fiscal" },
    { category: "outro", item: "Hospedagem — Dih Santana", quantity: null, unitValue: 1900, actualValue: null, supplier: "Radisson", paymentMethod: "", status: "Em Negociação", description: "Unidade: 2 pessoas / 2 noites · NF: Nota Fiscal" },
    { category: "outro", item: "Hospedagem — Staff Brand Legacy", quantity: null, unitValue: 6053.9, actualValue: 6053.9, supplier: "Airbnb", paymentMethod: "", status: "100% Pago", description: "Unidade: 7 pessoas / 4 noites · NF: Nota Fiscal" },
    { category: "outro", item: "Hospedagem — Staff Foto e Vídeo", quantity: null, unitValue: 3222, actualValue: 3222, supplier: "Airbnb", paymentMethod: "", status: "100% Pago", description: "Unidade: 7 pessoas / 2 noites · NF: Nota Fiscal" },
    { category: "outro", item: "CAUP Lasaro do Carmo", quantity: null, unitValue: 0, actualValue: 0, supplier: "Lasaro do Carmo/Dom", paymentMethod: "", status: "Entregue", description: "Unidade: 1 dia · NF: Não/Parceria" },
  ] as {
    category: EventBudgetCategory;
    item: string;
    quantity: number | null;
    unitValue: number | null;
    actualValue: number | null;
    supplier: string | null;
    paymentMethod: string | null;
    status: string | null;
    description: string | null;
  }[],
  sponsors: [
    { name: "TPL Platinum", contactName: "Tiago Campos", contactPhone: "11 96343-2450", totalValue: 30000, paymentMethod: "À vista - PIX", contractTerm: "Anual", contractStatus: "Assinado", paymentStatus: "Aguardando Pagamento" },
    { name: "Yampi", contactName: "Ingrind Simões", contactPhone: "21 99992-5456", totalValue: 20000, paymentMethod: "À vista - PIX", contractTerm: "Anual", contractStatus: "Assinado", paymentStatus: "Pago" },
    { name: "CFO Company", contactName: "Lucas Scheuer", contactPhone: "48 8405-6903", totalValue: 30000, paymentMethod: "10x cartão - AppMax", contractTerm: "Mensal", contractStatus: "Assinado", paymentStatus: "Pago" },
    { name: "Martz", contactName: "Luana Lira / Eduardo Kavaliunas", contactPhone: "31 2181-1072 / 51 9366-9679", totalValue: 25000, paymentMethod: "3x cartão - Pagar me", contractTerm: "Mensal", contractStatus: "Assinado", paymentStatus: "Pago" },
    { name: "Buzzmates | Inbazz", contactName: "Clara Curto", contactPhone: "27 99945-7910", totalValue: 25000, paymentMethod: "À vista - Pagar me", contractTerm: "Mensal", contractStatus: "Assinado", paymentStatus: "Aguardando Pagamento" },
    { name: "Grupo ROI", contactName: "Lucas Motta", contactPhone: "31 9311-3132", totalValue: 30000, paymentMethod: "À vista - Pagar me", contractTerm: "Mensal", contractStatus: "Pendente assinatura", paymentStatus: "Aguardando Pagamento" },
    { name: "Galucci", contactName: "Janaina Leandro", contactPhone: "11 99192-6239", totalValue: 30000, paymentMethod: "", contractTerm: "", contractStatus: "", paymentStatus: "" },
    { name: "Patrick Neves", contactName: "Patrick Neves", contactPhone: "19 99944-1444", totalValue: 15000, paymentMethod: "", contractTerm: "", contractStatus: "", paymentStatus: "" },
  ] as {
    name: string;
    contactName: string;
    contactPhone: string;
    totalValue: number;
    paymentMethod: string;
    contractTerm: string;
    contractStatus: string;
    paymentStatus: string;
  }[],
};

function mapSponsorTier(): SponsorTier {
  return "gold";
}

function mapSponsorStatus(contractStatus: string, paymentStatus: string): SponsorDealStatus {
  if (contractStatus === "Assinado") {
    if (paymentStatus === "Pago") return "pago_integralmente";
    return "assinado";
  }
  if (contractStatus === "Pendente assinatura") return "em_negociacao";
  return "em_negociacao";
}

function mapPaymentPlan(paymentMethod: string): SponsorPaymentPlan {
  return /\d+x/i.test(paymentMethod) ? "parcelado" : "avista";
}

function mapPaymentMethod(paymentMethod: string): SponsorPaymentMethod {
  if (/pix/i.test(paymentMethod)) return "pix";
  if (/pagar\s*me/i.test(paymentMethod) || /cart[ãa]o/i.test(paymentMethod)) return "pagarme";
  return "boleto";
}

/**
 * Rota temporária admin-gated pra atualizar o card do evento "Imersão Scale
 * — Setembro 2026" com a planilha real (orçamento + patrocínio) — chamada
 * 1x via fetch autenticado, depois removida. Upsert por (eventId, item,
 * category) pro orçamento e por (eventId, name) pros patrocinadores, pra
 * não duplicar quando já existir.
 */
export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const event = await prisma.event.findFirst({
    where: { name: { contains: "Setembro" } },
    orderBy: { startDate: "desc" },
  });
  if (!event) return NextResponse.json({ error: "Evento de Setembro não encontrado." }, { status: 404 });

  const budgetResults: { item: string; action: "created" | "updated" }[] = [];
  for (const line of DATA.budgetLines) {
    const existing = await prisma.eventBudgetLine.findFirst({
      where: { eventId: event.id, item: line.item, category: line.category },
    });
    const data = {
      eventId: event.id,
      category: line.category,
      item: line.item,
      quantity: line.quantity,
      unitValue: line.unitValue,
      actualValue: line.actualValue,
      supplier: line.supplier,
      paymentMethod: line.paymentMethod,
      status: line.status,
      description: line.description,
    };
    if (existing) {
      await prisma.eventBudgetLine.update({ where: { id: existing.id }, data });
      budgetResults.push({ item: line.item, action: "updated" });
    } else {
      await prisma.eventBudgetLine.create({ data });
      budgetResults.push({ item: line.item, action: "created" });
    }
  }

  const sponsorResults: { name: string; action: "created" | "updated" }[] = [];
  for (const s of DATA.sponsors) {
    const existing = await prisma.sponsor.findFirst({
      where: { eventId: event.id, name: { equals: s.name } },
    });
    const status = mapSponsorStatus(s.contractStatus, s.paymentStatus);
    const paymentPlan = mapPaymentPlan(s.paymentMethod);
    const paymentMethod = mapPaymentMethod(s.paymentMethod);
    if (existing) {
      await prisma.sponsor.update({
        where: { id: existing.id },
        data: {
          contactName: s.contactName || existing.contactName,
          contactPhone: s.contactPhone || existing.contactPhone,
          totalValue: s.totalValue,
          status,
          paymentPlan,
          paymentMethod,
        },
      });
      sponsorResults.push({ name: s.name, action: "updated" });
    } else {
      await prisma.sponsor.create({
        data: {
          eventId: event.id,
          name: s.name,
          cnpj: "",
          contactName: s.contactName,
          contactPhone: s.contactPhone,
          totalValue: s.totalValue,
          paymentPlan,
          paymentMethod,
          tier: mapSponsorTier(),
          status,
          createdById: user.id,
        },
      });
      sponsorResults.push({ name: s.name, action: "created" });
    }
  }

  return NextResponse.json({
    eventId: event.id,
    eventName: event.name,
    budgetLines: budgetResults.length,
    sponsors: sponsorResults.length,
    budgetResults,
    sponsorResults,
  });
}
