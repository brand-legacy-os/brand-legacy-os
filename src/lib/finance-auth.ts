import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser, type SessionUser } from "./auth";
import { isAdmin, isLeaderOf } from "./permissions";

const UNLOCK_COOKIE = "bl_finance_unlock";
const secret = new TextEncoder().encode(
  (process.env.AUTH_SECRET ?? "dev-only-insecure-secret") + ":finance"
);

export function hasFinanceRole(user: SessionUser) {
  return isAdmin(user) || isLeaderOf(user, "financeiro");
}

export async function unlockFinance() {
  const token = await new SignJWT({ unlocked: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("4h")
    .sign(secret);

  const store = await cookies();
  store.set(UNLOCK_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export async function isFinanceUnlocked() {
  const store = await cookies();
  const token = store.get(UNLOCK_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

/**
 * Every /financeiro page calls this. Two independent gates, both enforced
 * server-side (not just a hidden nav item): the user's role (sócio ou líder
 * financeiro) AND a module-specific passcode, unlocked separately per
 * session — per the "senha específica do módulo" requirement.
 */
export async function requireFinanceAccess() {
  const user = await requireUser();
  if (!hasFinanceRole(user)) redirect("/dashboard");
  if (!(await isFinanceUnlocked())) redirect("/financeiro/entrar");
  return user;
}
