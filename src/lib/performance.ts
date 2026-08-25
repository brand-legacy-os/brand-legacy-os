export function performanceGroup(sectionName: string): string {
  const n = sectionName.toUpperCase();
  if (n === "MARKETING") return "Aquisição (Tráfego)";
  if (n.startsWith("COMERCIAL")) return "Funis comerciais";
  if (n.startsWith("INBOUND") || n.startsWith("OUTBOUND") && !n.includes("(SDR)")) return "Social Selling";
  if (n.includes("(SDR)")) return "SDR";
  if (n.includes("CLOSER") || n === "DOM") return "Closers";
  if (n.startsWith("SCALE")) return "Eventos";
  if (n === "RENOVAÇÃO") return "Renovação";
  if (n === "RESUMO GERAL") return "Resumo geral";
  return "Outros";
}

/** Extrai um número de um valor cru da planilha (R$, %, contagem com milhar). Retorna null se não for parseável (ex.: #DIV/0!). */
export function parsePerformanceNumber(raw: string | null): number | null {
  if (!raw) return null;
  const s = raw.trim();
  if (/^#/.test(s) || s === "—") return null;
  const isPercent = s.includes("%");
  const cleaned = s
    .replace(/R\$\s?/, "")
    .replace(/%/, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = Number(cleaned);
  if (isNaN(num)) return null;
  return isPercent ? num : num;
}

export function findMetric(
  sections: { name: string; metrics: { label: string; target: string | null; realized: string | null }[] }[],
  sectionName: string,
  label: string
) {
  const section = sections.find((s) => s.name.toLowerCase() === sectionName.toLowerCase());
  return section?.metrics.find((m) => m.label.trim().toLowerCase() === label.toLowerCase()) ?? null;
}

export const PERFORMANCE_GROUP_ORDER = [
  "Aquisição (Tráfego)",
  "Funis comerciais",
  "Social Selling",
  "SDR",
  "Closers",
  "Eventos",
  "Renovação",
  "Resumo geral",
  "Outros",
];
