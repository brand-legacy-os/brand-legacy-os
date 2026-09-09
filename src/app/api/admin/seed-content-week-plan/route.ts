import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

const CAROL: Record<number, string> = {
  1: "POST FEED [manhã]: Frase compartilhável\nREELS [tarde]: conteúdo mais profundo - Marketing de Influência\nSTORIES [tarde]: levantada de mão",
  2: "REELS [collab]: Podcast\nSTORIES [podcast]: sequência narrativa\nREELS [collab]: bate bola",
  3: "REELS [manhã - collab]: plano perfeito OU shark\nSTORIES [reels collab]: sequência com link para YouTube\nREELS [tarde]: corte da Carol no PP ou Shark\nSTORIES [reels tarde]: narrativa para autoridade",
  4: "REELS: conteúdo sobre aprendizados no empreendedorismo *[Carol vai produzir]*\nSTORIES: levantada de mão\nREELS RP [collab]: Podcast externo ou collab",
  5: "REELS [collab]: bate bola\nREELS: Operação de mentorado | Vira case, prova social e conteúdo para os dois perfis *[estratégia Dih]*\n  - STORIES: levantada de mão",
  6: "REELS: arrume-se comigo OU YAP fala sincera com empreendedoras *[Carol vai produzir]*",
  7: "CARROSSEL: DUMP da semana *[Carol vai produzir]*",
};

const DOM: Record<number, string> = {
  1: 'CARROSSEL: jornal - "O que aconteceu na semana passada e você não viu"\nREELS: Operação de mentorado | Vira case, prova social e conteúdo para os dois perfis *[estratégia Dih]*\n  - STORIES: levantada de mão',
  2: "REELS [collab]: Podcast\nSTORIES [podcast]: sequência narrativa",
  3: "REELS [manhã - collab]: plano perfeito OU shark\nSTORIES [reels collab]: sequência com link para YouTube\nREELS [tarde]: corte do Dom no PP ou Shark\nSTORIES [reels tarde]: narrativa para autoridade",
  4: "CARROSSEL: polêmica / divisão de opinião (política, finanças…)\nSTORIES: levantada de mão\nREELS RP [collab]: Podcast externo ou collab",
  5: "REELS: microlearning do curso EAD\n  - enquanto não temos, vamos postar cortes da imersão\nYOUTUBE: postar os microlearnings com link e CTA para nosso curso",
  6: "CARROSSEL: DUMP (aprendizados da semana)",
  7: "REELS: individual dele no podcast *[Derick do podcast tem que nos enviar semanalmente]*",
};

const BRAND_LEGACY: Record<number, string> = {
  1: "REELS: depoimento\nSTORIES: levantada de mão → [desdobrar a dor / problema do depoimento]",
  2: "REELS [collab]: Podcast\nSTORIES [podcast]: sequência narrativa",
  3: "REELS [manhã - collab]: plano perfeito OU shark\nYouTube: PP ou Shark\nSTORIES [reels collab]: sequência com link para YouTube",
  4: "CARROSSEL: jornal\n  - STORIES: levantada de mão\n  - NEWs / COMUNIDADE: desdobrar infos do jornal\nREELS [collab]: collab com sócios (um por semana)",
  5: "CARROSSEL [manhã]: depoimento\nREELS [início tarde]: bate bola sócios",
  6: "CARROSSEL: DUMP (aprendizados da semana)",
  7: "Nada",
};

const PROFILE_PLANS: { profileName: string; days: Record<number, string> }[] = [
  { profileName: "Carol Viudes", days: CAROL },
  { profileName: "Dom Barros", days: DOM },
  { profileName: "Brand Legacy (Institucional)", days: BRAND_LEGACY },
];

/**
 * Rota temporária admin-gated pra popular a tabela semanal de referência da
 * subárea Conteúdo — chamada 1x via fetch autenticado, depois removida.
 */
export async function POST() {
  const user = await requireUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const results: { profile: string; weekday: number; action: "upserted" | "profile-not-found" }[] = [];

  for (const plan of PROFILE_PLANS) {
    const profile = await prisma.socialProfile.findFirst({ where: { name: plan.profileName } });
    if (!profile) {
      results.push({ profile: plan.profileName, weekday: 0, action: "profile-not-found" });
      continue;
    }
    for (const [weekdayStr, content] of Object.entries(plan.days)) {
      const weekday = Number(weekdayStr);
      await prisma.contentWeekPlanCell.upsert({
        where: { profileId_weekday: { profileId: profile.id, weekday } },
        create: { profileId: profile.id, weekday, content },
        update: { content },
      });
      results.push({ profile: plan.profileName, weekday, action: "upserted" });
    }
  }

  return NextResponse.json({ count: results.length, results });
}
