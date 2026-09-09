import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

/**
 * Roda muitos upserts em lotes, cada lote dentro de UMA transação — em vez
 * de um upsert por vez (cada um com seu próprio commit), que é a razão real
 * de refreshes com milhares de linhas (Windsor/GHL) levarem minutos. SQLite
 * só tem um escritor por vez de qualquer forma, então paralelismo não ajuda
 * aqui — o ganho vem de reduzir o número de commits, não de concorrência.
 */
export async function batchUpsert<T>(
  rows: T[],
  upsertFn: (row: T) => Prisma.PrismaPromise<unknown>,
  chunkSize = 200
): Promise<void> {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    await prisma.$transaction(chunk.map((row) => upsertFn(row)));
  }
}
