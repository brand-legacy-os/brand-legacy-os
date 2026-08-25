"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/social", label: "Indicadores gerais" },
  { href: "/social/colaboradores", label: "Por colaborador" },
  { href: "/social/calendario", label: "Calendário e metodologia" },
  { href: "/social/tarefas", label: "Tarefas" },
  { href: "/social/podcast", label: "Podcast" },
  { href: "/social/crm", label: "CRM Social Selling" },
];

export function SocialTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active =
          tab.href === "/social" ? pathname === "/social" : pathname.startsWith(tab.href);
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
