"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hasFinanceRole } from "@/lib/finance-auth";

export type ActionState = { error?: string; success?: boolean };

export async function createPayableAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!hasFinanceRole(user)) return { error: "Sem permissão." };

  const fornecedor = String(formData.get("fornecedor") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const centroCusto = String(formData.get("centroCusto") ?? "").trim() || null;
  const competencia = String(formData.get("competencia") ?? "").trim();
  const vencimento = String(formData.get("vencimento") ?? "");
  const valorPrevisto = Number(String(formData.get("valorPrevisto") ?? "0").replace(",", "."));
  const formaPagamento = String(formData.get("formaPagamento") ?? "").trim() || null;

  if (!fornecedor || !descricao || !vencimento || !valorPrevisto) {
    return { error: "Preencha fornecedor, descrição, vencimento e valor." };
  }

  await prisma.payable.create({
    data: {
      fornecedor,
      descricao,
      categoria: categoria || "Geral",
      centroCusto,
      competencia: competencia || vencimento.slice(0, 7),
      vencimento: new Date(`${vencimento}T12:00:00`),
      valorPrevisto,
      formaPagamento,
      responsavelId: user.id,
    },
  });

  revalidatePath("/financeiro/contas-a-pagar");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function markPayablePaidAction(formData: FormData) {
  const user = await requireUser();
  if (!hasFinanceRole(user)) return;
  const id = String(formData.get("id") ?? "");
  const payable = await prisma.payable.findUnique({ where: { id } });
  if (!payable) return;

  await prisma.payable.update({
    where: { id },
    data: payable.pagamento
      ? { pagamento: null, valorRealizado: null }
      : { pagamento: new Date(), valorRealizado: payable.valorPrevisto },
  });

  revalidatePath("/financeiro/contas-a-pagar");
  revalidatePath("/financeiro");
}

export async function createReceivableAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!hasFinanceRole(user)) return { error: "Sem permissão." };

  const cliente = String(formData.get("cliente") ?? "").trim();
  const empresa = String(formData.get("empresa") ?? "").trim() || null;
  const produto = String(formData.get("produto") ?? "").trim() || null;
  const descricao = String(formData.get("descricao") ?? "").trim();
  const categoria = String(formData.get("categoria") ?? "").trim();
  const valor = Number(String(formData.get("valor") ?? "0").replace(",", "."));
  const vencimento = String(formData.get("vencimento") ?? "");
  const formaPagamento = String(formData.get("formaPagamento") ?? "").trim() || null;

  if (!cliente || !descricao || !vencimento || !valor) {
    return { error: "Preencha cliente, descrição, vencimento e valor." };
  }

  await prisma.receivable.create({
    data: {
      cliente,
      empresa,
      produto,
      descricao,
      categoria: categoria || "Geral",
      valor,
      vencimento: new Date(`${vencimento}T12:00:00`),
      formaPagamento,
      responsavelId: user.id,
    },
  });

  revalidatePath("/financeiro/contas-a-receber");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function markReceivableReceivedAction(formData: FormData) {
  const user = await requireUser();
  if (!hasFinanceRole(user)) return;
  const id = String(formData.get("id") ?? "");
  const receivable = await prisma.receivable.findUnique({ where: { id } });
  if (!receivable) return;

  await prisma.receivable.update({
    where: { id },
    data:
      receivable.valorRecebido >= receivable.valor
        ? { valorRecebido: 0, dataEfetiva: null }
        : { valorRecebido: receivable.valor, dataEfetiva: new Date() },
  });

  revalidatePath("/financeiro/contas-a-receber");
  revalidatePath("/financeiro");
}

export async function saveFinanceEntryAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!hasFinanceRole(user)) return { error: "Sem permissão." };

  const existingCategoryId = String(formData.get("categoryId") ?? "");
  const newCategoryName = String(formData.get("newCategoryName") ?? "").trim();
  const newCategoryKind = String(formData.get("newCategoryKind") ?? "");
  const periodKey = String(formData.get("periodKey") ?? "").trim();
  const realizadoRaw = String(formData.get("realizado") ?? "").replace(",", ".");
  const previstoRaw = String(formData.get("previsto") ?? "").replace(",", ".");

  if (!periodKey) return { error: "Informe o mês (competência)." };
  if (!existingCategoryId && !newCategoryName) {
    return { error: "Escolha uma categoria existente ou informe o nome de uma nova." };
  }

  let categoryId = existingCategoryId;
  if (!categoryId) {
    if (newCategoryKind !== "receita" && newCategoryKind !== "despesa") {
      return { error: "Escolha se a nova categoria é receita ou despesa." };
    }
    const maxOrder = await prisma.financeCategory.aggregate({ _max: { order: true } });
    const category = await prisma.financeCategory.create({
      data: {
        name: newCategoryName,
        kind: newCategoryKind,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });
    categoryId = category.id;
  }

  const realizado = realizadoRaw ? Number(realizadoRaw) : undefined;
  const previsto = previstoRaw ? Number(previstoRaw) : undefined;
  if (realizado === undefined && previsto === undefined) {
    return { error: "Informe ao menos o valor realizado ou o previsto." };
  }

  await prisma.financeEntry.upsert({
    where: { categoryId_periodKey: { categoryId, periodKey } },
    create: { categoryId, periodKey, realizado, previsto },
    update: { ...(realizado !== undefined ? { realizado } : {}), ...(previsto !== undefined ? { previsto } : {}) },
  });

  revalidatePath("/financeiro/dfc");
  revalidatePath("/financeiro");
  return { success: true };
}

export async function addCashMovementAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  if (!hasFinanceRole(user)) return { error: "Sem permissão." };

  const dateRaw = String(formData.get("date") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const amountRaw = String(formData.get("amount") ?? "").replace(",", ".");
  const kind = String(formData.get("kind") ?? "saida");
  const eventId = String(formData.get("eventId") ?? "") || null;

  if (!dateRaw || !description || !amountRaw) {
    return { error: "Preencha data, descrição e valor." };
  }

  const magnitude = Math.abs(Number(amountRaw));
  if (Number.isNaN(magnitude) || magnitude === 0) {
    return { error: "Informe um valor numérico válido." };
  }

  await prisma.cashMovement.create({
    data: {
      date: new Date(`${dateRaw}T12:00:00`),
      description,
      amount: kind === "entrada" ? magnitude : -magnitude,
      eventId,
    },
  });

  revalidatePath("/financeiro/caixa");
  revalidatePath("/financeiro");
  if (eventId) revalidatePath(`/eventos/${eventId}`);
  return { success: true };
}
