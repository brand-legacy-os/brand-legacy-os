import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "./db";

const COOKIE_NAME = "bl_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "dev-only-insecure-secret"
);

export const CORPORATE_DOMAIN = "@brandlegacy.com.br";

export function isCorporateEmail(email: string) {
  return email.trim().toLowerCase().endsWith(CORPORATE_DOMAIN);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

async function readUserId(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

const userInclude = {
  memberships: { include: { area: true } },
} as const;

export const getCurrentUser = cache(async () => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  const userId = await readUserId(token);
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { id: userId },
    include: userInclude,
  });
});

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
