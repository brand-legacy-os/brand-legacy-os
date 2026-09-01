import puppeteer from "puppeteer";

export type ScrapedMetric = {
  title: string;
  periodLabel: string | null;
  value: string;
  deltaLabel: string | null;
  previousLabel: string | null;
};

// Valor principal do card: dígitos puros (ex.: "5.499", "0", "13"), sem
// sinal — deltas sempre vêm com "+"/"-" explícito, então são mutuamente
// exclusivos por construção.
const VALUE_RE = /^[\d.,]+%?$/;
const DELTA_RE = /^[+-][\d.,]+%?$/;
const PERIOD_RE = /^\d{2}\/\d{2}\/\d{4}\s+a\s+\d{2}\/\d{2}\/\d{4}$/;
const PREVIOUS_RE = /no período anterior/i;

/**
 * Reportei não expõe uma API pública — os dashboards são renderizados via
 * WebSocket/JS no cliente. Este parser lê o texto renderizado da página
 * (igual a um humano leria) e agrupa em blocos [título → valor → delta? →
 * comparação?]. É uma heurística sobre texto visível, não sobre seletores
 * de classe (que mudam a cada build do Reportei) — mais estável, mas ainda
 * frágil por natureza: se o Reportei mudar o texto/ordem dos cards, a
 * extração pode quebrar ou ficar incompleta.
 */
export function parseReporteiText(rawText: string): ScrapedMetric[] {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const metrics: ScrapedMetric[] = [];
  let titleParts: string[] = [];
  let periodLabel: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (PERIOD_RE.test(line)) {
      periodLabel = line;
      continue;
    }

    if (VALUE_RE.test(line)) {
      // valor principal do card
      const title = titleParts.join(" — ").trim();
      titleParts = [];
      let deltaLabel: string | null = null;
      let previousLabel: string | null = null;

      const next = lines[i + 1];
      if (next && DELTA_RE.test(next)) {
        deltaLabel = next;
        i++;
      }
      const afterDelta = lines[i + 1];
      if (afterDelta && PREVIOUS_RE.test(afterDelta)) {
        previousLabel = afterDelta;
        i++;
      }

      if (title) {
        metrics.push({ title, periodLabel, value: line, deltaLabel, previousLabel });
      }
      periodLabel = null;
      continue;
    }

    if (PREVIOUS_RE.test(line)) {
      // comparação órfã (já deveria ter sido consumida acima) — ignora
      continue;
    }

    titleParts.push(line);
    // evita título crescer indefinidamente se o padrão não bater em algum trecho
    if (titleParts.length > 3) titleParts.shift();
  }

  return metrics;
}

// Teto duro para o scrape inteiro (launch + navegação + espera) — sem isso,
// um Chrome que trava para abrir (visto localmente neste Windows ARM64) deixa
// a Server Action pendurada para sempre e o botão "Atualizar" nunca erra nem
// resolve, travado em "Atualizando…" indefinidamente.
const OVERALL_TIMEOUT_MS = 60000;

export async function scrapeReporteiDashboard(url: string): Promise<ScrapedMetric[]> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("Tempo esgotado ao carregar o Reportei.")),
      OVERALL_TIMEOUT_MS
    );
  });

  try {
    return await Promise.race([scrapeReporteiDashboardInner(url), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function scrapeReporteiDashboardInner(url: string): Promise<ScrapedMetric[]> {
  const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45000 });

    // A dashboard carrega os dados via WebSocket depois do load inicial —
    // espera o texto de loading sumir, com um teto de tempo.
    await page
      .waitForFunction(
        () => !document.body.innerText.includes("Carregando dashboard"),
        { timeout: 20000 }
      )
      .catch(() => {});
    // pequena folga extra para os últimos cards renderizarem
    await new Promise((r) => setTimeout(r, 2500));

    const text = await page.evaluate(() => document.body.innerText);
    return parseReporteiText(text);
  } finally {
    await browser.close();
  }
}
