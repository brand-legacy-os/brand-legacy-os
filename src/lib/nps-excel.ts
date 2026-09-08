import { read, utils } from "xlsx";

export type ParsedNpsRow = {
  name?: string;
  email?: string;
  score: number;
  comment?: string;
};

export type ParsedNps = {
  scores: number[];
  comments: string[];
  rows: ParsedNpsRow[];
};

const SCORE_HEADER_RE = /nota|score|nps/i;
const COMMENT_HEADER_RE = /coment|feedback|obs/i;
const NAME_HEADER_RE = /nome|participante/i;
const EMAIL_HEADER_RE = /e-?mail/i;

/**
 * Reportei/planilhas de NPS não têm um template fixo — procura as colunas
 * de nota, comentário, nome e e-mail pelo nome do cabeçalho (primeira linha
 * da primeira aba), não por posição. Nome/e-mail alimentam o vínculo
 * automático com EventAttendee (ver uploadNpsExcelAction); scores/comments
 * seguem existindo pro agregado do evento. Retorna arrays vazios quando não
 * acha as colunas de nota, e quem chamou decide o que fazer.
 */
export function parseNpsExcel(buffer: Buffer): ParsedNps {
  const workbook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rawRows.length === 0) return { scores: [], comments: [], rows: [] };

  const headers = Object.keys(rawRows[0]);
  const scoreHeader = headers.find((h) => SCORE_HEADER_RE.test(h));
  const commentHeader = headers.find((h) => COMMENT_HEADER_RE.test(h));
  const nameHeader = headers.find((h) => NAME_HEADER_RE.test(h));
  const emailHeader = headers.find((h) => EMAIL_HEADER_RE.test(h));

  const scores: number[] = [];
  const comments: string[] = [];
  const rows: ParsedNpsRow[] = [];

  for (const row of rawRows) {
    if (!scoreHeader) continue;
    const raw = row[scoreHeader];
    const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
    if (Number.isNaN(n) || String(raw).trim() === "") continue;

    scores.push(n);
    const comment = commentHeader ? String(row[commentHeader] ?? "").trim() : "";
    if (comment) comments.push(comment);

    const name = nameHeader ? String(row[nameHeader] ?? "").trim() || undefined : undefined;
    const email = emailHeader ? String(row[emailHeader] ?? "").trim() || undefined : undefined;
    rows.push({ name, email, score: n, comment: comment || undefined });
  }

  return { scores, comments, rows };
}
