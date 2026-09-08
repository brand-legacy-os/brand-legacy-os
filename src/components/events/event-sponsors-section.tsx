import Link from "next/link";
import { formatCompactCurrency } from "@/lib/format";
import { SPONSOR_TIER_META, SPONSOR_PAYMENT_METHOD_META } from "@/lib/sponsors";
import { DonutChart } from "@/components/charts/donut-chart";
import { CollapsibleSection } from "@/components/ui/collapsible-section";

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
  presentationFileUrl: string | null;
  logoUrl: string | null;
  videoUrl: string | null;
  videoFileUrl: string | null;
  activation: string | null;
};

/** Só leitura — patrocinadores só são criados/editados em Patrocínios. */
export function EventSponsorsSection({ eventId, sponsors }: { eventId: string; sponsors: SponsorRow[] }) {
  return (
    <CollapsibleSection
      title="Patrocínio"
      right={
        <div className="flex items-center gap-3">
          <a href={`/api/eventos/${eventId}/export/patrocinios`} className="text-[12px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
          <Link href="/patrocinios" className="text-[12px] font-medium text-brand hover:underline">
            Gerenciar em Patrocínios →
          </Link>
        </div>
      }
    >
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
          <div key={s.id} className="flex flex-col gap-1.5 rounded-(--radius-s) border border-border p-3 hover:bg-surface-muted">
            <Link href={`/patrocinios/${s.id}`} className="flex items-center justify-between">
              <span className="text-[12.5px] font-medium text-ink">{s.name}</span>
              <span className="tnum text-[12.5px] text-ink-soft">{formatCompactCurrency(s.totalValue)}</span>
            </Link>
            <span className="text-[11.5px] font-medium text-ink-soft">
              Contato: {s.contactName} · {s.contactPhone}
            </span>
            <span className="text-[11px] text-ink-faint">
              {SPONSOR_TIER_META[s.tier].label} · {SPONSOR_PAYMENT_METHOD_META[s.paymentMethod].label}
            </span>
            <div className="flex flex-wrap gap-3 text-[11px] text-brand">
              {s.nfUrl && (
                <a href={s.nfUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  NF ↗
                </a>
              )}
              {s.presentationUrl && (
                <a href={s.presentationUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  Apresentação (link) ↗
                </a>
              )}
              {s.presentationFileUrl && (
                <a href={s.presentationFileUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  Apresentação (arquivo) ↗
                </a>
              )}
              {s.logoUrl && (
                <a href={s.logoUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  Logo ↗
                </a>
              )}
              {s.videoUrl && (
                <a href={s.videoUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  Vídeo (link) ↗
                </a>
              )}
              {s.videoFileUrl && (
                <a href={s.videoFileUrl} target="_blank" rel="noreferrer" className="hover:underline">
                  Vídeo (arquivo) ↗
                </a>
              )}
            </div>
            {s.activation && <p className="text-[11px] text-ink-soft">{s.activation}</p>}
          </div>
        ))}
        {sponsors.length === 0 && (
          <p className="text-[12.5px] text-ink-faint">Nenhum patrocinador vinculado ainda.</p>
        )}
      </div>
    </CollapsibleSection>
  );
}
