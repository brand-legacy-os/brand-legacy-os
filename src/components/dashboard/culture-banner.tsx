export function CultureBanner({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="relative flex flex-wrap items-center justify-between gap-6 overflow-hidden rounded-(--radius-xl) bg-brand-deep px-8 py-6 text-[#F3EFE1]">
      <div
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] sm:block"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0A1A10 0%, rgba(10,26,16,0.55) 30%, rgba(10,26,16,0.15) 65%, rgba(10,26,16,0) 100%), url(/brand/hero-socios.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center 22%",
        }}
      />
      <div className="relative flex flex-col gap-1.5 max-w-[52ch]">
        <span className="w-fit rounded-full border border-gold-soft/30 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-gold-soft/90">
          {eyebrow}
        </span>
        <h2 className="font-(family-name:--font-display) text-[20px] leading-tight text-[#F3EFE1]">
          {title}
        </h2>
        <p className="text-[13px] text-[#BFB9A5]">{subtitle}</p>
      </div>
    </div>
  );
}
