import { read, utils } from "xlsx";

export type ParsedNps = {
  scores: number[];
  comments: string[];
};

const SCORE_HEADER_RE = /nota|score|nps/i;
const COMMENT_HEADER_RE = /coment|feedback|obs/i;

/**
 * Reportei/planilhas de NPS não têm um template fixo — procura a coluna de
 * nota e a de comentário livre pelo nome do cabeçalho (primeira linha da
 * primeira aba), não por posição. Retorna arrays vazios quando não acha as
 * colunas, e quem chamou decide o que fazer (ver uploadNpsExcelAction).
 */
export function parseNpsExcel(buffer: Buffer): ParsedNps {
  const workbook = read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

  if (rows.length === 0) return { scores: [], comments: [] };

  const headers = Object.keys(rows[0]);
  const scoreHeader = headers.find((h) => SCORE_HEADER_RE.test(h));
  const commentHeader = headers.find((h) => COMMENT_HEADER_RE.test(h));

  const scores: number[] = [];
  const comments: string[] = [];

  for (const row of rows) {
    if (scoreHeader) {
      const raw = row[scoreHeader];
      const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", "."));
      if (!Number.isNaN(n) && String(raw).trim() !== "") scores.push(n);
    }
    if (commentHeader) {
      const raw = String(row[commentHeader] ?? "").trim();
      if (raw) comments.push(raw);
    }
  }

  return { scores, comments };
}
