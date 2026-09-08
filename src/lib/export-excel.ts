import { utils, write } from "xlsx";

/** Converte uma lista de objetos simples numa planilha .xlsx (buffer) —
 * uma linha por objeto, colunas na ordem das chaves do primeiro objeto. */
export function rowsToXlsxBuffer(rows: Record<string, unknown>[], sheetName: string): Buffer {
  const sheet = utils.json_to_sheet(rows.length > 0 ? rows : [{}]);
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, sheet, sheetName.slice(0, 31));
  return write(workbook, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
