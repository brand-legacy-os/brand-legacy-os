import type { SessionUser } from "./auth";
import { isAdmin, isLeaderOf } from "./permissions";
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
        { label: "Workflow", href: "/workflow" },
        { label: "Projetos e Tarefas", href: "/projetos" },
        { label: "RH", href: "/rh" },
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
