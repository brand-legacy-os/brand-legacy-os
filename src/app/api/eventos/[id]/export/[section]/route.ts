import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rowsToXlsxBuffer } from "@/lib/export-excel";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";
import { EVENT_BUDGET_CATEGORY_META, SPONSOR_TIER_META, SPONSOR_PAYMENT_METHOD_META, EVENT_DYNAMIC_META } from "@/lib/sponsors";
import { formatDate, formatCurrency } from "@/lib/format";
import { parseRevenueBand } from "@/lib/events-icp";

const SHEET_NAMES: Record<string, string> = {
  confirmados: "Confirmados",
  orcamento: "Orçamento",
  patrocinios: "Patrocínios",
  jantar: "Jantar",
  comunicacao: "Comunicação",
  vendas: "Vendas",
  "foto-video": "Foto e Vídeo",
  negociacoes: "Negociações",
  dinamicas: "Dinâmicas",
  "ordem-do-dia": "Ordem do dia",
  "ranking-marcas": "Ranking de marcas",
  "produtos-comercializados": "Produtos Comercializados",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; section: string }> }
) {
  await requireUser();
  const { id, section } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      attendees: {
        orderBy: { name: "asc" },
        include: {
          sales: { include: { seller: true } },
          negotiations: { include: { seller: true }, orderBy: { negotiationDate: "desc" } },
          checkins: true,
        },
      },
      budgetLines: { orderBy: { createdAt: "asc" } },
      sponsors: { orderBy: { createdAt: "asc" } },
      dinnerGuests: { orderBy: { createdAt: "asc" } },
      commsItems: { orderBy: { date: "asc" } },
      mediaDeliverables: {
        orderBy: { order: "asc" },
        include: { trackingOwner: true, executionOwner: true, realizations: { orderBy: { date: "asc" } } },
      },
      days: { orderBy: { date: "asc" }, include: { agenda: { orderBy: { order: "asc" } } } },
      commercialProducts: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!event) return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });

  let rows: Record<string, unknown>[] = [];

  switch (section) {
    case "confirmados":
      rows = event.attendees.map((a) => ({
        Nome: a.name,
        Empresa: a.empresa ?? "",
        Categoria: ATTENDEE_CATEGORY_META[a.category]?.label ?? a.category,
        Ingresso: a.ticketType ?? "",
        Email: a.email ?? "",
        Telefone: a.phone ?? "",
        "CPF/RG": a.cpfRg ?? "",
        "Instagram (marca)": a.instagram ?? "",
        "Instagram (pessoa física)": a.instagramPersonal ?? "",
        "Faturamento da marca": a.revenueRange ?? "",
        "Pessoa focal": a.focalPerson ?? "",
        Presente: a.checkedIn ? "Sim" : "Não",
        "No grupo do WhatsApp": a.inWhatsappGroup ? "Sim" : "Não",
        NPS: a.npsScore ?? "",
      }));
      break;
    case "orcamento":
      rows = event.budgetLines.map((b) => ({
        Categoria: EVENT_BUDGET_CATEGORY_META[b.category]?.label ?? b.category,
        Item: b.item,
        Fornecedor: b.supplier ?? "",
        "Valor previsto": b.plannedValue ?? "",
        "Valor realizado": b.actualValue ?? "",
        Status: b.status,
      }));
      break;
    case "patrocinios":
      rows = event.sponsors.map((s) => ({
        Nome: s.name,
        CNPJ: s.cnpj,
        Contato: s.contactName,
        Telefone: s.contactPhone,
        Cota: SPONSOR_TIER_META[s.tier]?.label ?? s.tier,
        "Valor total": s.totalValue,
        "Meio de pagamento": SPONSOR_PAYMENT_METHOD_META[s.paymentMethod]?.label ?? s.paymentMethod,
        Status: s.status,
      }));
      break;
    case "jantar":
      rows = event.dinnerGuests.map((g) => ({
        Nome: g.name,
        Categoria: g.category ?? "",
        Empresa: g.empresa ?? "",
        Telefone: g.phone ?? "",
        Email: g.email ?? "",
      }));
      break;
    case "comunicacao":
      rows = event.commsItems.map((c) => ({
        Data: formatDate(c.date),
        Horário: c.time ?? "",
        Mensagem: c.message,
        Objetivo: c.objective ?? "",
        Status: c.status,
        "Link da arte": c.artLink ?? c.artUrl ?? "",
      }));
      break;
    case "vendas":
      rows = event.attendees.flatMap((a) =>
        a.sales.map((s) => ({
          Confirmado: a.name,
          Programa: s.program,
          Valor: s.value,
          "À vista/parcelado": s.paymentPlan,
          Parcelas: s.installmentCount ?? "",
          "Meio de pagamento": s.paymentMethod === "outro" ? s.paymentMethodOther ?? "Outro" : s.paymentMethod,
          Data: formatDate(new Date(s.saleDate)),
          Vendedor: s.seller?.name ?? "",
          Observação: s.notes ?? "",
        }))
      );
      break;
    case "foto-video":
      rows = event.mediaDeliverables.map((d) => ({
        "O que precisa ser entregue": d.title,
        Objetivo: d.objective ?? "",
        "Responsável pelo acompanhamento": d.trackingOwner?.name ?? "",
        "Responsável pela realização": d.executionOwner?.name ?? d.executionOwnerOther ?? "",
        "Data prevista": d.plannedDate ? formatDate(new Date(d.plannedDate)) : "",
        "Datas de realização": d.realizations.map((r) => formatDate(new Date(r.date))).join(", "),
        "É entrega de quantidade?": d.isQuantityDelivery ? "Sim" : "Não",
        "Quantidade planejada": d.plannedQuantity ?? "",
        "Quantidade entregue": d.deliveredQuantity ?? "",
        Observações: d.notes ?? "",
        Anexo: d.fileUrl ?? "",
      }));
      break;
    case "negociacoes":
      rows = event.attendees.flatMap((a) =>
        a.negotiations.map((n) => ({
          Confirmado: a.name,
          Empresa: a.empresa ?? "",
          Vendedor: n.seller?.name ?? "",
          Data: formatDate(new Date(n.negotiationDate)),
          "Valor em negociação": n.value ?? "",
          "Condições de pagamento": n.paymentConditions ?? "",
          "Informações do lead": n.leadInfo ?? "",
          Observações: n.notes ?? "",
          "Já comprou?": a.sales.length > 0 ? "Sim" : "Não",
        }))
      );
      break;
    case "dinamicas":
      rows = event.attendees
        .filter((a) => a.dynamicChoice)
        .map((a) => ({
          Marca: a.empresa ?? "",
          "IG da marca": a.instagram ?? "",
          Participante: a.name,
          "IG do participante": a.instagramPersonal ?? "",
          Segmento: a.segmento ?? "",
          Faturamento: a.revenueRange ?? "",
          Dinâmica:
            a.dynamicChoice === "outro"
              ? a.dynamicOther || "Outro"
              : EVENT_DYNAMIC_META[a.dynamicChoice as keyof typeof EVENT_DYNAMIC_META]?.label ?? a.dynamicChoice,
        }));
      break;
    case "ordem-do-dia":
      rows = event.days.flatMap((day) =>
        day.agenda.map((item) => ({
          Data: formatDate(new Date(day.date)),
          "O que": item.title,
          Quem: item.who ?? "",
          "Horário de início": item.startTime ?? "",
          "Horário de término": item.endTime ?? "",
          Objetivo: item.objective ?? "",
          Observação: item.notes ?? "",
        }))
      );
      break;
    case "ranking-marcas": {
      const groups = new Map<string, typeof event.attendees>();
      for (const a of event.attendees) {
        const empresa = a.empresa?.trim();
        if (!empresa) continue;
        const key = empresa.toLowerCase();
        groups.set(key, [...(groups.get(key) ?? []), a]);
      }
      rows = [...groups.values()]
        .sort((a, b) => {
          const bandA = parseRevenueBand(a.find((m) => m.revenueRange)?.revenueRange);
          const bandB = parseRevenueBand(b.find((m) => m.revenueRange)?.revenueRange);
          return (bandB?.min ?? -Infinity) - (bandA?.min ?? -Infinity);
        })
        .map((members, i) => {
          const first = members.find((m) => m.instagram || m.revenueRange || m.segmento) ?? members[0];
          const negotiations = members.flatMap((m) => m.negotiations);
          const sales = members.flatMap((m) => m.sales);
          return {
            Posição: i + 1,
            Marca: first.empresa ?? "",
            Instagram: first.instagram ?? "",
            Faturamento: first.revenueRange ?? "",
            Segmento: first.segmento ?? "",
            Confirmado: members.map((m) => m.name).join(", "),
            Contato: members.map((m) => m.phone ?? m.email).filter(Boolean).join(", "),
            "Presença diária": members
              .map((m) => `${m.name}: ${m.checkins.filter((c) => c.present).length}/${m.checkins.length}`)
              .join(", "),
            "Negociações": negotiations.length > 0 ? `${negotiations.length} · ${formatCurrency(negotiations.reduce((s, n) => s + (n.value ?? 0), 0))}` : "",
            Vendas: sales.length > 0 ? `${sales.length} · ${formatCurrency(sales.reduce((s, sale) => s + sale.value, 0))}` : "",
          };
        });
      break;
    }
    case "produtos-comercializados":
      rows = event.commercialProducts.map((p) => ({
        Nome: p.name,
        Valor: p.value,
        "Condição mínima de pagamento": p.minPaymentCondition ?? "",
        "Condição máxima de pagamento": p.maxPaymentCondition ?? "",
        "Forma de pagamento": p.paymentMethod === "outro" ? p.paymentMethodOther ?? "Outro" : p.paymentMethod,
        Escopo: p.scope ?? "",
        Deck: p.deckUrl ?? "",
      }));
      break;
    default:
      return NextResponse.json({ error: "Seção inválida." }, { status: 400 });
  }

  const buffer = rowsToXlsxBuffer(rows, SHEET_NAMES[section] ?? "Dados");
  const filename = `${event.name.replace(/[^\w-]+/g, "_")}_${section}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
