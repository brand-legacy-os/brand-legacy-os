import puppeteer from "puppeteer";

export type ScrapedMetric = {
  title: string;
  periodLabel: string | null;
  value: string;
  deltaLabel: string | null;
  previousLabel: string | null;
};

export type ScrapedPost = {
  postLabel: string;
  type: string | null;
  alcance: number | null;
  visualizacoes: number | null;
  curtidas: number | null;
  comentarios: number | null;
  salvamentos: number | null;
  compartilhamentos: number | null;
  postedAt: Date | null;
};

/** "18.861" → 18861, "1,69%" → 1.69, "-" → null — números em formato pt-BR. */
function parsePtNumber(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "-") return null;
  const cleaned = trimmed.replace("%", "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  return Number.isNaN(n) ? null : n;
}

/** "20/07/2026" → Date — datas do Reportei sempre vêm nesse formato. */
function parseBrDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12, 0, 0);
}

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

export type ScrapedReportei = { metrics: ScrapedMetric[]; posts: ScrapedPost[] };

export async function scrapeReporteiDashboard(url: string): Promise<ScrapedReportei> {
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

/**
 * A seção "Dados orgânicos de postagens" é uma tabela real (não cards de
 * texto) — lê via DOM em vez de heurística de texto, por linha (título +
 * colunas mapeadas pelo cabeçalho, já que a ordem das colunas pode variar
 * entre relatórios/plataformas).
 */
async function scrapePostsTableRaw(
  page: import("puppeteer").Page
): Promise<{ postLabel: string; type: string | null; cells: Record<string, string> }[]> {
  return page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, [role='heading']"));
    const heading = headings.find((h) => (h.textContent || "").includes("Dados orgânicos de postagens"));
    if (!heading) return [];

    // A tabela é a primeira <table> encontrada depois do heading no DOM.
    let table: HTMLTableElement | null = null;
    let node: Element | null = heading;
    for (let i = 0; i < 40 && node; i++) {
      const found = node.querySelector?.("table") as HTMLTableElement | null;
      if (found) {
        table = found;
        break;
      }
      node = node.nextElementSibling;
    }
    if (!table) {
      // Fallback: procura qualquer tabela irmã mais adiante no container pai.
      let parent = heading.parentElement;
      for (let i = 0; i < 5 && parent && !table; i++) {
        table = parent.querySelector("table");
        parent = parent.parentElement;
      }
    }
    if (!table) return [];

    const headerCells = Array.from(table.querySelectorAll("thead th, thead td")).map(
      (c) => (c.textContent || "").trim()
    );
    const rows = Array.from(table.querySelectorAll("tbody tr"));
    return rows.map((row) => {
      const tds = Array.from(row.querySelectorAll("td"));
      const cells: Record<string, string> = {};
      tds.forEach((td, i) => {
        const key = headerCells[i] || `col_${i}`;
        cells[key] = (td.textContent || "").trim();
      });
      const postLabel = (tds[0]?.textContent || "").trim();
      const type = tds[1] ? (tds[1].textContent || "").trim() : null;
      return { postLabel, type, cells };
    });
  });
}

function findCell(cells: Record<string, string>, ...names: string[]): string | undefined {
  for (const [key, value] of Object.entries(cells)) {
    if (names.some((n) => key.toLowerCase().includes(n.toLowerCase()))) return value;
  }
  return undefined;
}

async function scrapePostsTable(page: import("puppeteer").Page): Promise<ScrapedPost[]> {
  const raw = await scrapePostsTableRaw(page);
  return raw
    .filter((r) => r.postLabel)
    .map((r) => ({
      postLabel: r.postLabel,
      type: r.type || null,
      alcance: parsePtNumber(findCell(r.cells, "alcance")),
      visualizacoes: parsePtNumber(findCell(r.cells, "visualiza")),
      curtidas: parsePtNumber(findCell(r.cells, "curtida")),
      comentarios: parsePtNumber(findCell(r.cells, "comentário", "comentario")),
      salvamentos: parsePtNumber(findCell(r.cells, "salvo", "salvamento")),
      compartilhamentos: parsePtNumber(findCell(r.cells, "compartilhamento")),
      postedAt: parseBrDate(findCell(r.cells, "criado em")),
    }));
}

async function scrapeReporteiDashboardInner(url: string): Promise<ScrapedReportei> {
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
    const metrics = parseReporteiText(text);
    const posts = await scrapePostsTable(page).catch(() => []);
    if (metrics.length === 0) {
      // Diagnóstico temporário: quando um perfil específico volta sem dados
      // de forma consistente (visto com o perfil da Carol), isso aparece nos
      // logs de deploy do Railway pra entender se é link expirado, relatório
      // sem esse período configurado, ou algo no meio do carregamento.
      console.error(
        `[reportei-scraper] 0 metrics. url=${url} finalUrl=${page.url()} textLen=${text.length} snippet=${JSON.stringify(text.slice(0, 400))}`
      );
    }
    return { metrics, posts };
  } finally {
    await browser.close();
  }
}
