import { PrismaClient, KpiType, Periodicity, EventStatus, FinanceCategoryKind, CustomerStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { writeFileSync } from "fs";
import { join } from "path";
import csImportRaw from "./data/cs-import.json";
import csActionCalendarRaw from "./data/cs-action-calendar.json";
import performanceTrafegoRaw from "./data/performance-trafego.json";
import sponsorshipsRaw from "./data/sponsorships.json";

type CsImportRow = {
  name: string;
  product: string;
  csKey: "camila" | "alessandra" | "giordana";
  entryDate: string | null;
  renewalDate: string | null;
  status: CustomerStatus;
  contractValue: number | null;
  lastContactAt: string | null;
  nextContactAt: string | null;
  renewalPlannedValue: number | null;
  renewalPlannedValueRaw: string | null;
  notes: string | null;
  meetings: { label: string; date: string }[];
  renewalRealized: { dueDate: string | null; realizedValue: number | null; notes: string } | null;
  statusOverride: CustomerStatus | null;
  endDateOverride: string | null;
  source: string;
};
const csImport = csImportRaw as CsImportRow[];

const prisma = new PrismaClient();

// tiny deterministic PRNG so re-seeding produces the same passwords
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const passwordRng = makeRng(7);
const DIACRITICS = new RegExp("[̀-ͯ]", "g");
function generatePassword(firstName: string) {
  const digits = String(1000 + Math.floor(passwordRng() * 9000));
  const ascii = firstName.normalize("NFD").replace(DIACRITICS, "");
  return `BL#${ascii}${digits}`;
}

async function main() {
  console.log("Limpando banco...");
  await prisma.notification.deleteMany();
  await prisma.payable.deleteMany();
  await prisma.receivable.deleteMany();
  await prisma.financeEntry.deleteMany();
  await prisma.financeCategory.deleteMany();
  await prisma.cashMovement.deleteMany();
  await prisma.cashAccount.deleteMany();
  await prisma.eventNote.deleteMany();
  await prisma.eventAttendeeCheckin.deleteMany();
  await prisma.eventAttendee.deleteMany();
  await prisma.eventSponsorPayment.deleteMany();
  await prisma.eventSponsor.deleteMany();
  await prisma.eventBudgetLine.deleteMany();
  await prisma.eventAgendaItem.deleteMany();
  await prisma.eventDay.deleteMany();
  await prisma.event.deleteMany();
  await prisma.muralComment.deleteMany();
  await prisma.muralReaction.deleteMany();
  await prisma.muralPost.deleteMany();
  await prisma.libraryItem.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.rhReview.deleteMany();
  await prisma.training.deleteMany();
  await prisma.contentCalendarPost.deleteMany();
  await prisma.socialSellingLead.deleteMany();
  await prisma.podcastEpisode.deleteMany();
  await prisma.socialProfile.deleteMany();
  await prisma.csActionCalendarItem.deleteMany();
  await prisma.csAction.deleteMany();
  await prisma.performanceMetric.deleteMany();
  await prisma.performanceSection.deleteMany();
  await prisma.sponsorship.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.taskChecklistItem.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.kpiTarget.deleteMany();
  await prisma.kpiEntry.deleteMany();
  await prisma.kpi.deleteMany();
  await prisma.membership.deleteMany();
  await prisma.user.deleteMany();
  await prisma.area.deleteMany();

  console.log("Criando áreas...");
  const areaDefs = [
    { slug: "operacoes", name: "Operações", description: "Liderança geral dos líderes, prazos e cobrança das entregas de todas as áreas.", order: 1 },
    { slug: "social", name: "Social", description: "Conteúdo, redes sociais e presença de marca.", order: 2 },
    { slug: "comercial", name: "Comercial", description: "Vendas, funil e relacionamento com leads.", order: 3 },
    { slug: "juridico", name: "Jurídico", description: "Contratos, compliance e riscos legais.", order: 4 },
    { slug: "financeiro", name: "Financeiro", description: "Receita, custos e saúde financeira.", order: 5 },
    { slug: "cs", name: "Customer Success", description: "Carteira de mentorados Club e Tração, sucesso e retenção.", order: 6 },
    { slug: "eventos", name: "Eventos", description: "Imersões, summits, experiences e jantares com mentorados.", order: 7 },
  ];
  const areas: Record<string, Awaited<ReturnType<typeof prisma.area.create>>> = {};
  for (const def of areaDefs) {
    areas[def.slug] = await prisma.area.create({ data: def });
  }

  console.log("Criando pessoas (com senha individual)...");
  // IMPORTANTE: cada pessoa tem sua própria senha, gerada abaixo e listada
  // em CREDENTIALS.md (não versionado) ao final do seed.
  const peopleDefs = [
    // Sócios — visão global da empresa (alguns usam e-mail pessoal de cadastro, não @brandlegacy.com.br)
    { key: "dom", name: "Dom Barros", email: "domicianomv@gmail.com", title: "Sócio", initials: "DB", isGlobalAdmin: true },
    { key: "carol", name: "Carol Viudes", email: "carolinaviudes@brandlegacy.com.br", title: "Sócia", initials: "CV", isGlobalAdmin: true },
    { key: "lucasCaricatti", name: "Lucas Caricatti", email: "lucas@brandlegacy.com.br", title: "Sócio", initials: "LC", isGlobalAdmin: true },
    { key: "dih", name: "Diego Santana", email: "contato@diegosantana.me", title: "Sócio", initials: "DS", isGlobalAdmin: true },

    // Operações — lidera o time de líderes
    { key: "marcus", name: "Marcus", email: "operacoes@brandlegacy.com.br", title: "Operações — lidera o time de líderes", initials: "MA", isGlobalAdmin: true },

    // Líderes de área
    { key: "nubia", name: "Núbia", email: "nubiapradogp@gmail.com", title: "Líder de Projetos", initials: "NU" },
    { key: "lara", name: "Lara", email: "lara.pujalte@brandlegacy.com.br", title: "Líder de Social", initials: "LA" },
    { key: "igor", name: "Igor", email: "igor.luis@brandlegacy.com.br", title: "Líder de Eventos", initials: "IG" },
    { key: "gabriel", name: "Gabriel Silva", email: "gabriel@brandlegacy.com.br", title: "Designer", initials: "GS" },
    { key: "guilherme", name: "Guilherme Rocha", email: "guilherme.rocha@brandlegacy.com.br", title: "Editor de Vídeo", initials: "GR" },
    { key: "karina", name: "Karina Carvalho", email: "karina.carvalho@brandlegacy.com.br", title: "Líder Comercial", initials: "KC" },
    { key: "karinaMeotti", name: "Karina Meotti", email: "karina.meotti@brandlegacy.com.br", title: "Social Selling", initials: "KM" },
    { key: "renzo", name: "Renzo Pagio", email: "renzo.pagio@brandlegacy.com.br", title: "Closer", initials: "RP" },
    { key: "lucas", name: "Lucas Carvalho", email: "lucas.carvalho@brandlegacy.com.br", title: "Closer", initials: "LU" },
    { key: "thiago", name: "Thiago", email: "thiago@brandlegacy.com.br", title: "SDR", initials: "TH" },
    { key: "isabella", name: "Isabella", email: "isabella@brandlegacy.com.br", title: "Líder Jurídico", initials: "IS" },
    { key: "william", name: "William", email: "willian.tavares@brandlegacy.com.br", title: "Líder Financeiro", initials: "WI" },
    { key: "camila", name: "Camila", email: "camila.leite@brandlegacy.com.br", title: "Líder de CS", initials: "CA" },
    { key: "alessandra", name: "Alessandra", email: "alessandra.siqueira@brandlegacy.com.br", title: "Líder de CS", initials: "AL" },
    // Identificada na planilha real de mentorados como CS responsável por
    // parte da carteira — provisionada aqui pela mesma razão que os demais.
    { key: "giordana", name: "Giordana Konrath", email: "giordana.konrath@brandlegacy.com.br", title: "CS", initials: "GK" },
  ];

  const people: Record<string, Awaited<ReturnType<typeof prisma.user.create>>> = {};
  const credentials: { name: string; email: string; password: string }[] = [];
  for (const def of peopleDefs) {
    const password = generatePassword(def.name.split(" ")[0]);
    const passwordHash = await bcrypt.hash(password, 10);
    people[def.key] = await prisma.user.create({
      data: {
        name: def.name,
        email: def.email,
        title: def.title,
        avatarInitials: def.initials,
        passwordHash,
        isGlobalAdmin: def.isGlobalAdmin ?? false,
      },
    });
    credentials.push({ name: def.name, email: def.email, password });
  }

  console.log("Criando vínculos (pessoa → área → cargo)...");
  const memberships: Array<{ userKey: string; areaSlug: string; role: "lider" | "colaborador"; title: string }> = [
    { userKey: "marcus", areaSlug: "operacoes", role: "lider", title: "Operações" },
    { userKey: "nubia", areaSlug: "operacoes", role: "lider", title: "Líder de Projetos" },
    { userKey: "lara", areaSlug: "social", role: "lider", title: "Líder de Social" },
    { userKey: "igor", areaSlug: "social", role: "colaborador", title: "Analista de Marketing" },
    { userKey: "igor", areaSlug: "eventos", role: "lider", title: "Líder de Eventos" },
    { userKey: "gabriel", areaSlug: "social", role: "colaborador", title: "Designer" },
    { userKey: "guilherme", areaSlug: "social", role: "colaborador", title: "Editor de Vídeo" },
    { userKey: "karina", areaSlug: "comercial", role: "lider", title: "Líder Comercial — Head" },
    { userKey: "karinaMeotti", areaSlug: "comercial", role: "colaborador", title: "Social Selling" },
    { userKey: "renzo", areaSlug: "comercial", role: "colaborador", title: "Closer" },
    { userKey: "lucas", areaSlug: "comercial", role: "colaborador", title: "Closer" },
    { userKey: "thiago", areaSlug: "comercial", role: "colaborador", title: "SDR" },
    { userKey: "isabella", areaSlug: "juridico", role: "lider", title: "Líder Jurídico" },
    { userKey: "william", areaSlug: "financeiro", role: "lider", title: "Líder Financeiro" },
    { userKey: "camila", areaSlug: "cs", role: "lider", title: "Líder de CS" },
    { userKey: "alessandra", areaSlug: "cs", role: "lider", title: "Líder de CS" },
    { userKey: "giordana", areaSlug: "cs", role: "colaborador", title: "CS" },
  ];
  for (const m of memberships) {
    await prisma.membership.create({
      data: {
        userId: people[m.userKey].id,
        areaId: areas[m.areaSlug].id,
        role: m.role,
        title: m.title,
      },
    });
  }

  console.log("Criando catálogo de indicadores (sem metas inventadas — cada líder define a própria meta)...");
  // O catálogo (nome/unidade/periodicidade/responsável) é estrutura da
  // plataforma, definida junto com cada líder de área. Os NÚMEROS (metas e
  // resultados) não são inventados: toda meta fica null até o líder
  // cadastrar a sua, e todo resultado fica vazio até alguém preencher — com
  // a única exceção documentada abaixo (Receita Comercial, que usa
  // histórico real informado pela Operação).
  type KpiDef = {
    areaSlug: string;
    name: string;
    description: string;
    type: KpiType;
    unit: string;
    periodicity: Periodicity;
    cumulative: boolean;
    higherIsBetter: boolean;
    responsibleKey: string;
  };

  const kpiDefs: KpiDef[] = [
    // Operações não tem KPIs manuais: "Pontualidade de entregas" e "Tarefas
    // atrasadas (todas as áreas)" são calculadas direto do Workflow — ver
    // computeOperationsStats em src/lib/operations.ts.

    { areaSlug: "social", name: "Leads gerados via Social", description: "Leads captados por conteúdo orgânico e ações de Social.", type: KpiType.quantidade, unit: "leads", periodicity: Periodicity.mensal, cumulative: true, higherIsBetter: true, responsibleKey: "lara" },
    { areaSlug: "social", name: "Engajamento médio", description: "Taxa média de engajamento nas publicações do mês.", type: KpiType.percentual, unit: "%", periodicity: Periodicity.mensal, cumulative: false, higherIsBetter: true, responsibleKey: "lara" },
    { areaSlug: "social", name: "Publicações no mês", description: "Peças publicadas nos canais oficiais.", type: KpiType.quantidade, unit: "posts", periodicity: Periodicity.mensal, cumulative: true, higherIsBetter: true, responsibleKey: "lara" },
    { areaSlug: "social", name: "Receita gerada pelo Social", description: "Faturamento com origem rastreável em conteúdo/social selling.", type: KpiType.moeda, unit: "R$", periodicity: Periodicity.mensal, cumulative: true, higherIsBetter: true, responsibleKey: "igor" },
    { areaSlug: "social", name: "Vendas de Imersão (cadeiras)", description: "Cadeiras da Imersão vendidas com origem em conteúdo/social selling.", type: KpiType.quantidade, unit: "cadeiras", periodicity: Periodicity.mensal, cumulative: true, higherIsBetter: true, responsibleKey: "lara" },

    { areaSlug: "comercial", name: "Receita", description: "Receita reconhecida no período (negócios ganhos). Mix planejado: 50% consultoria gratuita, 20% eventos, 15% outbound/inbound, 15% renovação e upsell.", type: KpiType.moeda, unit: "R$", periodicity: Periodicity.mensal, cumulative: true, higherIsBetter: true, responsibleKey: "karina" },
    { areaSlug: "comercial", name: "Vendas fechadas", description: "Quantidade de negócios ganhos no período.", type: KpiType.quantidade, unit: "vendas", periodicity: Periodicity.mensal, cumulative: true, higherIsBetter: true, responsibleKey: "karina" },
    { areaSlug: "comercial", name: "Ticket médio", description: "Receita dividida pelo número de vendas.", type: KpiType.moeda, unit: "R$", periodicity: Periodicity.mensal, cumulative: false, higherIsBetter: true, responsibleKey: "karina" },
    { areaSlug: "comercial", name: "Reuniões realizadas", description: "Reuniões comerciais realizadas no período, geral (todos os funis).", type: KpiType.quantidade, unit: "reuniões", periodicity: Periodicity.mensal, cumulative: true, higherIsBetter: true, responsibleKey: "thiago" },
    { areaSlug: "comercial", name: "Follow-ups vencidos", description: "Leads sem retorno após a data combinada.", type: KpiType.quantidade, unit: "leads", periodicity: Periodicity.diaria, cumulative: false, higherIsBetter: false, responsibleKey: "karina" },

    { areaSlug: "juridico", name: "Contratos revisados no prazo", description: "% de contratos revisados dentro do SLA jurídico.", type: KpiType.percentual, unit: "%", periodicity: Periodicity.mensal, cumulative: false, higherIsBetter: true, responsibleKey: "isabella" },
    { areaSlug: "juridico", name: "Tempo médio de análise contratual", description: "Dias corridos entre o recebimento e a devolutiva jurídica.", type: KpiType.tempo, unit: "dias", periodicity: Periodicity.mensal, cumulative: false, higherIsBetter: false, responsibleKey: "isabella" },

    // Financeiro não tem KPIs manuais: margem líquida, inadimplência e saldo
    // de caixa são calculados direto do DFC/Caixa/Contas a receber — ver
    // /financeiro/indicadores.

    { areaSlug: "cs", name: "NPS da mentoria", description: "Net Promoter Score consolidado dos mentorados ativos (Club + Tração).", type: KpiType.media, unit: "pts", periodicity: Periodicity.mensal, cumulative: false, higherIsBetter: true, responsibleKey: "camila" },
    { areaSlug: "cs", name: "Taxa de renovação", description: "% de contratos que renovaram ao vencer.", type: KpiType.percentual, unit: "%", periodicity: Periodicity.mensal, cumulative: false, higherIsBetter: true, responsibleKey: "camila" },
    { areaSlug: "cs", name: "Churn mensal", description: "% de mentorados que encerraram o contrato no período.", type: KpiType.percentual, unit: "%", periodicity: Periodicity.mensal, cumulative: false, higherIsBetter: false, responsibleKey: "alessandra" },

    // Eventos não tem KPIs mensais fabricados: "Ingressos vendidos" é uma
    // métrica do funil Comercial, e Budget/NPS já são acompanhados por
    // evento (não por mês) diretamente na página de cada evento — ver
    // computeEventStats. Um KPI mensal "genérico" não faz sentido aqui.
  ];

  const kpis: Record<string, Awaited<ReturnType<typeof prisma.kpi.create>>> = {};
  for (const def of kpiDefs) {
    const kpi = await prisma.kpi.create({
      data: {
        areaId: areas[def.areaSlug].id,
        name: def.name,
        description: def.description,
        type: def.type,
        unit: def.unit,
        periodicity: def.periodicity,
        target: null,
        cumulative: def.cumulative,
        higherIsBetter: def.higherIsBetter,
        responsibleId: people[def.responsibleKey].id,
      },
    });
    kpis[`${def.areaSlug}:${def.name}`] = kpi;
  }

  console.log("Carregando metas REAIS de agosto (Social)...");
  // Fonte: dashboard real do time de Social (Notion) para agosto/2026.
  await prisma.kpiTarget.create({
    data: { kpiId: kpis["social:Receita gerada pelo Social"].id, periodKey: "2026-08", target: 300000 },
  });
  await prisma.kpiTarget.create({
    data: { kpiId: kpis["social:Vendas de Imersão (cadeiras)"].id, periodKey: "2026-08", target: 10 },
  });

  console.log("Carregando histórico REAL de faturamento (Comercial → Receita)...");
  // Fonte: valores informados diretamente pelo usuário (Marcus/Operações).
  // Um lançamento por mês, com o total exato do mês — sem distribuir em
  // dias, porque a planilha de origem não tem granularidade diária e
  // inventar uma quebra dia a dia seria fabricar dado que não existe.
  // Nenhum outro KPI da plataforma recebe número fabricado — ficam vazios
  // para os líderes preencherem.
  const receitaKpi = kpis["comercial:Receita"];
  const REALIZADO_MENSAL: { month: number; total: number }[] = [
    { month: 0, total: 195000 }, // Janeiro
    { month: 1, total: 443000 }, // Fevereiro
    { month: 2, total: 1600000 }, // Março
    { month: 3, total: 590000 }, // Abril
    { month: 4, total: 261823 }, // Maio
    { month: 5, total: 682900 }, // Junho
    { month: 6, total: 812300 }, // Julho
  ];
  for (const { month, total } of REALIZADO_MENSAL) {
    const daysInMonth = new Date(2026, month + 1, 0).getDate();
    await prisma.kpiEntry.create({
      data: {
        kpiId: receitaKpi.id,
        value: total,
        note: "Total real do mês",
        date: new Date(2026, month, daysInMonth, 12, 0, 0),
        createdById: people.karina.id,
      },
    });
  }
  // Agosto (mês corrente, "hoje" = 18/08): realizado parcial real até a
  // data — um único lançamento, os dias seguintes ficam para o líder.
  await prisma.kpiEntry.create({
    data: {
      kpiId: receitaKpi.id,
      value: 1180000,
      note: "Realizado parcial até 18/08",
      date: new Date(2026, 7, 18, 12, 0, 0),
      createdById: people.karina.id,
    },
  });

  console.log("Carregando metas REAIS mensais (Comercial → Receita)...");
  const METAS_MENSAIS: { month: number; target: number }[] = [
    { month: 7, target: 2380941.82 }, // Agosto
    { month: 8, target: 5860438.07 }, // Setembro
    { month: 9, target: 2960857.86 }, // Outubro
    { month: 10, target: 3520062.61 }, // Novembro
    { month: 11, target: 5692676.64 }, // Dezembro
  ];
  for (const { month, target } of METAS_MENSAIS) {
    const periodKey = `2026-${String(month + 1).padStart(2, "0")}`;
    await prisma.kpiTarget.create({
      data: { kpiId: receitaKpi.id, periodKey, target },
    });
  }

  // Projetos, tarefas, itens de Biblioteca e publicações do Mural NÃO são
  // semeados com exemplos fabricados — cada time cria e usa a plataforma a
  // partir de zero, como pedido: "eles têm que criar e usar".

  console.log("Criando eventos (histórico real 2026)...");
  // Fonte: planilha "Dashboard Brand Legacy — Eventos 2026", aba Resumo
  // Executivo. Os totais (budget, inscritos, presentes, NPS, patrocinadores)
  // são reais. Não há lista nominal de confirmados/patrocinadores na
  // planilha de origem, então os eventos já realizados guardam o resumo
  // como "snapshot histórico" — os módulos de confirmados e patrocínios
  // (EventAttendee/EventSponsor) começam vazios e são o que o Igor passa a
  // usar dali pra frente. Nenhum mural/nota de evento é fabricado.
  type EventDef = {
    name: string;
    type: string;
    status: EventStatus;
    start: Date;
    end: Date;
    location?: string;
    budgetPlanned: number | null;
    budgetActual: number | null;
    registrationGoal?: number | null;
    registeredCount?: number | null;
    presentCount?: number | null;
    payingCount?: number | null;
    mentoradosCount?: number | null;
    guestCount?: number | null;
    noShowCount?: number | null;
    sponsorCount?: number | null;
    npsAverage?: number | null;
    description?: string;
  };

  const eventDefs: EventDef[] = [
    {
      name: "Imersão Scale — Março 2026",
      type: "Imersão",
      status: EventStatus.realizado,
      start: new Date("2026-03-19T09:00:00"),
      end: new Date("2026-03-21T18:00:00"),
      budgetPlanned: 80000,
      budgetActual: 93513.67,
      registeredCount: 154,
      sponsorCount: 7,
      npsAverage: 90,
      description: "Primeira imersão trimestral do ano.",
    },
    {
      name: "Coquetel — Abril 2026",
      type: "Jantar",
      status: EventStatus.realizado,
      start: new Date("2026-04-15T19:00:00"),
      end: new Date("2026-04-15T23:00:00"),
      budgetPlanned: null,
      budgetActual: 26826,
      registeredCount: 86,
      presentCount: 68,
      mentoradosCount: 26,
      guestCount: 27,
      noShowCount: 17,
      sponsorCount: 7,
      description: "Evento sem ingresso pago — networking com Club e Tração.",
    },
    {
      name: "Imersão Scale — Julho 2026",
      type: "Imersão",
      status: EventStatus.realizado,
      start: new Date("2026-07-16T09:00:00"),
      end: new Date("2026-07-18T18:00:00"),
      budgetPlanned: 80000,
      budgetActual: 117133.72,
      registeredCount: 143,
      presentCount: 94,
      payingCount: 36,
      mentoradosCount: 44,
      guestCount: 14,
      noShowCount: 49,
      sponsorCount: 4,
      npsAverage: 100,
    },
    {
      name: "Experience — Agosto 2026",
      type: "Experience",
      status: EventStatus.confirmado,
      start: new Date("2026-08-22T09:00:00"),
      end: new Date("2026-08-23T18:00:00"),
      budgetPlanned: 50000,
      budgetActual: 31967,
      registeredCount: 20,
      presentCount: 3,
      payingCount: 5,
      description: "Experience semestral com os mentorados — acontece em 4 dias.",
    },
    {
      name: "Imersão Scale — Setembro 2026",
      type: "Imersão",
      status: EventStatus.planejamento,
      start: new Date("2026-09-17T09:00:00"),
      end: new Date("2026-09-19T18:00:00"),
      budgetPlanned: 80000,
      budgetActual: null,
    },
    {
      name: "Summit — Outubro 2026",
      type: "Summit",
      status: EventStatus.planejamento,
      start: new Date("2026-10-22T09:00:00"),
      end: new Date("2026-10-24T18:00:00"),
      budgetPlanned: null,
      budgetActual: null,
      description: "Evento maior do segundo semestre — até 300 pessoas (Tração + Club + pagantes).",
    },
    {
      name: "Imersão Scale — Dezembro 2026",
      type: "Imersão",
      status: EventStatus.planejamento,
      start: new Date("2026-12-03T09:00:00"),
      end: new Date("2026-12-05T18:00:00"),
      budgetPlanned: 80000,
      budgetActual: null,
    },
  ];

  const events: Record<string, Awaited<ReturnType<typeof prisma.event.create>>> = {};
  for (const def of eventDefs) {
    const event = await prisma.event.create({
      data: {
        name: def.name,
        type: def.type,
        status: def.status,
        startDate: def.start,
        endDate: def.end,
        location: def.location ?? null,
        description: def.description ?? null,
        budgetPlanned: def.budgetPlanned,
        responsibleId: people.igor.id,
        registrationGoal: def.registrationGoal ?? null,
        registeredCount: def.registeredCount ?? null,
        presentCount: def.presentCount ?? null,
        payingCount: def.payingCount ?? null,
        mentoradosCount: def.mentoradosCount ?? null,
        guestCount: def.guestCount ?? null,
        noShowCount: def.noShowCount ?? null,
        sponsorCount: def.sponsorCount ?? null,
        npsAverage: def.npsAverage ?? null,
      },
    });
    events[def.name] = event;

    if (def.budgetActual !== null) {
      await prisma.eventBudgetLine.create({
        data: {
          eventId: event.id,
          category: "outro",
          item: "Consolidado (histórico) — gasto total apurado na operação do evento",
          plannedValue: def.budgetPlanned ?? 0,
          actualValue: def.budgetActual,
          status: "Apurado",
        },
      });
    }
  }

  console.log("Criando Financeiro (DRE real 2025/26 + posição de caixa real)...");
  // Fonte: "DFC - BRAND LEGACY 2025_26.xlsx", abas "DRE - 2025", "DFC - 2026
  // (Versão Atual)" e "Caixa". São números reais, lançamento por categoria —
  // sub-subcategorias (ex.: CSV por evento) não foram trazidas para manter o
  // schema simples; os totais de cada categoria aqui batem com a planilha.
  // Contas a Pagar/Receber ficam vazias: a planilha só tinha um recorte
  // antigo (Dez/Jan), não o momento atual — fica para o William preencher.
  type DreRow = {
    name: string;
    kind: FinanceCategoryKind;
    entries: Record<string, { realizado?: number; previsto?: number }>;
  };

  const MESES_2025 = ["04", "05", "06", "07", "08", "09", "10", "11", "12"];
  function y25(values: number[]): Record<string, { realizado: number }> {
    const out: Record<string, { realizado: number }> = {};
    MESES_2025.forEach((m, i) => {
      if (values[i] !== 0) out[`2025-${m}`] = { realizado: values[i] };
    });
    return out;
  }

  const dre2025: DreRow[] = [
    { name: "Club", kind: FinanceCategoryKind.receita, entries: y25([650310.00, 66273.27, 100523.27, 66273.27, 366166.36, 76716.36, 138342.01, 196302.39, 629955.00]) },
    { name: "Tração", kind: FinanceCategoryKind.receita, entries: y25([0, 0, 40000.00, 5000.00, 34500.00, 47100.00, 44006.74, 45225.11, 25925.11]) },
    { name: "Imersão", kind: FinanceCategoryKind.receita, entries: y25([583.08, 19373.08, 23683.08, 53077.08, 10283.08, 10283.08, 10283.08, 10283.08, 10283.08]) },
    { name: "Imersão - Scale", kind: FinanceCategoryKind.receita, entries: y25([0, 0, 0, 0, 0, 0, 50354.16, 87590.32, 19796.32]) },
    { name: "Patrocínio", kind: FinanceCategoryKind.receita, entries: y25([25000.00, 15000.00, 15000.00, 5000.00, 234209.09, 52250.00, 15000.00, 30000.00, 73666.66]) },
    { name: "Impostos", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 1644.50, 15005.48, 6430.59, 19552.43, 30727.26, 8329.80, 8350.89]) },
    { name: "Ferramentas", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 0, 0, 0, 0, 0, 0, 7732.58]) },
    { name: "CSV", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 131265.86, 147225.88, 73818.37, 58163.71, 26812.30, 39900.37, 68718.96]) },
    { name: "Divisão de Lucros", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 0, 0, 0, 40000.00, 40000.00, 40000.00, 340000.00]) },
    { name: "Folha | Equipe", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 64544.68, 79961.64, 54995.36, 63414.04, 68546.12, 80222.07, 88974.82]) },
    { name: "Comissão", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 0, 0, 25000.00, 0, 0, 0, 0]) },
    { name: "Despesas Administrativas", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 1281.87, 1281.87, 1299.04, 450.00, 2971.18, 1660.00, 1695.00]) },
    { name: "Reembolsos", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 18325.47, 80175.59, 59220.79, 57895.57, 88460.20, 102678.69, 1893.24]) },
    { name: "Outras Despesas", kind: FinanceCategoryKind.despesa, entries: y25([0, 0, 18500.00, 19004.00, 20832.44, 29256.56, 17000.00, 17000.00, 53069.52]) },
    { name: "Rescisões/Desistências", kind: FinanceCategoryKind.despesa, entries: y25([16900.00, 48689.09, 22279.99, 22279.99, 31979.99, 31979.99, 31979.99, 37979.99, 12799.99]) },
  ];

  // 2026: Jan-Jul = realizado; Ago = previsto + realizado (mês corrente);
  // Set-Dez = previsto (realizado vem quando o mês fechar).
  function y26(
    janJul: number[],
    ago: { p: number; r: number },
    set: number,
    out: number,
    nov: number,
    dez: number
  ): Record<string, { realizado?: number; previsto?: number }> {
    const result: Record<string, { realizado?: number; previsto?: number }> = {};
    ["01", "02", "03", "04", "05", "06", "07"].forEach((m, i) => {
      if (janJul[i] !== 0) result[`2026-${m}`] = { realizado: janJul[i] };
    });
    if (ago.p !== 0 || ago.r !== 0) {
      result["2026-08"] = {};
      if (ago.p !== 0) result["2026-08"].previsto = ago.p;
      if (ago.r !== 0) result["2026-08"].realizado = ago.r;
    }
    if (set !== 0) result["2026-09"] = { previsto: set };
    if (out !== 0) result["2026-10"] = { previsto: out };
    if (nov !== 0) result["2026-11"] = { previsto: nov };
    if (dez !== 0) result["2026-12"] = { previsto: dez };
    return result;
  }

  const dre2026: DreRow[] = [
    { name: "Club - Mentoria", kind: FinanceCategoryKind.receita, entries: y26([0, 0, 0, 0, 0, 0, 0], { p: 129457.98, r: 0 }, 93083.32, 43538.88, 43538.88, 34983.33) },
    { name: "Tração - Mentoria", kind: FinanceCategoryKind.receita, entries: y26([0, 0, 0, 0, 0, 0, 0], { p: 7889.99, r: 0 }, 9639.99, 7889.99, 7889.99, 7889.99) },
    { name: "Patrocínio", kind: FinanceCategoryKind.receita, entries: y26([51667.00, 46667.00, 75166.66, 18333.33, 35000.00, 30000.00, 35000.00], { p: 86544.99, r: 0 }, 13000.00, 8000.00, 3000.00, 3000.00) },
    { name: "Outros", kind: FinanceCategoryKind.receita, entries: y26([0, 0, 0, 0, 0, 0, 0], { p: 1000000.00, r: 1000000.00 }, 0, 0, 0, 0) },
    { name: "Impostos", kind: FinanceCategoryKind.despesa, entries: y26([22551.57, 7476.34, 3601.60, 12809.42, 11336.45, 5264.20, 11499.66], { p: 2100.00, r: 0 }, 73433.58, 6943.40, 3565.73, 3265.73) },
    { name: "Linha de Crédito", kind: FinanceCategoryKind.despesa, entries: y26([0, 0, 0, 0, 0, 0, 0], { p: 0, r: 0 }, 100833.33, 100833.33, 100833.33, 100833.33) },
    { name: "Tráfego Pago", kind: FinanceCategoryKind.despesa, entries: y26([31368.00, 51413.00, 97732.02, 67231.30, 95970.19, 79887.65, 106089.57], { p: 75207.94, r: 0 }, 45000.00, 45000.00, 45000.00, 45000.00) },
    { name: "Ferramentas", kind: FinanceCategoryKind.despesa, entries: y26([6401.45, 4565.15, 629.64, 0, 0, 96.99, 0], { p: 15627.77, r: 0 }, 16221.90, 16221.90, 16221.90, 16221.90) },
    { name: "CSV", kind: FinanceCategoryKind.despesa, entries: y26([27385.08, 14525.08, 131076.74, 36296.73, 6431.19, 69378.19, 47272.30], { p: 49069.32, r: 35528.24 }, 7533.50, 0, 0, 0) },
    { name: "Despesas Administrativas", kind: FinanceCategoryKind.despesa, entries: y26([1700.73, 7010.78, 5779.98, 8900.79, 4790.81, 8899.99, 9180.00], { p: 7599.36, r: 1639.99 }, 1639.99, 1639.99, 1639.99, 1639.99) },
    { name: "Pró-labore", kind: FinanceCategoryKind.despesa, entries: y26([40000.00, 40000.00, 40000.00, 80000.00, 80000.00, 80000.00, 80000.00], { p: 80000.00, r: 80000.00 }, 95000.00, 95000.00, 95000.00, 95000.00) },
    { name: "Distribuição de Lucros", kind: FinanceCategoryKind.despesa, entries: y26([0, 0, 0, 51139.47, 0, 50000.00, 0], { p: 154439.47, r: 154438.47 }, 0, 0, 0, 0) },
    { name: "Aquisição de Empresas", kind: FinanceCategoryKind.despesa, entries: y26([0, 0, 0, 0, 0, 0, 0], { p: 500000.00, r: 500000.00 }, 0, 0, 0, 0) },
    { name: "Investimento em Equipe | Time", kind: FinanceCategoryKind.despesa, entries: y26([74803.29, 75897.40, 85103.01, 112437.73, 128438.80, 122259.05, 141120.21], { p: 116745.67, r: 116745.67 }, 81666.67, 79000.00, 79000.00, 79000.00) },
    { name: "Outras Despesas", kind: FinanceCategoryKind.despesa, entries: y26([37843.58, 36450.42, 28654.07, 39283.21, 20164.66, 25435.49, 13080.24], { p: 25916.67, r: 23000.00 }, 12916.67, 12916.67, 12916.67, 12916.67) },
    { name: "Desistências (Mentorados)", kind: FinanceCategoryKind.despesa, entries: y26([4708.32, 0, 0, 0, 0, 0, 9050.00], { p: 29580.00, r: 0 }, 0, 0, 0, 0) },
  ];

  // Categorias com o mesmo nome nos dois anos viram uma única linha do DRE
  // (histórico contínuo); nomes diferentes ficam como categorias distintas,
  // exatamente como estão nas duas planilhas de origem.
  const allDreRows = [...dre2025, ...dre2026];
  const dreCategoryByName = new Map<string, Awaited<ReturnType<typeof prisma.financeCategory.create>>>();
  let dreOrder = 0;
  for (const row of allDreRows) {
    let category = dreCategoryByName.get(row.name);
    if (!category) {
      category = await prisma.financeCategory.create({
        data: { name: row.name, kind: row.kind, order: dreOrder++ },
      });
      dreCategoryByName.set(row.name, category);
    }
    for (const [periodKey, value] of Object.entries(row.entries)) {
      await prisma.financeEntry.upsert({
        where: { categoryId_periodKey: { categoryId: category.id, periodKey } },
        create: { categoryId: category.id, periodKey, ...value },
        update: value,
      });
    }
  }

  console.log("Criando posição de caixa real (contas + movimentações 17-31/08)...");
  const cashAccountDefs = [
    { name: "Cora", balance: 87.40 },
    { name: "Itaú", balance: 276604.06 },
    { name: "Asaas — Saldo disponível", balance: 0 },
    { name: "Asaas — Antecipar", balance: 0 },
    { name: "APPMax — Saldo", balance: 0 },
    { name: "APPMax — Antecipação", balance: 0 },
    { name: "Pagar.me", balance: 0 },
  ];
  const snapshotDate = new Date("2026-08-16T12:00:00");
  await prisma.cashAccount.createMany({
    data: cashAccountDefs.map((a) => ({ ...a, snapshotDate })),
  });

  // eventName só é preenchido quando a descrição original da planilha já
  // referenciava o evento explicitamente (ex.: "(Experience)") — não é um
  // vínculo inferido, é o mesmo vínculo que já estava no texto.
  const cashMovementDefs: { date: string; description: string; amount: number; eventName?: string }[] = [
    { date: "2026-08-17", description: "Apeiron (LPs)", amount: -3000 },
    { date: "2026-08-17", description: "Vivo Lucas", amount: -39.99 },
    { date: "2026-08-17", description: "Reembolso Igor (Experience)", amount: -1020.05, eventName: "Experience — Agosto 2026" },
    { date: "2026-08-17", description: "Reembolso Lara (Experience)", amount: -908.19, eventName: "Experience — Agosto 2026" },
    { date: "2026-08-17", description: "Reembolso Dom (Café)", amount: -213.02 },
    { date: "2026-08-17", description: "Foto e Vídeo (Nando)", amount: -23250.00 },
    { date: "2026-08-17", description: "Patrocínio — Ocean Drop", amount: 10000.00 },
    { date: "2026-08-18", description: "Cartão BL", amount: -42457.71 },
    { date: "2026-08-19", description: "Cartão do Jr.", amount: -59102.96 },
    { date: "2026-08-20", description: "Imposto", amount: -2100.00 },
    { date: "2026-08-25", description: "Foto e Vídeo — Abner (Experience)", amount: -5175.00, eventName: "Experience — Agosto 2026" },
    { date: "2026-08-31", description: "Desistência de mentorados", amount: -29580.00 },
  ];
  for (const m of cashMovementDefs) {
    await prisma.cashMovement.create({
      data: {
        date: new Date(`${m.date}T12:00:00`),
        description: m.description,
        amount: m.amount,
        eventId: m.eventName ? events[m.eventName].id : null,
      },
    });
  }

  // Notificações também não são fabricadas — nascem do uso real da
  // plataforma (tarefa atribuída, aprovação pendente etc.), não do seed.

  console.log("Criando perfis geridos pelo time de Social (reais)...");
  // 3 perfis administrados hoje (BL institucional, Dom, Carol) + os outros
  // 2 sócios que passam a ser tratados como influencers — escopo de
  // postagem (contentScope) fica vazio para o time combinar e preencher.
  const socialProfileDefs = [
    { name: "Brand Legacy (Institucional)", personKey: null, isInstitutional: true, reporteiUrl: "https://app.reportei.com/dashboard/C7iPy4RX139VJOVyTJ2eFHTEWP7icILX", order: 1 },
    { name: "Dom Barros", personKey: "dom", isInstitutional: false, reporteiUrl: "https://app.reportei.com/dashboard/e2b0OEvtzBhP4m6tw6r69paFdOPOcDZk", order: 2 },
    { name: "Carol Viudes", personKey: "carol", isInstitutional: false, reporteiUrl: "https://app.reportei.com/dashboard/S645PgIpOWBJhTwoGB4EkHTHVvpQLRw0", order: 3 },
    { name: "Lucas Caricatti", personKey: "lucasCaricatti", isInstitutional: false, reporteiUrl: null, order: 4 },
    { name: "Diego Santana", personKey: "dih", isInstitutional: false, reporteiUrl: null, order: 5 },
  ];
  const socialProfiles: Record<string, Awaited<ReturnType<typeof prisma.socialProfile.create>>> = {};
  for (const def of socialProfileDefs) {
    socialProfiles[def.name] = await prisma.socialProfile.create({
      data: {
        name: def.name,
        personId: def.personKey ? people[def.personKey].id : null,
        isInstitutional: def.isInstitutional,
        reporteiUrl: def.reporteiUrl,
        order: def.order,
      },
    });
  }

  console.log("Criando calendário de treinamentos (2ª sexta-feira de cada mês)...");
  // Temas e cadência combinados com o usuário; a descrição de cada tema é
  // conteúdo autoral (autorizado), não um dado de negócio inventado. NPS,
  // link do Meet e materiais ficam vazios — quem conduz o treinamento
  // preenche depois que ele acontece.
  function secondFriday(year: number, month: number) {
    const first = new Date(year, month, 1);
    const firstFriday = 1 + ((5 - first.getDay() + 7) % 7);
    return new Date(year, month, firstFriday + 7, 19, 0, 0);
  }

  const trainingDefs = [
    {
      theme: "Comunicação",
      date: secondFriday(2026, 8), // setembro (mês 8 = índice 0)
      description:
        "Como comunicar com clareza, ouvir ativamente e alinhar expectativas — dentro do time e com clientes.",
    },
    {
      theme: "Gestão do Tempo",
      date: secondFriday(2026, 9), // outubro
      description:
        "Priorização, foco e rotinas para entregar mais sem queimar a operação.",
    },
    {
      theme: "Liderança",
      date: secondFriday(2026, 10), // novembro
      description:
        "Fundamentos de liderança: dar feedback, delegar e desenvolver pessoas.",
    },
    {
      theme: "Planejamento Estratégico",
      date: secondFriday(2026, 11), // dezembro
      description:
        "Como planejar o próximo ano: metas, prioridades e desdobramento em ação.",
    },
  ];
  for (const t of trainingDefs) {
    await prisma.training.create({
      data: { theme: t.theme, description: t.description, date: t.date },
    });
  }

  console.log("Carregando base REAL de mentorados (Club/Tração)...");
  // Fonte: planilha real "PAINEL DE CONTROLE MENTORADOS - CLUB E TRAÇÃO"
  // fornecida pelo usuário, transformada em prisma/data/cs-import.json.
  // Linhas sem CS responsável identificável na planilha foram deliberadamente
  // omitidas (ver transform.js) em vez de receber um responsável adivinhado.
  for (const row of csImport) {
    // Jurídico (planilha DFC) tem prioridade sobre o STATUS informado na
    // planilha de mentorados: é a fonte real de "parou de pagar" (última
    // mensalidade confirmada em verde), ver transform2.js.
    const status = row.statusOverride ?? row.status;
    const endDate = row.endDateOverride ? new Date(`${row.endDateOverride}T12:00:00`) : null;

    const customer = await prisma.customer.create({
      data: {
        name: row.name,
        product: row.product,
        csId: people[row.csKey].id,
        entryDate: row.entryDate ? new Date(`${row.entryDate}T12:00:00`) : new Date(),
        renewalDate: row.renewalDate ? new Date(`${row.renewalDate}T12:00:00`) : null,
        status,
        endDate,
        contractValue: row.contractValue,
        lastContactAt: row.lastContactAt ? new Date(`${row.lastContactAt}T12:00:00`) : null,
        nextContactAt: row.nextContactAt ? new Date(`${row.nextContactAt}T12:00:00`) : null,
        notes: row.notes,
      },
    });

    const renewalDueDateSource = row.renewalDate ?? row.entryDate;
    if ((row.renewalPlannedValue !== null || row.renewalPlannedValueRaw) && renewalDueDateSource) {
      await prisma.customerRenewal.create({
        data: {
          customerId: customer.id,
          dueDate: new Date(`${renewalDueDateSource}T12:00:00`),
          plannedValue: row.renewalPlannedValue ?? 0,
          notes: row.renewalPlannedValue === null && row.renewalPlannedValueRaw ? row.renewalPlannedValueRaw : undefined,
        },
      });
    }

    // Upsell (Tração -> Club) registrado na planilha real conta como
    // renovação realizada — ver transform2.js.
    if (row.renewalRealized) {
      const dueDate = row.renewalRealized.dueDate ?? row.renewalDate ?? row.entryDate;
      if (dueDate) {
        await prisma.customerRenewal.create({
          data: {
            customerId: customer.id,
            dueDate: new Date(`${dueDate}T12:00:00`),
            plannedValue: row.renewalRealized.realizedValue ?? 0,
            realizedValue: row.renewalRealized.realizedValue,
            realizedDate: new Date(`${dueDate}T12:00:00`),
            status: "renovado",
            notes: row.renewalRealized.notes,
          },
        });
      }
    }

    for (const meeting of row.meetings) {
      await prisma.customerMeeting.create({
        data: {
          customerId: customer.id,
          type: "individual",
          label: meeting.label,
          date: new Date(`${meeting.date}T12:00:00`),
          createdById: people[row.csKey].id,
        },
      });
    }
  }

  console.log("Carregando calendário de ações real (referência, somente leitura)...");
  // Fonte: Google Sheets real do time ("Calendário de ações"), exportado via
  // CSV — ver prisma/data/cs-action-calendar.json.
  type CsActionCalendarRow = {
    month: string;
    date: string | null;
    time: string | null;
    eventName: string;
    responsible: string | null;
    audience: string | null;
    status: string | null;
    notes: string | null;
  };
  for (const item of csActionCalendarRaw as CsActionCalendarRow[]) {
    await prisma.csActionCalendarItem.create({
      data: {
        month: item.month,
        date: item.date,
        time: item.time,
        eventName: item.eventName,
        responsible: item.responsible,
        audience: item.audience,
        status: item.status,
        notes: item.notes,
      },
    });
  }

  console.log("Carregando Performance (Tráfego + funis comerciais) real...");
  // Fonte: planilha real de performance do time (aquisição, funis, social
  // selling, SDR, closers, renovação) — ver prisma/data/performance-trafego.json.
  type PerformanceSectionRow = {
    name: string;
    metrics: { label: string; target: string | null; realized: string | null }[];
  };
  for (const [sIdx, section] of (performanceTrafegoRaw as PerformanceSectionRow[]).entries()) {
    await prisma.performanceSection.create({
      data: {
        name: section.name,
        order: sIdx,
        metrics: {
          create: section.metrics.map((m, mIdx) => ({
            label: m.label,
            target: m.target,
            realized: m.realized,
            order: mIdx,
          })),
        },
      },
    });
  }

  console.log("Carregando histórico REAL de patrocínios...");
  // Fonte: planilha real de patrocínios do time — ver prisma/data/sponsorships.json.
  // Vínculo a Event só quando a categoria menciona um mês que bate com um
  // evento real já seedado (ver mapeamento abaixo) — nunca inventado.
  const allEventsForSponsor = await prisma.event.findMany();
  const monthEventMatch: Record<string, string> = {
    março: "março",
    marco: "março",
    julho: "julho",
    setembro: "setembro",
    dez: "dezembro",
    dezembro: "dezembro",
  };
  function matchSponsorshipEvent(category: string | null): string | null {
    if (!category) return null;
    const low = category.toLowerCase();
    for (const [key, monthWord] of Object.entries(monthEventMatch)) {
      if (low.includes(key)) {
        const ev = allEventsForSponsor.find((e) => e.name.toLowerCase().includes(monthWord));
        if (ev) return ev.id;
      }
    }
    return null;
  }
  type SponsorshipRow = {
    sponsorName: string;
    category: string | null;
    paymentMethod: string | null;
    contractTerm: string | null;
    competencia: string | null;
    dueDate: string | null;
    plannedValue: number | null;
    paidDate: string | null;
    paidValue: number | null;
    status: string | null;
    cashMonth: string | null;
    notes: string | null;
  };
  for (const row of sponsorshipsRaw as SponsorshipRow[]) {
    await prisma.sponsorship.create({
      data: {
        sponsorName: row.sponsorName,
        category: row.category,
        paymentMethod: row.paymentMethod,
        contractTerm: row.contractTerm,
        competencia: row.competencia,
        dueDate: row.dueDate ? new Date(`${row.dueDate}T12:00:00`) : null,
        plannedValue: row.plannedValue,
        paidDate: row.paidDate ? new Date(`${row.paidDate}T12:00:00`) : null,
        paidValue: row.paidValue,
        status: row.status,
        cashMonth: row.cashMonth,
        notes: row.notes,
        eventId: matchSponsorshipEvent(row.category),
      },
    });
  }

  console.log("Seed concluído.");

  const credsPath = join(__dirname, "..", "CREDENTIALS.md");
  const lines = [
    "# Credenciais individuais — Brand Legacy OS",
    "",
    "Gerado pelo seed em " + new Date().toISOString(),
    "",
    "Este arquivo NÃO é versionado (está no .gitignore). Guarde com cuidado e distribua",
    "cada senha de forma privada — ex: por WhatsApp/e-mail individual, não em grupo.",
    "",
    "| Nome | E-mail | Senha |",
    "| --- | --- | --- |",
    ...credentials.map((c) => `| ${c.name} | ${c.email} | ${c.password} |`),
    "",
  ];
  writeFileSync(credsPath, lines.join("\n"), "utf-8");
  console.log(`Credenciais individuais escritas em ${credsPath}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
