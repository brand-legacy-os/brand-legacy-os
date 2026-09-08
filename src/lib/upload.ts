import { mkdir, writeFile } from "fs/promises";
import { join, extname } from "path";
import { randomUUID } from "crypto";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB

export type UploadValidation = { error: string } | { error?: undefined };

/**
 * Salva um arquivo enviado por upload em public/uploads/<subfolder> e
 * devolve o caminho público relativo pra gravar no banco. Mesmo padrão usado
 * em src/lib/actions/mural.ts — extraído aqui pra reuso (comprovantes de
 * patrocínio, NF de orçamento, logo de patrocinador, planilha de NPS, arte
 * do fluxo de comunicação).
 */
export async function saveUpload(file: File, subfolder: string): Promise<string> {
  const dir = join(process.cwd(), "public", "uploads", subfolder);
  await mkdir(dir, { recursive: true });
  const ext = extname(file.name) || ".bin";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, filename), buffer);
  return `/uploads/${subfolder}/${filename}`;
}

/** Valida tipo/tamanho antes de salvar — retorna {error} se inválido. */
export function validateUpload(
  file: File,
  allowedTypes: RegExp,
  invalidMessage: string,
  maxBytes: number = MAX_UPLOAD_BYTES
): UploadValidation {
  if (!allowedTypes.test(file.type)) return { error: invalidMessage };
  if (file.size > maxBytes) {
    return { error: `Arquivo muito grande — o limite é ${Math.round(maxBytes / (1024 * 1024))}MB.` };
  }
  return {};
}

export const UPLOAD_TYPES = {
  image: /^image\//,
  imageOrPdf: /^(image\/|application\/pdf)/,
  spreadsheet: /^(application\/vnd\.ms-excel|application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|text\/csv)/,
  presentation: /^(application\/pdf|application\/vnd\.ms-powerpoint|application\/vnd\.openxmlformats-officedocument\.presentationml\.presentation)/,
  video: /^video\//,
};

/** Limite maior pra upload de vídeo — 20MB é pouco pra um vídeo de verdade. */
export const MAX_VIDEO_UPLOAD_BYTES = 100 * 1024 * 1024; // 100MB
