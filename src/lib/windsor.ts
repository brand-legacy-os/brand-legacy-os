const WINDSOR_BASE = "https://connectors.windsor.ai";

/**
 * Chama a API do Windsor.ai (https://connectors.windsor.ai/{connector}) —
 * mesmo mecanismo usado pelo botão "Atualizar" e pelo cron diário. Requer
 * WINDSOR_API_KEY configurada (variável de ambiente, nunca hardcoded).
 */
export async function windsorGet(
  connector: string,
  params: Record<string, string>
): Promise<Record<string, unknown>[]> {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) throw new Error("WINDSOR_API_KEY não configurada.");

  const url = new URL(`${WINDSOR_BASE}/${connector}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error(`Windsor.ai respondeu ${res.status} para o connector "${connector}".`);
  }
  const json = (await res.json()) as { data?: Record<string, unknown>[]; error?: string };
  if (json.error) throw new Error(`Windsor.ai: ${json.error}`);
  return json.data ?? [];
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function windsorNumber(row: Record<string, unknown>, field: string): number {
  return toNumber(row[field]);
}

export function windsorText(row: Record<string, unknown>, field: string): string {
  return row[field] == null ? "" : String(row[field]);
}
