"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Informe e-mail e senha." };
  }

  // Contas não são autoatendidas — só existem as que Operações provisiona,
  // então o e-mail cadastrado (nem sempre @brandlegacy.com.br: alguns sócios
  // usam o e-mail pessoal de cadastro) já é o controle de acesso real.
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Não encontramos essa conta. Confira o e-mail digitado." };
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return { error: "Senha incorreta." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}
