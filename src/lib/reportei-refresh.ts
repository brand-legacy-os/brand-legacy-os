import { prisma } from "@/lib/db";
import { scrapeReporteiDashboard } from "@/lib/reportei-scraper";
import { generateReporteiInsights } from "@/lib/reportei-insights";

/** Puxa o Reportei de um perfil e grava métricas/posts/insights — mesma
 * lógica usada pelo botão "Atualizar" (refreshSocialReporteiAction) e pelo
 * cron diário das 7h. Não lança: erros viram { error } pro chamador decidir
 * como reportar (ação de usuário vs. log de cron). */
export async function refreshProfileReportei(profileId: string): Promise<{ error?: string; count?: number }> {
  const profile = await prisma.socialProfile.findUnique({ where: { id: profileId } });
  if (!profile || !profile.reporteiUrl) {
    return { error: "Perfil sem link do Reportei vinculado." };
  }

  let metrics, posts;
  try {
    ({ metrics, posts } = await scrapeReporteiDashboard(profile.reporteiUrl));
  } catch {
    return { error: "Não foi possível carregar o Reportei." };
  }
  if (metrics.length === 0) {
    return { error: "O Reportei não retornou dados legíveis dessa vez." };
  }

  const insights = generateReporteiInsights(metrics);

  await prisma.$transaction([
    prisma.socialReporteiInsight.deleteMany({ where: { profileId } }),
    prisma.socialReporteiMetric.createMany({
      data: metrics.map((m) => ({ profileId, ...m })),
    }),
    prisma.socialReporteiInsight.createMany({
      data: insights.map((i) => ({ profileId, ...i })),
    }),
  ]);

  // SQLite não suporta skipDuplicates em createMany — upsert por linha pelo
  // unique (profileId, postLabel, postedAt) em vez disso. O unique composto
  // não aceita null no lookup, então posts sem data (parse falhou) usam
  // findFirst com filtro por null em vez do upsert direto.
  for (const p of posts) {
    if (p.postedAt === null) {
      const existing = await prisma.socialReporteiPost.findFirst({
        where: { profileId, postLabel: p.postLabel, postedAt: null },
      });
      if (existing) {
        await prisma.socialReporteiPost.update({ where: { id: existing.id }, data: p });
      } else {
        await prisma.socialReporteiPost.create({ data: { profileId, ...p } });
      }
      continue;
    }
    await prisma.socialReporteiPost.upsert({
      where: { profileId_postLabel_postedAt: { profileId, postLabel: p.postLabel, postedAt: p.postedAt } },
      create: { profileId, ...p },
      update: {},
    });
  }

  return { count: metrics.length };
}

/** Atualiza todos os perfis com link do Reportei vinculado — usado pelo
 * cron diário. Roda em série (não paralelo) pra não abrir vários Chromes
 * simultâneos no mesmo processo. */
export async function refreshAllProfilesReportei() {
  const profiles = await prisma.socialProfile.findMany({
    where: { reporteiUrl: { not: null } },
    select: { id: true, name: true },
  });

  const results: { profileId: string; name: string; error?: string; count?: number }[] = [];
  for (const p of profiles) {
    const result = await refreshProfileReportei(p.id);
    results.push({ profileId: p.id, name: p.name, ...result });
  }
  return results;
}
