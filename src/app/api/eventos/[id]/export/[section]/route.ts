import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { rowsToXlsxBuffer } from "@/lib/export-excel";
import { ATTENDEE_CATEGORY_META } from "@/lib/events";
import { EVENT_BUDGET_CATEGORY_META, SPONSOR_TIER_META, SPONSOR_PAYMENT_METHOD_META } from "@/lib/sponsors";
import { formatDate } from "@/lib/format";

const SHEET_NAMES: Record<string, string> = {
  confirmados: "Confirmados",
  orcamento: "Orçamento",
  patrocinios: "Patrocínios",
  jantar: "Jantar",
  comunicacao: "Comunicação",
  vendas: "Vendas",
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
      attendees: { orderBy: { name: "asc" }, include: { sales: { include: { seller: true } } } },
      budgetLines: { orderBy: { createdAt: "asc" } },
      sponsors: { orderBy: { createdAt: "asc" } },
      dinnerGuests: { orderBy: { createdAt: "asc" } },
      commsItems: { orderBy: { date: "asc" } },
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
