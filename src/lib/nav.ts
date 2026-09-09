import type { SessionUser } from "./auth";
import { isAdmin, isLeaderOf, canAccessSalaryArea, isPodcastOnlyUser } from "./permissions";
import { hasFinanceRole } from "./finance-auth";

export type NavItem = { label: string; href: string; badge?: number };
export type NavGroup = { label: string; items: NavItem[] };

const AREA_ORDER = [
  "operacoes",
  "social",
  "comercial",
  "juridico",
  "financeiro",
  "cs",
  "eventos",
] as const;

export function buildNav(
  user: SessionUser,
  allAreas: { slug: string; name: string }[],
  pendingApprovals: number
): NavGroup[] {
  const admin = isAdmin(user);
  const financeRole = hasFinanceRole(user);
  const memberSlugs = new Set(user.memberships.map((m) => m.area.slug));

  const visibleAreas = allAreas
    .filter((a) => admin || memberSlugs.has(a.slug))
    .sort(
      (a, b) => AREA_ORDER.indexOf(a.slug as never) - AREA_ORDER.indexOf(b.slug as never)
    );

  const groups: NavGroup[] = [
    {
      label: "Principal",
      items: [
        { label: "Início", href: "/inicio" },
        { label: "Dashboard", href: "/dashboard" },
        { label: "Operações", href: "/projetos" },
        { label: "RH", href: "/rh" },
        ...(canAccessSalaryArea(user) ? [{ label: "Cargos e Salários", href: "/rh/cargos-salarios" }] : []),
      ],
    },
    {
      label: "Áreas",
      // Eventos, Social e Financeiro são áreas como as outras, mas cada uma
      // tem seu próprio módulo completo (não o template genérico de área) —
      // Eventos em /eventos, Social em /social, Financeiro em /financeiro
      // (grupo próprio abaixo, só para quem tem acesso liberado — um
      // colaborador sem esse acesso continua vendo a área genérica).
      items: visibleAreas
        // Operações não tem mais página própria no menu — a função dela
        // (tarefas, projetos e cobrança cross-área) já é o hub "Operações"
        // acima (ex-Projetos e Tarefas, em /projetos). A Area em si
        // continua existindo no banco (tarefas, KPIs e liderança).
        .filter((a) => a.slug !== "operacoes")
        .filter((a) => a.slug !== "financeiro" || !financeRole)
        .flatMap((a) => {
          const item = {
            label: a.name,
            href:
              a.slug === "eventos"
                ? "/eventos"
                : a.slug === "social"
                  ? "/social"
                  : a.slug === "cs"
                    ? "/cs"
                    : `/areas/${a.slug}`,
          };
          // Tráfego não é uma Area própria (ainda) — vive junto do Comercial,
          // já que é a camada de aquisição que alimenta o funil comercial.
          // SDR não tem item próprio no menu — vive dentro da área Comercial
          // (link "Ver em SDR →" no quadro resumo), não como destino
          // separado na barra lateral.
          if (a.slug === "comercial") {
            return [item, { label: "Tráfego", href: "/trafego" }];
          }
          // Patrocínios não é uma Area própria — vive junto de Eventos, já
          // que cada patrocínio é sempre em função de um evento.
          if (a.slug === "eventos") {
            return [item, { label: "Patrocínios", href: "/patrocinios" }];
          }
          return [item];
        }),
    },
  ];

  // Líder de Operações acompanha patrocínios mesmo sem ser membro de Eventos
  // (mesmo grupo que já tem visão cross-área de Workflow/Projetos).
  const alreadyHasEventos = visibleAreas.some((a) => a.slug === "eventos");
  if (!admin && !alreadyHasEventos && isLeaderOf(user, "operacoes")) {
    groups[1].items.push({ label: "Patrocínios", href: "/patrocinios" });
  }

  // Camila e Alessandra (CS) ajudam no Podcast sem serem membros de Social —
  // só esse link aparece pra elas, não a área inteira.
  if (isPodcastOnlyUser(user)) {
    groups[1].items.push({ label: "Podcast (Social)", href: "/social/podcast" });
  }

  if (financeRole) {
    groups.push({
      label: "Financeiro",
      items: [
        { label: "Visão geral", href: "/financeiro" },
        { label: "Indicadores", href: "/financeiro/indicadores" },
        { label: "DFC", href: "/financeiro/dfc" },
        { label: "Posição de caixa", href: "/financeiro/caixa" },
        { label: "Contas a pagar", href: "/financeiro/contas-a-pagar" },
        { label: "Contas a receber", href: "/financeiro/contas-a-receber" },
      ],
    });
  }

  groups.push({
    label: "Conhecimento",
    items: [
      { label: "Biblioteca", href: "/biblioteca" },
      { label: "Jornal BL", href: "/mural" },
      { label: "Treinamentos", href: "/treinamentos" },
    ],
  });

  if (admin) {
    groups.push({
      label: "Administração",
      items: [{ label: "Configurações", href: "/configuracoes" }],
    });
  }

  if (pendingApprovals > 0) {
    const dashboardItem = groups[0].items.find((i) => i.href === "/dashboard");
    if (dashboardItem) dashboardItem.badge = pendingApprovals;
  }

  return groups;
}
