"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import type { NavGroup } from "@/lib/nav";

export function Sidebar({ groups }: { groups: NavGroup[] }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col gap-8 overflow-y-auto border-r border-black/20 bg-brand-deep px-4 py-6 text-[#D9D4C4]">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-(--radius-s) bg-white/[0.06] text-gold-soft ring-1 ring-white/[0.08]">
          <BrandMark className="h-4.5 w-4.5" />
        </span>
        <span className="flex items-baseline gap-1.5">
          <span className="font-(family-name:--font-display) text-[16px] italic leading-tight text-[#F3EFE1]">
            Brand Legacy
          </span>
          <span className="rounded-full border border-gold-soft/30 px-1.5 py-px text-[9px] font-semibold tracking-[0.1em] text-gold-soft/90">
            OS
          </span>
        </span>
      </Link>

      <nav className="flex flex-1 flex-col gap-6">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-1">
            <p className="px-2.5 pb-1 text-[10.5px] font-medium uppercase tracking-[0.13em] text-[#6E7B6D]">
              {group.label}
            </p>
            {group.items.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center justify-between rounded-(--radius-s) px-2.5 py-2 text-[13.5px] transition-colors ${
                    active
                      ? "bg-white/[0.07] font-medium text-gold-soft"
                      : "text-[#BFB9A5] hover:bg-white/[0.05] hover:text-[#F3EFE1]"
                  }`}
                >
                  {active && (
                    <span className="absolute -left-4 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-gold-soft" />
                  )}
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] tnum ${
                        active
                          ? "bg-gold-soft/20 text-gold-soft"
                          : "bg-white/[0.08] text-[#D9D4C4]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </aside>
  );
}
