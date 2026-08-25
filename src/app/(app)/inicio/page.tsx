import { requireUser } from "@/lib/auth";
import { ROLE_BY_EMAIL } from "@/lib/roles";
import { BrandMark } from "@/components/brand-mark";

function greeting(now: Date) {
  const h = now.getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default async function InicioPage() {
  const user = await requireUser();
  const now = new Date();
  const firstName = user.name.split(" ")[0];
  const role = ROLE_BY_EMAIL[user.email];
  const dateLabel = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(now);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative flex flex-col gap-6 overflow-hidden rounded-(--radius-xl) bg-brand-deep px-10 py-10 text-[#F3EFE1]">
        <div
          className="animate-glow-pulse pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, #E3C374, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 hidden w-[36%] lg:block"
          style={{
            backgroundImage:
              "linear-gradient(to right, #0A1A10 0%, rgba(10,26,16,0.6) 30%, rgba(10,26,16,0.1) 70%, rgba(10,26,16,0) 100%), url(/brand/hero-socios.jpg)",
            backgroundSize: "cover",
            backgroundPosition: "center 25%",
          }}
        />

        <div className="animate-fade-up relative flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-(--radius-s) bg-white/[0.06] text-gold-soft ring-1 ring-white/[0.08]">
            <BrandMark className="h-4.5 w-4.5" />
          </span>
          <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-gold-soft/80">
            {dateLabel}
          </span>
        </div>

        <div className="animate-fade-up relative flex flex-col gap-1.5" style={{ animationDelay: "80ms" }}>
          <h1 className="font-(family-name:--font-display) text-[34px] leading-tight text-[#F3EFE1]">
            {greeting(now)}, {firstName}.
          </h1>
          {role ? (
            <p className="text-[14px] text-[#BFB9A5]">
              Você é <span className="text-gold-soft">{role.cargo}</span> — aqui está o que sustenta esse papel na Brand Legacy.
            </p>
          ) : (
            <p className="text-[14px] text-[#BFB9A5]">
              {user.title || "Bem-vindo(a) de volta ao Brand Legacy OS."}
            </p>
          )}
        </div>
      </div>

      {role ? (
        <>
          <section
            className="animate-fade-up flex flex-col gap-2 rounded-(--radius-l) border border-gold-soft/25 bg-gold-tint/40 p-6"
            style={{ animationDelay: "140ms" }}
          >
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-gold-ink">
              Sua missão
            </p>
            <p className="font-(family-name:--font-display) text-[19px] leading-snug text-ink">
              {role.missao}
            </p>
          </section>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-6">
              <h2 className="text-[13px] font-medium text-ink-soft">
                Atribuições — o que você executa
              </h2>
              <ul className="flex flex-col gap-2.5">
                {role.atribuicoes.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[13.5px] text-ink">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                    {a}
                  </li>
                ))}
              </ul>
            </section>

            <div className="flex flex-col gap-6">
              <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-6">
                <h2 className="text-[13px] font-medium text-ink-soft">Soft skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {role.softSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-surface-muted px-2.5 py-1 text-[12px] text-ink-soft"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>

              <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-6">
                <h2 className="text-[13px] font-medium text-ink-soft">Hard skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {role.hardSkills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-brand-deep/[0.06] px-2.5 py-1 text-[12px] font-medium text-brand-deep"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            </div>
          </div>

          {role.resultadoEsperado && (
            <section className="flex flex-col gap-2 rounded-(--radius-l) border border-border bg-surface-muted p-6">
              <h2 className="text-[13px] font-medium text-ink-soft">Resultado esperado do cargo</h2>
              <p className="text-[13.5px] leading-relaxed text-ink">{role.resultadoEsperado}</p>
            </section>
          )}
        </>
      ) : (
        <section className="rounded-(--radius-l) border border-dashed border-border p-8 text-center text-[13px] text-ink-faint">
          A descrição do seu cargo ainda não está no documento de referência de
          cargos e responsabilidades. Assim que Operações atualizar o
          documento, sua missão, atribuições e skills aparecem aqui
          automaticamente.
        </section>
      )}
    </div>
  );
}
