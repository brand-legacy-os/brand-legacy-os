import Link from "next/link";
import { formatCompactCurrency } from "@/lib/format";
import { SPONSOR_TIER_META, SPONSOR_PAYMENT_METHOD_META } from "@/lib/sponsors";
import { DonutChart } from "@/components/charts/donut-chart";

type SponsorRow = {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  tier: keyof typeof SPONSOR_TIER_META;
  totalValue: number;
  paymentMethod: keyof typeof SPONSOR_PAYMENT_METHOD_META;
  nfUrl: string | null;
  presentationUrl: string | null;
  logoUrl: string | null;
  videoUrl: string | null;
  activation: string | null;
};

/** Só leitura — patrocinadores só são criados/editados em Patrocínios. */
export function EventSponsorsSection({ sponsors }: { sponsors: SponsorRow[] }) {
  return (
    <section className="flex flex-col gap-3 rounded-(--radius-l) border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-medium text-ink-soft">Patrocínio</h2>
        <Link href="/patrocinios" className="text-[12px] font-medium text-brand hover:underline">
          Gerenciar em Patrocínios →
        </Link>
      </div>
      {sponsors.length > 1 && (
        <DonutChart
          data={sponsors.map((s) => ({ label: s.name, value: s.totalValue }))}
          formatValue={(v) => formatCompactCurrency(v)}
          centerLabel="patrocinado"
          ariaLabel="Representatividade de cada patrocinador no evento"
        />
      )}
      <div className="flex flex-col gap-2.5">
        {sponsors.map((s) => (
          <Link
            key={s.id}
            href={`/patrocinios/${s.id}`}
            className="flex flex-col gap-1 rounded-(--radius-s) border border-border p-3 hover:bg-surface-muted"
          >
            <div className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-ink">{s.name}</span>
              <span className="tnum text-[12.5px] text-ink-soft">{formatCompactCurrency(s.totalValue)}</span>
            </div>
            <span className="text-[11px] text-ink-faint">
              {s.contactName} · {s.contactPhone} · {SPONSOR_TIER_META[s.tier].label} ·{" "}
              {SPONSOR_PAYMENT_METHOD_META[s.paymentMethod].label}
            </span>
            <div className="flex flex-wrap gap-2 text-[11px] text-brand">
              {s.nfUrl && <span>NF ✓</span>}
              {s.presentationUrl && <span>Apresentação ✓</span>}
              {s.logoUrl && <span>Logo ✓</span>}
              {s.videoUrl && <span>Vídeo ✓</span>}
            </div>
            {s.activation && <p className="text-[11px] text-ink-soft">{s.activation}</p>}
          </Link>
        ))}
        {sponsors.length === 0 && (
          <p className="text-[12.5px] text-ink-faint">Nenhum patrocinador vinculado ainda.</p>
        )}
      </div>
    </section>
  );
}
