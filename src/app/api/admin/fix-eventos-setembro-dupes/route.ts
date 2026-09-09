import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/**
 * Rota temporária de correção — reverte a duplicação causada pela primeira
 * rodada de seed-eventos-setembro, que casou por igualdade exata de nome
 * (Sponsor.name) / item (EventBudgetLine.item) e não bateu com registros já
 * existentes grafados de forma diferente ("MARTZ" vs "Martz", "Moleskini" vs
 * "Moleskine" etc.). Para cada par (registro antigo real, duplicata nova),
 * complementa o antigo com dado real que faltava (contato do patrocinador,
 * nome mais descritivo) e apaga a duplicata — nunca sobrescreve status/valor
 * já corretos no antigo com dado potencialmente desatualizado da planilha.
 */
const SPONSOR_MERGES: { oldId: string; newId: string; name: string; contactName: string; contactPhone: string }[] = [
  { oldId: "cmtncygx50051r21ldw1bf013", newId: "cmtuetwo30019mn1l3rp7rpku", name: "Martz", contactName: "Luana Lira / Eduardo Kavaliunas", contactPhone: "31 2181-1072 / 51 9366-9679" },
  { oldId: "cmtnd2c660053r21l81iyj9a3", newId: "cmtuetwnw0017mn1lvzs59mdr", name: "CFO Company", contactName: "Lucas Scheuer", contactPhone: "48 8405-6903" },
  { oldId: "cmtnd48t6005fr21ljbncolx9", newId: "cmtuetwo9001bmn1l4ovoua14", name: "Buzzmates | Inbazz", contactName: "Clara Curto", contactPhone: "27 99945-7910" },
  { oldId: "cmtnddlh70001o91lr0r1m1wa", newId: "cmtuetwng0013mn1lmltjpr8n", name: "TPL Platinum", contactName: "Tiago Campos", contactPhone: "11 96343-2450" },
  { oldId: "cmtndewlh0003o91lvxxha0cv", newId: "cmtuetwnr0015mn1ldcblm2oj", name: "Yampi", contactName: "Ingrind Simões", contactPhone: "21 99992-5456" },
  { oldId: "cmtndfuxs0005o91lzno3gkmy", newId: "cmtuetwot001dmn1lesuajdbv", name: "Patrick Neves", contactName: "Patrick Neves", contactPhone: "19 99944-1444" },
];

const BUDGET_DUPE_NEW_IDS: string[] = [
  "cmtuetwhy0001mn1litcmcptj",
  "cmtuetwij0005mn1le0l7gw03",
  "cmtuetwjc0007mn1ljghfi2xj",
  "cmtuetwk10009mn1lil6ot6zd",
  "cmtuetwl9000hmn1l61rlbvb8",
  "cmtuetwlf000jmn1lvor5cj2i",
  "cmtuetwlx000lmn1lcvus7je3",
  "cmtuetwmh000pmn1lqxgujlau",
  "cmtuetwml000rmn1lixlb5zbn",
  "cmtuetwn0000xmn1ltllnwwcz",
  "cmtuetwn4000zmn1lpxnn91y3",
];

export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const sponsorResults = [];
  for (const m of SPONSOR_MERGES) {
    const old = await prisma.sponsor.findUnique({ where: { id: m.oldId } });
    const dup = await prisma.sponsor.findUnique({ where: { id: m.newId } });
    if (!old || !dup) {
      sponsorResults.push({ ...m, skipped: true, reason: !old ? "old not found" : "dup not found" });
      continue;
    }
    await prisma.sponsor.update({
      where: { id: m.oldId },
      data: {
        name: m.name,
        contactName: old.contactName === "-" || !old.contactName ? m.contactName : old.contactName,
        contactPhone: old.contactPhone === "-" || !old.contactPhone ? m.contactPhone : old.contactPhone,
      },
    });
    await prisma.sponsor.delete({ where: { id: m.newId } });
    sponsorResults.push({ ...m, merged: true });
  }

  const budgetResults = [];
  for (const id of BUDGET_DUPE_NEW_IDS) {
    const dup = await prisma.eventBudgetLine.findUnique({ where: { id } });
    if (!dup) {
      budgetResults.push({ id, skipped: true, reason: "not found" });
      continue;
    }
    await prisma.eventBudgetLine.delete({ where: { id } });
    budgetResults.push({ id, item: dup.item, deleted: true });
  }

  const event = await prisma.event.findFirst({ where: { name: { contains: "Setembro" } }, orderBy: { startDate: "desc" } });
  const finalSponsorCount = event ? await prisma.sponsor.count({ where: { eventId: event.id } }) : null;
  const finalBudgetCount = event ? await prisma.eventBudgetLine.count({ where: { eventId: event.id } }) : null;

  return NextResponse.json({ sponsorResults, budgetResults, finalSponsorCount, finalBudgetCount });
}
