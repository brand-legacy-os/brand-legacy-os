"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/financeiro", label: "Visão geral" },
  { href: "/financeiro/indicadores", label: "Indicadores" },
  { href: "/financeiro/dfc", label: "DFC" },
  { href: "/financeiro/caixa", label: "Posição de caixa" },
  { href: "/financeiro/contas-a-pagar", label: "Contas a pagar" },
  { href: "/financeiro/contas-a-receber", label: "Contas a receber" },
];

export function FinanceTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active =
          tab.href === "/financeiro"
            ? pathname === "/financeiro"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-t-(--radius-s) px-3.5 py-2.5 text-[13px] font-medium transition-colors ${
              active
                ? "border-b-2 border-brand-deep text-brand-deep"
                : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
