import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { hasFinanceRole, isFinanceUnlocked } from "@/lib/finance-auth";
import { UnlockForm } from "@/components/finance/unlock-form";

export default async function FinanceUnlockPage() {
  const user = await requireUser();
  if (!hasFinanceRole(user)) redirect("/dashboard");
  if (await isFinanceUnlocked()) redirect("/financeiro");

  return (
    <div className="mx-auto flex w-full max-w-[380px] flex-col gap-8 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-(--radius-m) bg-brand-deep text-[18px] text-gold">
          🔒
        </div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-ink-faint">
          Financeiro
        </p>
        <h1 className="font-(family-name:--font-display) text-[22px] text-ink">
          Área protegida
        </h1>
        <p className="text-[13px] text-ink-soft">
          Restrito a sócios e ao Financeiro. Confirme a senha do módulo para
          continuar.
        </p>
      </div>
      <div className="rounded-(--radius-l) border border-border bg-surface p-6">
        <UnlockForm />
      </div>
    </div>
  );
}
