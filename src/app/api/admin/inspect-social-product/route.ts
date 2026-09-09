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

  const testLike = rows.filter((r) => /teste|apagar|^zz /i.test(r.name));
  const real = rows.filter((r) => !testLike.includes(r));

  const byProduct = new Map<string, number>();
  for (const r of real) {
    const key = r.product ?? "null";
    byProduct.set(key, (byProduct.get(key) ?? 0) + 1);
  }

  const wonNullProduct = real.filter((r) => r.status === "won" && r.product === null);
  const statusBreakdown = new Map<string, number>();
  for (const r of real.filter((r) => r.product === null)) {
    statusBreakdown.set(r.status, (statusBreakdown.get(r.status) ?? 0) + 1);
  }

  return NextResponse.json({
    total: rows.length,
    realTotal: real.length,
    byProduct: Object.fromEntries(byProduct),
    testLikeCount: testLike.length,
    testLikeNames: testLike.map((r) => r.name),
    nullProductStatusBreakdown: Object.fromEntries(statusBreakdown),
    wonNullProductCount: wonNullProduct.length,
    wonNullProductSample: wonNullProduct.slice(0, 20).map((r) => ({ name: r.name, pipelineName: r.pipelineName, monetaryValue: r.monetaryValue })),
  });
}
