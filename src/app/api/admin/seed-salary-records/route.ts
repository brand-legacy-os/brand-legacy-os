import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isAdmin } from "@/lib/permissions";
import { prisma } from "@/lib/db";

/**
 * Endpoint temporário de uso único — cadastra os 13 registros reais de
 * Cargos e Salários em produção (o seed completo não pode rodar de novo lá,
 * ele apaga tudo). Sem input externo: os dados vêm hardcoded aqui mesmo,
 * então não há superfície de injeção. Admin-only. Remover depois de usado.
 */
const RECORDS = [
  { email: "gabriel@brandlegacy.com.br", fullName: "Gabriel Silva dos Santos", cargo: "Designer Pl.", areaLabel: "Social", salary: 6000 },
  { email: "isabella@brandlegacy.com.br", fullName: "Isabella Ribeiro Iannaconi", cargo: "Advogada", areaLabel: "Jurídico", salary: 3000 },
  { email: "igor.luis@brandlegacy.com.br", fullName: "Igor Luis de França Silva", cargo: "Analista de Social e Eventos Pl", areaLabel: "Eventos e Social", salary: 7500 },
  { email: "operacoes@brandlegacy.com.br", fullName: "Marcus Vinícius Rodriguês Ferreira da Silva", cargo: "COO", areaLabel: "C-Level", salary: 12000 },
  { email: "thiago@brandlegacy.com.br", fullName: "Tiago", cargo: "SDR Pl", areaLabel: "Comercial", salary: 4000 },
  { email: "alessandra.siqueira@brandlegacy.com.br", fullName: "Alessandra", cargo: "Customer Success Pl", areaLabel: "Customer Success", salary: 5000 },
  { email: "karina.meotti@brandlegacy.com.br", fullName: "Karina Meotti", cargo: "Social Seller Jr", areaLabel: "Comercial", salary: 4000 },
  { email: "guilherme.rocha@brandlegacy.com.br", fullName: "Guilherme da Rocha", cargo: "Editor de Vídeo Pl.", areaLabel: "Social", salary: 5000 },
  { email: "camila.leite@brandlegacy.com.br", fullName: "Camila", cargo: "Customer Success Pl", areaLabel: "Customer Success", salary: 4500 },
  { email: "willian.tavares@brandlegacy.com.br", fullName: "William Tavares", cargo: "Analista Financeiro Sr", areaLabel: "Financeiro", salary: 4500 },
  { email: "karina.carvalho@brandlegacy.com.br", fullName: "Karina de Carvalho", cargo: "Head Comercial", areaLabel: "Comercial", salary: 6000 },
  { email: "lucas.carvalho@brandlegacy.com.br", fullName: "Lucas Carvalho", cargo: "Closer Pl", areaLabel: "Comercial", salary: 4000 },
  { email: "lara.pujalte@brandlegacy.com.br", fullName: "Lara Belle", cargo: "Head de Social", areaLabel: "Social", salary: 9500 },
];

export async function POST() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const results: { email: string; status: string }[] = [];
  for (const r of RECORDS) {
    const target = await prisma.user.findUnique({ where: { email: r.email } });
    if (!target) {
      results.push({ email: r.email, status: "usuário não encontrado" });
      continue;
    }
    await prisma.salaryRecord.upsert({
      where: { userId: target.id },
      create: { userId: target.id, fullName: r.fullName, cargo: r.cargo, areaLabel: r.areaLabel, salary: r.salary },
      update: { fullName: r.fullName, cargo: r.cargo, areaLabel: r.areaLabel, salary: r.salary },
    });
    results.push({ email: r.email, status: "ok" });
  }

  return NextResponse.json({ results });
}
