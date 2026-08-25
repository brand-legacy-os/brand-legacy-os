"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/cs", label: "Dashboard" },
  { href: "/cs/mentorados", label: "Base de mentorados" },
  { href: "/cs/calendario", label: "Calendário e endomarketing" },
  { href: "/cs/tarefas", label: "Tarefas" },
];

export function CsTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-border">
      {TABS.map((tab) => {
        const active =
          tab.href === "/cs" ? pathname === "/cs" : pathname.startsWith(tab.href);
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
