import type { SessionUser } from "./auth";

export function membershipFor(user: SessionUser, areaSlug: string) {
  return user.memberships.find((m) => m.area.slug === areaSlug);
}

export function isAdmin(user: SessionUser) {
  return user.isGlobalAdmin;
}

export function isLeaderOf(user: SessionUser, areaSlug: string) {
  return membershipFor(user, areaSlug)?.role === "lider";
}

export function canViewArea(user: SessionUser, areaSlug: string) {
  return isAdmin(user) || Boolean(membershipFor(user, areaSlug));
}

export function canEditAreaKpis(user: SessionUser, areaSlug: string) {
  return isAdmin(user) || isLeaderOf(user, areaSlug);
}

export function canManageTask(
  user: SessionUser,
  task: { assigneeId: string; areaSlug: string }
) {
  return (
    isAdmin(user) ||
    task.assigneeId === user.id ||
    isLeaderOf(user, task.areaSlug)
  );
}

/** Cross-area Projetos & Tarefas view: líderes de Operações (Marcus e Núbia) ou admin. */
export function canViewCrossAreaProjects(user: SessionUser) {
  return isAdmin(user) || isLeaderOf(user, "operacoes");
}

export function visibleAreaSlugs(user: SessionUser): "all" | string[] {
  if (isAdmin(user)) return "all";
  return user.memberships.map((m) => m.area.slug);
}

/**
 * RH: admin/sócios veem tudo. Um líder vê o RH de quem ele lidera
 * (colaboradores das áreas onde ele é líder) — targetAreaSlugs são as
 * áreas em que a PESSOA AVALIADA tem vínculo, não o viewer.
 */
export function canViewRhFor(
  user: SessionUser,
  target: { userId: string; areaSlugs: string[] }
) {
  if (isAdmin(user)) return true;
  if (target.userId === user.id) return true;
  return target.areaSlugs.some((slug) => isLeaderOf(user, slug));
}

export function canManageRhFor(
  user: SessionUser,
  target: { areaSlugs: string[] }
) {
  if (isAdmin(user)) return true;
  return target.areaSlugs.some((slug) => isLeaderOf(user, slug));
}

/**
 * CS: diferente das outras áreas, "líder de CS" aqui significa "dono da
 * própria carteira", não "gestor de todo o departamento" — Camila e
 * Alessandra são pares, cada uma cuidando dos próprios clientes. Por isso a
 * visibilidade é por csId, não por isLeaderOf('cs'). Admin sempre vê tudo.
 */
export function canViewCustomer(user: SessionUser, customer: { csId: string }) {
  return isAdmin(user) || customer.csId === user.id;
}

export function canManageCustomer(user: SessionUser, customer: { csId: string }) {
  return canViewCustomer(user, customer);
}

/** Ver o departamento de CS como um todo (dashboard geral) — área + admin. */
export function canViewCsDepartment(user: SessionUser) {
  return canViewArea(user, "cs");
}
