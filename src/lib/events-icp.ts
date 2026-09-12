/** Faixa de faturamento reconhecida a partir do texto livre de
 * EventAttendee.revenueRange — ver variantes reais no comentário abaixo. */
export type RevenueBand = { min: number; max: number };

const UNIT: Record<string, number> = { mil: 1_000, milhão: 1_000_000, milhao: 1_000_000, milhões: 1_000_000, milhoes: 1_000_000 };

function parseAmount(raw: string): number | null {
  const m = raw.trim().toLowerCase().match(/^([\d.,]+)\s*(mil|milh(?:ão|ao|ões|oes))?$/);
  if (!m) return null;
  const value = Number(m[1].replace(/\./g, "").replace(",", "."));
  if (Number.isNaN(value)) return null;
  const unit = m[2] ? UNIT[m[2]] ?? 1 : 1;
  return value * unit;
}

/** Reconhece as variantes reais em uso ("300 mil a 500 mil por mês", "Acima
 * de 1 milhão por mês", "Abaixo de 50 mil por mês", etc.) mais o gap
 * plausível "50 mil a 100 mil por mês". Texto livre não reconhecido retorna
 * null — fica sem fit-score, ordenado por último. */
export function parseRevenueBand(revenueRange: string | null | undefined): RevenueBand | null {
  if (!revenueRange) return null;
  const text = revenueRange.trim().toLowerCase().replace(/por mês.*$/, "").trim();

  const acimaMatch = text.match(/^acima de\s+(.+)$/);
  if (acimaMatch) {
    const min = parseAmount(acimaMatch[1]);
    return min !== null ? { min, max: Infinity } : null;
  }

  const abaixoMatch = text.match(/^abaixo de\s+(.+)$/);
  if (abaixoMatch) {
    const max = parseAmount(abaixoMatch[1]);
    return max !== null ? { min: 0, max } : null;
  }

  const rangeMatch = text.match(/^(.+?)\s+a\s+(.+)$/);
  if (rangeMatch) {
    const min = parseAmount(rangeMatch[1]);
    const max = parseAmount(rangeMatch[2]);
    return min !== null && max !== null ? { min, max } : null;
  }

  return null;
}

export const ICP_BANDS: Record<"club" | "master", RevenueBand> = {
  club: { min: 500_000, max: Infinity },
  master: { min: 150_000, max: 500_000 },
};

/** Distância de `band` até `target` — 0 quando há sobreposição (dentro do
 * ICP), positiva conforme se afasta. */
function rangeDistance(band: RevenueBand, target: RevenueBand): number {
  if (band.max < target.min) return target.min - band.max;
  if (band.min > target.max) return band.min - target.max;
  return 0;
}

/** Maior é melhor. Club (sem teto): usa o piso da faixa direto — quanto
 * maior, melhor, sem distorção por não ter limite superior. Master (faixa
 * fechada): usa -distância até o intervalo (0 = dentro do ICP = melhor). */
export function fitScore(band: RevenueBand | null, icp: "club" | "master"): number {
  if (!band) return -Infinity;
  if (icp === "club") return band.min;
  return -rangeDistance(band, ICP_BANDS.master);
}

/** Ordena marcas (uma linha por marca, já com `revenueBand` resolvido) pelo
 * fit ao ICP selecionado — fora do ICP continuam aparecendo, só mais abaixo.
 * Sem ICP reconhecido (produto sem regra, ou "todos"): ordena por
 * faturamento (piso da faixa) desc, texto livre não reconhecido por
 * último. */
export function sortByIcpFit<T extends { revenueBand: RevenueBand | null }>(
  rows: T[],
  icp: "club" | "master" | null
): T[] {
  return [...rows].sort((a, b) => {
    if (icp) {
      const scoreDiff = fitScore(b.revenueBand, icp) - fitScore(a.revenueBand, icp);
      if (scoreDiff !== 0) return scoreDiff;
    }
    const aMin = a.revenueBand?.min ?? -Infinity;
    const bMin = b.revenueBand?.min ?? -Infinity;
    return bMin - aMin;
  });
}
