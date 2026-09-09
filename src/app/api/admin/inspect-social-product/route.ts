import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

export async function GET() {
  const user = await requireUser();
  if (!isAdmin(user)) return NextResponse.json({ error: "Sem permissão." }, { status: 403 });

  const rows = await prisma.ghlOpportunity.findMany({
    where: { channel: "social_selling" },
    select: { name: true, pipelineName: true, product: true, status: true, monetaryValue: true },
  });

  const byProduct = new Map<string, number>();
  for (const r of rows) {
    const key = r.product ?? "null";
    byProduct.set(key, (byProduct.get(key) ?? 0) + 1);
  }

  const testLike = rows.filter((r) => /teste|apagar|^zz /i.test(r.name));

  return NextResponse.json({
    total: rows.length,
    byProduct: Object.fromEntries(byProduct),
    testLikeCount: testLike.length,
    testLikeNames: testLike.map((r) => r.name),
    nullProductSample: rows.filter((r) => r.product === null).slice(0, 20),
  });
}
