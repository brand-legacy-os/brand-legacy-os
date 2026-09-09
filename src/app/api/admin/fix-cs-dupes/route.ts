import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/**
 * Rota temporaria de correcao — o reimport de CS (reimport-cs-customers)
 * gerou 3 duplicatas: "Blessy", "Harmony Empório Natural" e "Lakma"
 * apareciam tanto na aba CLUB quanto na aba PAINEL DE CONTROLE CLUB com
 * e-mail em formato diferente (célula com múltiplos e-mails separados por
 * quebra de linha), o que quebrou o casamento por chave normalizada.
 *
 * Qualquer `company` com mais de um Customer é agrupado aqui de forma
 * genérica (não hardcoded pros 3 nomes conhecidos): mantém o mais antigo
 * (veio da aba CLUB, com dados mais completos — mentorias com data real),
 * funde notas que não estejam já presentes nele, e apaga os demais.
 */
export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const all = await prisma.customer.findMany({
    where: { company: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { id: true, company: true, notes: true, createdAt: true },
  });

  const groups = new Map<string, typeof all>();
  for (const c of all) {
    const key = (c.company || "").trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(c);
  }

  const results: { company: string; keptId: string; deletedIds: string[] }[] = [];

  for (const [key, group] of groups.entries()) {
    if (group.length < 2) continue;
    const [keep, ...dupes] = group;
    const mergedNotes = [keep.notes, ...dupes.map((d) => d.notes)].filter(Boolean).join(" | ");
    await prisma.customer.update({
      where: { id: keep.id },
      data: { notes: mergedNotes || null },
    });
    for (const d of dupes) {
      await prisma.customer.delete({ where: { id: d.id } });
    }
    results.push({ company: key, keptId: keep.id, deletedIds: dupes.map((d) => d.id) });
  }

  const finalCount = await prisma.customer.count();

  return NextResponse.json({ results, finalCustomerCount: finalCount });
}
