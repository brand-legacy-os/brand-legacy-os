/**
 * Marcação leve usada nas células da tabela semanal de Conteúdo: linhas em
 * branco separam blocos, linhas com 2+ espaços de indentação viram sub-item,
 * e negrito+itálico (3 asteriscos), negrito (2) e itálico (1) são
 * respeitados no texto.
 */
export type ContentPlanLine = { indent: boolean; segments: { text: string; bold: boolean; italic: boolean }[] };

const EMPHASIS_RE = /(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*)/g;

function parseInline(text: string): { text: string; bold: boolean; italic: boolean }[] {
  const parts = text.split(EMPHASIS_RE).filter((p) => p !== "");
  return parts.map((part) => {
    if (part.startsWith("***") && part.endsWith("***") && part.length >= 6) {
      return { text: part.slice(3, -3), bold: true, italic: true };
    }
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return { text: part.slice(2, -2), bold: true, italic: false };
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
      return { text: part.slice(1, -1), bold: false, italic: true };
    }
    return { text: part, bold: false, italic: false };
  });
}

export function parseContentPlanCell(content: string): ContentPlanLine[] {
  return content
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => ({
      indent: /^\s{2,}/.test(line),
      // Uma sub-linha guardada como "  - texto" já vira sub-item pelo
      // indent acima — o "- " marcador em si não deve aparecer no texto.
      segments: parseInline(line.trim().replace(/^-\s+/, "")),
    }));
}
