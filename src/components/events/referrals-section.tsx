import { CollapsibleSection } from "@/components/ui/collapsible-section";

type Referral = {
  id: string;
  referrerName: string | null;
  referrerEmpresa: string | null;
  referrerWhatsapp: string | null;
  referredName: string;
  referredEmpresa: string | null;
  referredInstagram: string | null;
  referredWhatsapp: string | null;
};

/** Lista de referência — quem indicou uma marca pra ser prospectada.
 * Só leitura (importado de planilha), sem form de adicionar/editar aqui. */
export function ReferralsSection({ referrals, exportHref }: { referrals: Referral[]; exportHref?: string }) {
  if (referrals.length === 0) return null;

  return (
    <CollapsibleSection
      title={`Indicações (${referrals.length})`}
      right={
        exportHref ? (
          <a href={exportHref} className="text-[11.5px] font-medium text-brand hover:underline">
            Exportar Excel
          </a>
        ) : undefined
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-border text-left text-[11px] text-ink-faint">
              <th className="py-2 pr-2">Indicado por</th>
              <th className="py-2 pr-2">Empresa (indicador)</th>
              <th className="py-2 pr-2">WhatsApp (indicador)</th>
              <th className="py-2 pr-2">Indicado</th>
              <th className="py-2 pr-2">Empresa/Marca</th>
              <th className="py-2 pr-2">Instagram</th>
              <th className="py-2 pr-2">WhatsApp (indicado)</th>
            </tr>
          </thead>
          <tbody>
            {referrals.map((r) => (
              <tr key={r.id} className="border-b border-border align-top">
                <td className="py-2 pr-2 text-ink-soft">{r.referrerName ?? "—"}</td>
                <td className="py-2 pr-2 text-ink-soft">{r.referrerEmpresa ?? "—"}</td>
                <td className="py-2 pr-2 text-ink-soft">{r.referrerWhatsapp ?? "—"}</td>
                <td className="py-2 pr-2 font-medium text-ink">{r.referredName}</td>
                <td className="py-2 pr-2 text-ink-soft">{r.referredEmpresa ?? "—"}</td>
                <td className="py-2 pr-2 text-ink-soft">{r.referredInstagram ?? "—"}</td>
                <td className="py-2 pr-2 text-ink-soft">{r.referredWhatsapp ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CollapsibleSection>
  );
}
