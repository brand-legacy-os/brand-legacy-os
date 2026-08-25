import type {
  Customer,
  CustomerStatus,
  RenewalStatus,
  CustomerInteractionKind,
  CustomerRenewal,
  CustomerInteraction,
  CustomerExperience,
  EventAttendee,
  Task,
} from "@prisma/client";

// ---------------------------------------------------------------------------
// Metodologia — cada fórmula abaixo é a definição OFICIAL usada em todo o
// sistema. Mudar a fórmula aqui muda o número em todo lugar de uma vez só;
// não há cálculo duplicado em nenhuma página.
// ---------------------------------------------------------------------------

export const CUSTOMER_STATUS_META: Record<CustomerStatus, { label: string }> = {
  ativo: { label: "Ativo" },
  em_risco: { label: "Em risco" },
  pausado: { label: "Pausado" },
  cancelado: { label: "Cancelado" },
};

export const RENEWAL_STATUS_META: Record<RenewalStatus, { label: string }> = {
  disponivel: { label: "Disponível" },
  renovado: { label: "Renovado" },
  perdido: { label: "Perdido" },
  renegociando: { label: "Renegociando" },
};

export const INTERACTION_KIND_META: Record<CustomerInteractionKind, { label: string }> = {
  interacao: { label: "Interação" },
  problema: { label: "Problema" },
  sucesso: { label: "Sucesso" },
  observacao: { label: "Observação" },
};

/**
 * Trilha de encontros individuais por produto. Club: Diagnóstico + Plano de
 * Ação + Mentoria 3-8 (8 encontros). Tração: Diagnóstico + Plano de Ação +
 * Mentoria 1-3 (5 encontros). Produtos fora dessa lista não têm meta fixa —
 * o progresso só conta os encontros ("individual") já registrados.
 */
export const MEETING_TRACK_BY_PRODUCT: Record<string, string[]> = {
  Club: ["Diagnóstico", "Plano de Ação", "Mentoria 3", "Mentoria 4", "Mentoria 5", "Mentoria 6", "Mentoria 7", "Mentoria 8"],
  "Tração": ["Diagnóstico", "Plano de Ação", "Mentoria 1", "Mentoria 2", "Mentoria 3"],
};

export function meetingTarget(product: string): number | null {
  return MEETING_TRACK_BY_PRODUCT[product]?.length ?? null;
}

export const CHURN_ANNUAL_TARGET_PCT = 5;

// ---------------------------------------------------------------------------
// Receita: MRR, ARR, ARPU, ticket médio
// ---------------------------------------------------------------------------

/** MRR = soma do mrr de clientes com status "ativo". ARR = MRR × 12. */
export function computeMrrArr(customers: Pick<Customer, "status" | "mrr">[]) {
  const mrr = customers
    .filter((c) => c.status === "ativo")
    .reduce((s, c) => s + (c.mrr ?? 0), 0);
  return { mrr, arr: mrr * 12 };
}

/** ARPU = MRR total ÷ nº de clientes ativos. */
export function computeArpu(customers: Pick<Customer, "status" | "mrr">[]) {
  const active = customers.filter((c) => c.status === "ativo");
  if (active.length === 0) return null;
  const mrr = active.reduce((s, c) => s + (c.mrr ?? 0), 0);
  return mrr / active.length;
}

/** Ticket médio = valor contratado total ÷ nº de contratos com valor informado. */
export function computeTicketMedio(customers: Pick<Customer, "contractValue">[]) {
  const withValue = customers.filter((c) => c.contractValue !== null);
  if (withValue.length === 0) return null;
  const total = withValue.reduce((s, c) => s + (c.contractValue ?? 0), 0);
  return total / withValue.length;
}

// ---------------------------------------------------------------------------
// Churn — nunca conta cancelamento sem base elegível.
// "Elegível no início do mês" = já tinha entrado (entryDate <= início) e
// ainda não tinha saído (endDate nulo ou > início do mês).
// "Churned no mês" = status=cancelado com endDate dentro do mês.
// ---------------------------------------------------------------------------

function eligibleAt(customers: Pick<Customer, "entryDate" | "endDate">[], at: Date) {
  return customers.filter((c) => c.entryDate <= at && (!c.endDate || c.endDate > at));
}

export function computeMonthlyChurn(
  customers: Pick<Customer, "entryDate" | "endDate" | "status">[],
  monthStart: Date,
  monthEnd: Date
) {
  const eligible = eligibleAt(customers, monthStart);
  if (eligible.length === 0) return { pct: null, churned: 0, eligible: 0 };
  const churned = customers.filter(
    (c) => c.status === "cancelado" && c.endDate && c.endDate >= monthStart && c.endDate <= monthEnd
  ).length;
  return { pct: (churned / eligible.length) * 100, churned, eligible: eligible.length };
}

/**
 * Churn anual = total de clientes que saíram no ano ÷ base elegível MÉDIA
 * dos 12 meses (média dos "elegível no início do mês" de cada mês do ano) —
 * evita distorção sazonal de simplesmente somar as taxas mensais.
 */
export function computeAnnualChurn(
  customers: Pick<Customer, "entryDate" | "endDate" | "status">[],
  year: number
) {
  const monthStarts = Array.from({ length: 12 }, (_, m) => new Date(year, m, 1));
  const bases = monthStarts.map((d) => eligibleAt(customers, d).length);
  const avgBase = bases.reduce((s, b) => s + b, 0) / 12;
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  const churned = customers.filter(
    (c) => c.status === "cancelado" && c.endDate && c.endDate >= yearStart && c.endDate <= yearEnd
  ).length;
  if (avgBase === 0) return { pct: null, churned, avgBase: 0 };
  return { pct: (churned / avgBase) * 100, churned, avgBase };
}

// ---------------------------------------------------------------------------
// Renovação
// ---------------------------------------------------------------------------

export function summarizeRenewals(renewals: Pick<CustomerRenewal, "plannedValue" | "realizedValue" | "status" | "dueDate">[]) {
  const planned = renewals.reduce((s, r) => s + r.plannedValue, 0);
  const realized = renewals
    .filter((r) => r.status === "renovado")
    .reduce((s, r) => s + (r.realizedValue ?? r.plannedValue), 0);
  const pct = planned > 0 ? (realized / planned) * 100 : null;
  return { planned, realized, pct, open: planned - realized };
}

// ---------------------------------------------------------------------------
// LTV — tempo médio de permanência (meses, entryDate → agora para ativos,
// entryDate → endDate para quem já saiu) × ARPU. Metodologia escolhida por
// ser a que a base real de mentorados sustenta diretamente (datas de entrada
// e saída), em vez da fórmula clássica ARPU ÷ churn — que exige uma taxa de
// churn mensal estável, o que a base ainda não tem histórico para afirmar.
// ---------------------------------------------------------------------------

export function computeAverageTenureMonths(
  customers: Pick<Customer, "entryDate" | "endDate" | "status">[],
  now: Date
) {
  if (customers.length === 0) return null;
  const months = customers.map((c) => {
    const end = c.status === "cancelado" && c.endDate ? c.endDate : now;
    const days = Math.max(0, (end.getTime() - c.entryDate.getTime()) / 86400000);
    return days / 30.44;
  });
  return months.reduce((s, m) => s + m, 0) / months.length;
}

export function computeLtv(arpu: number | null, averageTenureMonths: number | null) {
  if (arpu === null || averageTenureMonths === null || averageTenureMonths <= 0) return null;
  return arpu * averageTenureMonths;
}

// ---------------------------------------------------------------------------
// eNPS — metodologia padrão: %promotores (nota 9-10) − %detratores (nota 0-6),
// calculada sobre as notas reais registradas em CustomerExperience.
// ---------------------------------------------------------------------------

export function computeEnps(scores: number[]) {
  if (scores.length === 0) return null;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const pct = ((promoters - detractors) / scores.length) * 100;
  return {
    score: Math.round(pct),
    responses: scores.length,
    promoters,
    neutrals: scores.length - promoters - detractors,
    detractors,
  };
}

// ---------------------------------------------------------------------------
// Health Score — composto ponderado de fatores reais. Um fator só entra na
// média se houver dado suficiente para calculá-lo (não assume 0 por
// ausência de dado — um cliente novo sem eventos ainda não é "ruim").
// Pesos documentados aqui; ajuste só neste lugar.
// ---------------------------------------------------------------------------

export type HealthTier = "saudavel" | "atencao" | "risco" | "sem_dados";

export const HEALTH_TIER_META: Record<HealthTier, { label: string }> = {
  saudavel: { label: "Saudável" },
  atencao: { label: "Atenção" },
  risco: { label: "Risco" },
  sem_dados: { label: "Sem dados" },
};

export function tierFromScore(score: number | null): HealthTier {
  if (score === null) return "sem_dados";
  if (score >= 70) return "saudavel";
  if (score >= 45) return "atencao";
  return "risco";
}

export function computeHealthScore(params: {
  now: Date;
  customer: Pick<Customer, "renewalDate" | "status">;
  lastInteractionAt: Date | null;
  attendances: Pick<EventAttendee, "confirmed" | "checkedIn">[];
  experienceScores: number[];
  openHighPriorityTasks: number;
}): { score: number | null; tier: HealthTier; factors: { label: string; value: number }[] } {
  const factors: { label: string; value: number; weight: number }[] = [];

  // Recência de contato: 100 se contato <=7 dias, decai linearmente até 0 aos 60 dias.
  if (params.lastInteractionAt) {
    const days = (params.now.getTime() - params.lastInteractionAt.getTime()) / 86400000;
    const value = Math.max(0, Math.min(100, 100 - ((days - 7) / 53) * 100));
    factors.push({ label: "Recência de contato", value, weight: 25 });
  }

  // Participação em eventos: presentes ÷ confirmados.
  if (params.attendances.length > 0) {
    const confirmed = params.attendances.filter((a) => a.confirmed).length;
    const present = params.attendances.filter((a) => a.checkedIn).length;
    const value = confirmed > 0 ? (present / confirmed) * 100 : 0;
    factors.push({ label: "Participação em eventos", value, weight: 25 });
  }

  // Experiência média (nota 0-10 -> 0-100).
  if (params.experienceScores.length > 0) {
    const avg = params.experienceScores.reduce((s, v) => s + v, 0) / params.experienceScores.length;
    factors.push({ label: "Experiência média", value: avg * 10, weight: 25 });
  }

  // Tarefas críticas/altas em aberto: penaliza.
  const taskValue = Math.max(0, 100 - params.openHighPriorityTasks * 25);
  factors.push({ label: "Tarefas em aberto", value: taskValue, weight: 15 });

  // Proximidade da renovação sem sinal de tratativa: leve penalidade se <30 dias.
  if (params.customer.renewalDate) {
    const daysToRenewal = (params.customer.renewalDate.getTime() - params.now.getTime()) / 86400000;
    const value = daysToRenewal > 30 ? 100 : Math.max(0, (daysToRenewal / 30) * 100);
    factors.push({ label: "Janela de renovação", value, weight: 10 });
  }

  if (factors.length === 0) return { score: null, tier: "sem_dados", factors: [] };

  const totalWeight = factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.round(factors.reduce((s, f) => s + f.value * f.weight, 0) / totalWeight);

  return { score, tier: tierFromScore(score), factors: factors.map((f) => ({ label: f.label, value: Math.round(f.value) })) };
}

// ---------------------------------------------------------------------------
// Alertas — computados ao vivo, nunca armazenados. Cada alerta pode virar
// uma tarefa real com um clique (ver createTaskFromAlertAction).
// ---------------------------------------------------------------------------

export type CsAlert = {
  customerId: string;
  customerName: string;
  severity: "critico" | "atencao";
  message: string;
};

export function buildAlerts(params: {
  now: Date;
  customers: (Pick<Customer, "id" | "name" | "renewalDate" | "contractUrl" | "csId"> & {
    healthTier: HealthTier;
  })[];
  lastInteractionByCustomer: Map<string, Date>;
  overdueTasksByCustomer: Map<string, number>;
}): CsAlert[] {
  const alerts: CsAlert[] = [];
  const in60 = new Date(params.now.getTime() + 60 * 86400000);

  for (const c of params.customers) {
    if (c.renewalDate && c.renewalDate >= params.now && c.renewalDate <= in60) {
      alerts.push({
        customerId: c.id,
        customerName: c.name,
        severity: "atencao",
        message: "Renovação nos próximos 60 dias",
      });
    }
    const lastContact = params.lastInteractionByCustomer.get(c.id);
    const daysSince = lastContact ? (params.now.getTime() - lastContact.getTime()) / 86400000 : null;
    if (daysSince === null || daysSince > 30) {
      alerts.push({
        customerId: c.id,
        customerName: c.name,
        severity: "critico",
        message: daysSince === null ? "Nenhuma interação registrada" : "Sem interação há mais de 30 dias",
      });
    }
    if (c.healthTier === "risco") {
      alerts.push({
        customerId: c.id,
        customerName: c.name,
        severity: "critico",
        message: "Health Score em risco",
      });
    }
    if (!c.contractUrl) {
      alerts.push({
        customerId: c.id,
        customerName: c.name,
        severity: "atencao",
        message: "Contrato não localizado",
      });
    }
    const overdue = params.overdueTasksByCustomer.get(c.id) ?? 0;
    if (overdue > 0) {
      alerts.push({
        customerId: c.id,
        customerName: c.name,
        severity: "critico",
        message: `${overdue} tarefa${overdue > 1 ? "s" : ""} atrasada${overdue > 1 ? "s" : ""}`,
      });
    }
  }

  return alerts;
}
