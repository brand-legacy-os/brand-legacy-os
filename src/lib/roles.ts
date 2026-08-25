/**
 * Fonte: "Brand Legacy — Descrição de Cargos & Responsabilidades" (v1.0,
 * agosto de 2026), fornecido pelo usuário. Texto reproduzido literalmente
 * por cargo — nunca inventado. Mapeado por e-mail (identificador estável
 * do usuário) para o cargo real descrito no documento.
 */
export type RoleProfile = {
  cargo: string;
  missao: string;
  atribuicoes: string[];
  softSkills: string[];
  hardSkills: string[];
  resultadoEsperado?: string;
};

const SOCIOS: RoleProfile = {
  cargo: "Sócio(a)",
  missao:
    "Definir a visão, o direcionamento estratégico e os princípios do Brand Legacy, garantindo crescimento, posicionamento e geração de valor.",
  atribuicoes: [
    "Definir visão, estratégia, prioridades e grandes decisões.",
    "Alinhar objetivos de crescimento, posicionamento, produtos e expansão.",
    "Decidir sobre investimentos, estrutura, pessoas e novos negócios.",
    "Representar e fortalecer a marca perante mercado, clientes e parceiros.",
    "Acompanhar resultados estratégicos e indicadores de alto nível.",
    "Construir relacionamentos e oportunidades estratégicas.",
    "Dar direcionamento aos líderes e proteger cultura e princípios.",
  ],
  softSkills: ["Visão estratégica", "Liderança", "Influência", "Tomada de decisão", "Comunicação executiva", "Orientação a resultados", "Relacionamento"],
  hardSkills: ["Estratégia empresarial", "Finanças e indicadores", "Mercado e posicionamento", "Produtos e oferta", "Governança", "Negociação", "Desenvolvimento de negócios"],
};

const CLOSER: RoleProfile = {
  cargo: "Closer",
  missao:
    "Converter oportunidades qualificadas em clientes, conduzindo venda consultiva até o fechamento com previsibilidade e qualidade.",
  atribuicoes: [
    "Realizar reuniões comerciais.",
    "Diagnosticar cenário, dores e objetivos.",
    "Apresentar solução e construir valor.",
    "Tratar objeções e negociar dentro das regras.",
    "Enviar propostas e conduzir follow-ups.",
    "Atualizar CRM em tempo real.",
    "Gerenciar pipeline e previsão.",
    "Registrar motivos de ganho e perda.",
  ],
  softSkills: ["Persuasão", "Escuta", "Confiança", "Negociação", "Controle emocional", "Resultados", "Comunicação executiva"],
  hardSkills: ["Venda consultiva", "SPIN Selling", "AIDA/PAS", "BANT/GPCT", "Negociação", "CRM", "Pipeline/forecast"],
};

const CO_LIDER_CS: RoleProfile = {
  cargo: "Co-líder de CS",
  missao:
    "Garantir saúde, satisfação, retenção e evolução da carteira, transformando acompanhamento em percepção de valor e renovação.",
  atribuicoes: [
    "Gerenciar carteira de mentorados.",
    "Realizar acompanhamento e registrar interações.",
    "Monitorar entregas, participação, satisfação e riscos de churn.",
    "Identificar dores, upsell e necessidades de suporte.",
    "Acompanhar NPS/eNPS, MRR, ARR, ARPU, LTV, ticket e renovação.",
    "Registrar planos de ação e TO DOs no OS.",
    "Escalar problemas críticos.",
    "Contribuir para melhoria da jornada.",
  ],
  softSkills: ["Empatia", "Escuta ativa", "Organização", "Proatividade", "Comunicação", "Senso de dono", "Orientação ao cliente"],
  hardSkills: ["Customer Success", "Gestão de carteira", "CRM", "Retenção", "NPS", "LTV/MRR/ARR/ARPU", "Upsell", "Documentação"],
};

export const ROLE_BY_EMAIL: Record<string, RoleProfile> = {
  "domicianomv@gmail.com": SOCIOS,
  "carolinaviudes@brandlegacy.com.br": SOCIOS,
  "lucas@brandlegacy.com.br": SOCIOS,
  "contato@diegosantana.me": SOCIOS,
  "operacoes@brandlegacy.com.br": {
    cargo: "COO — Chefe de Operações",
    missao:
      "Transformar a estratégia dos sócios em execução coordenada, garantindo o andamento das metas de cada departamento por meio da liderança do corpo de líderes.",
    atribuicoes: [
      "Conduzir a rotina de gestão dos heads e líderes.",
      "Acompanhar metas, KPIs, prioridades, gargalos e planos de ação.",
      "Garantir clareza de objetivos, responsáveis, prazos e entregáveis.",
      "Realizar reuniões de acompanhamento e cobrar evolução.",
      "Identificar riscos operacionais e promover soluções.",
      "Integrar departamentos e reduzir retrabalho.",
      "Escalar decisões necessárias aos sócios.",
      "Gerenciar e evoluir o OS de gestão e os processos de acompanhamento.",
    ],
    softSkills: ["Liderança", "Accountability", "Organização", "Comunicação assertiva", "Pensamento sistêmico", "Senso de urgência", "Resolução de problemas"],
    hardSkills: ["Gestão por indicadores", "Gestão de projetos", "Processos e workflows", "Planejamento estratégico", "KPIs/OKRs", "Análise de dados", "Ferramentas de gestão"],
  },
  "nubiapradogp@gmail.com": {
    cargo: "Gestora de Projetos",
    missao:
      "Garantir que projetos e entregas avancem dentro dos prazos, com responsáveis, dependências e status visíveis para as lideranças.",
    atribuicoes: [
      "Consolidar projetos, tarefas, responsáveis e deadlines.",
      "Acompanhar diariamente o avanço das entregas.",
      "Alertar responsáveis e líderes sobre atrasos e riscos.",
      "Mapear dependências entre departamentos.",
      "Organizar cronogramas, reuniões e checkpoints.",
      "Atualizar o status no OS.",
      "Registrar decisões, pendências e próximos passos.",
      "Escalar impedimentos ao COO.",
    ],
    softSkills: ["Organização", "Follow-up", "Disciplina", "Comunicação clara", "Proatividade", "Atenção a detalhes", "Prioridade"],
    hardSkills: ["Gestão de projetos", "Cronogramas", "Kanban/workflows", "Ferramentas de gestão", "Gestão de riscos", "Documentação", "Reporting"],
  },
  "lara.pujalte@brandlegacy.com.br": {
    cargo: "Head de Social",
    missao:
      "Construir e liderar a operação de social, transformando conteúdo e posicionamento em crescimento de audiência, autoridade, relacionamento e oportunidades.",
    atribuicoes: [
      "Definir estratégia editorial e calendário.",
      "Liderar Designer e Editor de Vídeos.",
      "Distribuir briefings e acompanhar entregas.",
      "Definir prioridades por formato, canal e objetivo.",
      "Acompanhar alcance, engajamento, crescimento, retenção e oportunidades.",
      "Analisar conteúdos vencedores e criar ciclos de melhoria.",
      "Garantir consistência de marca e linguagem.",
      "Integrar Social com Comercial, Performance e demais áreas.",
    ],
    softSkills: ["Liderança criativa", "Visão de conteúdo", "Senso de marca", "Análise crítica", "Agilidade", "Organização", "Comunicação"],
    hardSkills: ["Social media", "Estratégia de conteúdo", "Copywriting", "Métricas sociais", "Planejamento editorial", "Branding", "Gestão de equipe"],
  },
  "igor.luis@brandlegacy.com.br": {
    cargo: "Head de Eventos / Analista de Marketing",
    missao:
      "Planejar e executar eventos com excelência operacional e estratégica, conectando experiência, marca, relacionamento e geração de oportunidades.",
    atribuicoes: [
      "Planejar calendário anual de eventos.",
      "Controlar orçamento, fornecedores e cronogramas.",
      "Coordenar logística, produção, montagem e operação.",
      "Gerenciar patrocinadores e parceiros.",
      "Alinhar comunicação com Social, Performance e Comercial.",
      "Acompanhar inscrições, presença, experiência e resultados.",
      "Realizar pós-evento com indicadores e aprendizados.",
      "Identificar oportunidades de marketing e aquisição nos eventos.",
    ],
    softSkills: ["Organização", "Negociação", "Liderança", "Proatividade", "Jogo de cintura", "Foco em experiência", "Gestão sob pressão"],
    hardSkills: ["Produção de eventos", "Marketing", "Orçamento", "Fornecedores", "Patrocínios", "CRM/eventos", "ROI"],
  },
  "gabriel@brandlegacy.com.br": {
    cargo: "Designer",
    missao:
      "Traduzir estratégia e posicionamento em comunicação visual de alto nível, garantindo consistência, clareza e impacto.",
    atribuicoes: [
      "Criar peças para redes, campanhas, eventos, apresentações e materiais internos.",
      "Desenvolver e manter padrões visuais.",
      "Executar briefings dentro de prazos.",
      "Criar variações para testes e otimização.",
      "Trabalhar com Social, Performance, Eventos e Comercial.",
      "Organizar arquivos, versões e bibliotecas criativas.",
      "Adaptar materiais para diferentes formatos.",
    ],
    softSkills: ["Criatividade", "Atenção a detalhes", "Repertório visual", "Organização", "Agilidade", "Feedback"],
    hardSkills: ["Design gráfico", "Direção de arte", "Tipografia", "Composição", "Adobe/Figma ou equivalentes", "Identidade visual", "Design para social"],
  },
  "guilherme.rocha@brandlegacy.com.br": {
    cargo: "Editor de Vídeos",
    missao:
      "Transformar gravações e conteúdos brutos em vídeos que comuniquem com clareza, gerem retenção e fortaleçam a marca.",
    atribuicoes: [
      "Editar vídeos para redes, campanhas, aulas, eventos e institucional.",
      "Selecionar cortes, ritmo, trilha, legendas e efeitos.",
      "Adaptar conteúdos para formatos e plataformas.",
      "Trabalhar a partir de roteiros, briefings e referências.",
      "Organizar arquivos e versões finais.",
      "Cumprir calendário do Head de Social.",
      "Aplicar aprendizados de retenção e consumo.",
    ],
    softSkills: ["Senso de ritmo", "Criatividade", "Atenção a detalhes", "Agilidade", "Feedback", "Organização"],
    hardSkills: ["Edição de vídeo", "Motion básico", "Storytelling audiovisual", "Decupagem", "Legendas", "Formatos sociais", "Ferramentas de edição"],
  },
  "karina.carvalho@brandlegacy.com.br": {
    cargo: "Head Comercial",
    missao:
      "Liderar a máquina comercial para transformar oportunidades em receita previsível, garantindo processo, performance, gestão do funil e desenvolvimento do time.",
    atribuicoes: [
      "Definir metas e estratégia comercial.",
      "Liderar Social Selling, SDRs e Closers.",
      "Acompanhar diariamente o funil e indicadores.",
      "Analisar leads, MQLs, SQLs, reuniões, no-show, propostas, vendas e perdas.",
      "Monitorar conversões, ticket, ciclo, receita, forecast e gap.",
      "Realizar 1:1s, feedbacks e desenvolvimento.",
      "Identificar gargalos e ajustar processo, abordagem e cadência.",
      "Integrar Comercial com Marketing, Eventos, CS e Sócios.",
      "Garantir CRM como fonte oficial dos dados.",
    ],
    softSkills: ["Liderança", "Orientação a metas", "Negociação", "Accountability", "Inteligência emocional", "Decisão", "Energia comercial"],
    hardSkills: ["Gestão de funil", "CRM", "Inside Sales", "Forecast", "Conversão", "SPIN Selling", "BANT/GPCT", "Pipeline"],
  },
  "karina.meotti@brandlegacy.com.br": {
    cargo: "Social Selling",
    missao:
      "Gerar e qualificar oportunidades por relacionamento estratégico nas redes sociais, conectando potenciais clientes ao processo comercial.",
    atribuicoes: [
      "Mapear e prospectar potenciais clientes.",
      "Realizar abordagens personalizadas.",
      "Construir relacionamento antes da oferta.",
      "Qualificar interesse, perfil e momento.",
      "Registrar interações no CRM.",
      "Executar follow-ups conforme cadência.",
      "Agendar reuniões qualificadas.",
      "Gerar aprendizados sobre objeções e ICP.",
    ],
    softSkills: ["Comunicação", "Empatia", "Persuasão", "Constância", "Escuta ativa", "Curiosidade", "Resiliência"],
    hardSkills: ["Social Selling", "Prospecção", "Copy de abordagem", "Qualificação", "CRM", "Cadência", "ICP/persona"],
  },
  "renzo.pagio@brandlegacy.com.br": CLOSER,
  "lucas.carvalho@brandlegacy.com.br": CLOSER,
  "thiago@brandlegacy.com.br": {
    cargo: "SDR",
    missao:
      "Qualificar oportunidades e gerar reuniões de alto potencial para o fechamento, garantindo volume com qualidade e dados confiáveis.",
    atribuicoes: [
      "Contatar leads e oportunidades.",
      "Qualificar perfil, dor, momento, capacidade e fit.",
      "Executar cadências multicanal.",
      "Agendar reuniões com contexto completo para o Closer.",
      "Confirmar reuniões e recuperar no-shows.",
      "Atualizar etapas e informações no CRM.",
      "Acompanhar contato, agendamento, show rate e SQLs.",
      "Reportar objeções e padrões.",
    ],
    softSkills: ["Resiliência", "Disciplina", "Comunicação", "Escuta ativa", "Metas", "Organização", "Persistência"],
    hardSkills: ["SDR/BDR", "Qualificação", "CRM", "Cadência", "SPIN/BANT/GPCT", "Prospecção", "Gestão de agenda"],
  },
  "isabella@brandlegacy.com.br": {
    cargo: "Head Jurídico",
    missao:
      "Proteger juridicamente o Brand Legacy, garantindo segurança nas relações contratuais, societárias, trabalhistas e comerciais, reduzindo riscos e dando suporte jurídico para que a empresa possa crescer com segurança, conformidade e previsibilidade.",
    atribuicoes: [
      "Elaborar, revisar e acompanhar contratos com clientes, fornecedores, parceiros, colaboradores e prestadores de serviço.",
      "Garantir que os contratos estejam alinhados aos interesses e às políticas do Brand Legacy.",
      "Acompanhar prazos, obrigações, renovações e encerramentos contratuais.",
      "Apoiar os Sócios e o COO em decisões que envolvam riscos ou implicações jurídicas.",
      "Identificar, avaliar e comunicar riscos jurídicos relevantes para a operação.",
      "Orientar as áreas Comercial, CS, Financeiro, Eventos, Marketing e RH sobre questões jurídicas relacionadas às suas atividades.",
      "Apoiar processos de cobrança, inadimplência, distratos e rescisões.",
      "Acompanhar demandas judiciais e extrajudiciais, quando existentes, em conjunto com escritórios ou profissionais externos.",
      "Garantir conformidade dos documentos e processos internos da empresa.",
      "Apoiar questões relacionadas à LGPD, privacidade e tratamento de dados.",
      "Revisar documentos comerciais, propostas, termos de uso, políticas e regulamentos.",
      "Apoiar a estruturação jurídica de novos produtos, eventos, parcerias e projetos.",
      "Manter organizado o repositório de documentos jurídicos da empresa.",
      "Criar e manter modelos padronizados de contratos e documentos recorrentes.",
      "Acompanhar mudanças relevantes na legislação que possam impactar o Brand Legacy.",
      "Manter os Sócios e o COO informados sobre riscos jurídicos relevantes e suas possíveis consequências.",
      "Trabalhar preventivamente, buscando evitar problemas jurídicos antes que eles se transformem em passivos ou prejuízos.",
    ],
    softSkills: [
      "Senso de responsabilidade",
      "Atenção extrema aos detalhes",
      "Organização",
      "Confidencialidade",
      "Ética e integridade",
      "Pensamento preventivo",
      "Comunicação clara e objetiva",
      "Capacidade de negociação",
      "Senso de urgência",
      "Pensamento analítico",
      "Prudência na tomada de decisão",
      "Capacidade de traduzir temas jurídicos complexos para uma linguagem empresarial",
      "Proatividade",
      "Visão de negócio",
      "Capacidade de trabalhar sob pressão",
    ],
    hardSkills: [
      "Direito empresarial",
      "Direito contratual",
      "Direito civil",
      "Direito societário",
      "Direito trabalhista",
      "Direito do consumidor",
      "LGPD e proteção de dados",
      "Gestão e análise de contratos",
      "Negociação contratual",
      "Gestão de riscos jurídicos",
      "Processos judiciais e extrajudiciais",
      "Cobrança e inadimplência",
      "Propriedade intelectual e uso de marca",
      "Termos de uso e políticas internas",
      "Compliance",
      "Gestão documental",
      "Legislação aplicável ao modelo de negócio do Brand Legacy",
    ],
    resultadoEsperado:
      "O Jurídico deve funcionar de maneira preventiva e estratégica, e não apenas como uma área acionada quando surge um problema. Seu principal resultado é permitir que o Brand Legacy opere, venda, contrate, faça parcerias e cresça com segurança jurídica, redução de riscos e velocidade para tomada de decisão.",
  },
  "willian.tavares@brandlegacy.com.br": {
    cargo: "Head Financeiro",
    missao:
      "Garantir saúde financeira, controle de caixa, previsibilidade e informações confiáveis para tomada de decisão.",
    atribuicoes: [
      "Controlar contas a pagar e receber.",
      "Atualizar e acompanhar fluxo de caixa.",
      "Monitorar receitas, despesas, margem e orçamento.",
      "Consolidar informações para Sócios e COO.",
      "Acompanhar inadimplência e recebíveis.",
      "Apoiar construção e análise de DRE.",
      "Controlar compromissos e projeções.",
      "Identificar desvios e oportunidades de eficiência.",
      "Garantir rastreabilidade dos dados.",
    ],
    softSkills: ["Confiabilidade", "Organização", "Atenção a detalhes", "Confidencialidade", "Rigor", "Visão analítica", "Responsabilidade"],
    hardSkills: ["Fluxo de caixa", "DRE", "Contas a pagar/receber", "Orçamento", "Conciliação", "Indicadores financeiros", "Excel/Sheets", "Sistemas financeiros"],
  },
  "camila.leite@brandlegacy.com.br": CO_LIDER_CS,
  "alessandra.siqueira@brandlegacy.com.br": CO_LIDER_CS,
};
