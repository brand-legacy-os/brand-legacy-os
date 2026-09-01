import type { ScrapedMetric } from "./reportei-scraper";

export type ReporteiInsight = { severity: "critical" | "warning" | "info"; message: string };

function parseDeltaPct(deltaLabel: string): number | null {
  if (!deltaLabel.endsWith("%")) return null;
  const n = Number(deltaLabel.replace("%", "").replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

/**
 * Heurística simples sobre os deltas percentuais já extraídos pelo scraper —
 * sem histórico próprio, então o "ponto de atenção" é sempre relativo ao
 * período anterior que o próprio Reportei calculou.
 */
export function generateReporteiInsights(metrics: ScrapedMetric[]): ReporteiInsight[] {
  const insights: ReporteiInsight[] = [];

  for (const m of metrics) {
    if (!m.deltaLabel) continue;
    const pct = parseDeltaPct(m.deltaLabel);
    if (pct === null) continue;

    if (pct <= -20) {
      insights.push({
        severity: "critical",
        message: `${m.title} caiu ${Math.abs(pct).toFixed(1).replace(".", ",")}% — queda forte, vale investigar o motivo.`,
      });
    } else if (pct <= -8) {
      insights.push({
        severity: "warning",
        message: `${m.title} caiu ${Math.abs(pct).toFixed(1).replace(".", ",")}% em relação ao período anterior.`,
      });
    } else if (pct >= 25) {
      insights.push({
        severity: "info",
        message: `${m.title} subiu ${pct.toFixed(1).replace(".", ",")}% — bom momento para reforçar o que funcionou.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      severity: "info",
      message: "Nenhuma variação fora do padrão neste período — indicadores estáveis.",
    });
  }

  return insights;
}
