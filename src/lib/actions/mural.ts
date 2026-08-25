"use server";

import { revalidatePath } from "next/cache";
import { mkdir, writeFile } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import type { MuralKind } from "@prisma/client";

export type ActionState = { error?: string; success?: boolean };

const UPLOAD_DIR = join(process.cwd(), "public", "uploads", "mural");
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB
const ALLOWED_TYPES = /^(image\/|video\/)/;

async function saveUpload(file: File): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = extname(file.name) || (file.type.startsWith("video/") ? ".mp4" : ".jpg");
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(UPLOAD_DIR, filename), buffer);
  return `/uploads/mural/${filename}`;
}

export async function createMuralPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const content = String(formData.get("content") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim() || null;
  const kind = (String(formData.get("kind") ?? "post") as MuralKind) || "post";
  const photo = formData.get("photo");

  if (!content) return { error: "Escreva algo para publicar." };
  if (linkUrl && !/^https:\/\//i.test(linkUrl)) {
    return { error: "O link precisa começar com https://" };
  }

  let imageUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    if (!ALLOWED_TYPES.test(photo.type)) {
      return { error: "Envie uma imagem ou vídeo válido." };
    }
    if (photo.size > MAX_UPLOAD_BYTES) {
      return { error: "Arquivo muito grande — o limite é 20MB." };
    }
    imageUrl = await saveUpload(photo);
  }

  await prisma.muralPost.create({
    data: { authorId: user.id, content, linkUrl, imageUrl, kind },
  });

  revalidatePath("/mural");
  return { success: true };
}

export async function toggleReactionAction(formData: FormData) {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const emoji = String(formData.get("emoji") ?? "👏");
  if (!postId) return;

  const existing = await prisma.muralReaction.findUnique({
    where: { postId_userId: { postId, userId: user.id } },
  });

  if (existing && existing.emoji === emoji) {
    await prisma.muralReaction.delete({ where: { id: existing.id } });
  } else if (existing) {
    await prisma.muralReaction.update({ where: { id: existing.id }, data: { emoji } });
  } else {
    await prisma.muralReaction.create({
      data: { postId, userId: user.id, emoji },
    });
  }

  revalidatePath("/mural");
}

export async function addCommentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const user = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const content = String(formData.get("content") ?? "").trim();

  if (!content) return { error: "Escreva um comentário." };

  await prisma.muralComment.create({
    data: { postId, authorId: user.id, content },
  });

  revalidatePath("/mural");
  return { success: true };
}
