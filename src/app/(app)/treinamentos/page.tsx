import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/permissions";
import { TrainingCard } from "@/components/training/training-card";

export default async function TreinamentosPage() {
  const user = await requireUser();
  const admin = isAdmin(user);

  const trainings = await prisma.training.findMany({
    include: {
      attendees: { include: { user: true } },
      materials: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Conhecimento
        </p>
        <h1 className="font-(family-name:--font-display) text-[28px] text-ink">
          Calendário de Treinamentos
        </h1>
        <p className="max-w-[60ch] text-[13px] text-ink-soft">
          Um encontro por mês, sempre na 2ª sexta-feira — confirme presença,
          entre pelo Meet e revisite os materiais depois.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {trainings.map((t) => (
          <TrainingCard
            key={t.id}
            training={t}
            currentUserId={user.id}
            isAdmin={admin}
          />
        ))}
        {trainings.length === 0 && (
          <p className="rounded-(--radius-l) border border-dashed border-border-strong bg-surface px-4 py-6 text-center text-[13px] text-ink-faint">
            Nenhum treinamento agendado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
