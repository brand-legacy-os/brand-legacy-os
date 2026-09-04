"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/patrocinios", label: "Dashboard" },
  { href: "/patrocinios/base", label: "Base de patrocinadores" },
  { href: "/patrocinios/historico", label: "Histórico importado" },
];

export function PatrociniosTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active =
          tab.href === "/patrocinios"
            ? pathname === "/patrocinios"
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
