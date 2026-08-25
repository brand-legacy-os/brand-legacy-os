"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export type ActionState = { error?: string; success?: boolean };

export async function createLibraryItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const tags = String(formData.get("tags") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const authorLabel =
    String(formData.get("authorLabel") ?? "").trim() || user.name;

  if (!title || !url || !type || !category) {
    return { error: "Preencha título, link, tipo e categoria." };
  }
  if (!/^https:\/\//i.test(url)) {
    return { error: "O link precisa começar com https://" };
  }

  await prisma.libraryItem.create({
    data: {
      title,
      url,
      type,
      category,
      tags,
      description: description || `Conteúdo sobre ${category.toLowerCase()}.`,
      authorLabel,
      addedById: user.id,
    },
  });

  revalidatePath("/biblioteca");
  return { success: true };
}
