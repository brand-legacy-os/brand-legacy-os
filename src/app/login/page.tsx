import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { BrandMark } from "@/components/brand-mark";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen">
      <div className="relative hidden w-[44%] shrink-0 flex-col justify-between overflow-hidden bg-brand-deep px-12 py-12 text-[#F3EFE1] lg:flex">
        <div
          className="animate-glow-pulse pointer-events-none absolute -left-20 -top-24 h-[380px] w-[380px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #E3C374, transparent 70%)" }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[54%] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/hero-socios.jpg"
            alt=""
            className="animate-ken-burns h-full w-full object-cover object-center"
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, #0A1A10 0%, rgba(10,26,16,0.7) 16%, rgba(10,26,16,0) 42%, rgba(10,26,16,0) 66%, rgba(10,26,16,0.92) 100%)",
            }}
          />
        </div>

        <div className="animate-fade-up relative flex items-center gap-2.5" style={{ animationDelay: "60ms" }}>
          <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-(--radius-s) bg-white/[0.06] text-gold-soft ring-1 ring-white/[0.08]">
            <BrandMark className="h-5 w-5" />
            <span className="animate-shimmer-sweep pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          </span>
          <span className="flex items-baseline gap-1.5">
            <span className="font-(family-name:--font-display) text-[17px] italic leading-tight">
              Brand Legacy
            </span>
            <span className="rounded-full border border-gold-soft/30 px-1.5 py-px text-[9.5px] font-semibold tracking-[0.1em] text-gold-soft/90">
              OS
            </span>
          </span>
        </div>

        <p
          className="animate-fade-up relative max-w-[36ch] text-[13px] leading-relaxed text-[#BFB9A5]"
          style={{ animationDelay: "160ms" }}
        >
          Indicadores, workflow, mentorados e financeiro — sem planilha
          solta, sem retrabalho, sem versão desatualizada.
        </p>

        <p className="animate-fade-up relative text-[11.5px] text-[#9C9484]" style={{ animationDelay: "260ms" }}>
          © {new Date().getFullYear()} Brand Legacy. Uso interno restrito.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-canvas px-6 py-16">
        <div className="animate-fade-up flex w-full max-w-[380px] flex-col gap-8" style={{ animationDelay: "120ms" }}>
          <div className="flex flex-col gap-4 lg:hidden">
            <span className="flex h-12 w-12 items-center justify-center rounded-(--radius-m) bg-brand-deep text-gold-soft">
              <BrandMark className="h-6 w-6" />
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-faint">
              Bem-vindo de volta
            </p>
            <h2 className="font-(family-name:--font-display) text-[27px] font-medium text-ink">
              Entrar no Brand Legacy OS
            </h2>
          </div>

          <div className="rounded-(--radius-l) border border-border bg-surface p-7 shadow-[0_1px_2px_rgba(23,23,15,0.04)]">
            <LoginForm />
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-[12.5px] text-ink-faint">
              Acesso restrito à equipe da Brand Legacy, com contas provisionadas
              por Operações. Login com Google Workspace chega em breve.
            </p>
            <p className="text-[11.5px] text-ink-faint">
              Esqueceu sua senha? Fale com Operações.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
