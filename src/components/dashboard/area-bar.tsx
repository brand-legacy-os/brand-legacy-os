import Link from "next/link";

export function AreaBar({
  name,
  href,
  pct,
}: {
  name: string;
  href: string;
  pct: number | null;
}) {
  const tone =
    pct === null
      ? "bg-ink-faint"
      : pct >= 100
        ? "bg-positive"
        : pct >= 85
          ? "bg-brand"
          : pct >= 60
            ? "bg-warning"
            : "bg-critical";

  return (
    <Link
      href={href}
      className="group grid grid-cols-[140px_1fr_52px] items-center gap-4 rounded-(--radius-s) px-2 py-2 transition-colors hover:bg-surface-muted"
    >
      <span className="truncate text-[13.5px] text-ink group-hover:text-brand-deep">
        {name}
      </span>
      <span className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <span
          className={`block h-full rounded-full ${tone}`}
          style={{ width: `${Math.min(100, Math.max(pct ? 4 : 0, pct ?? 0))}%` }}
        />
      </span>
      <span className="tnum text-right text-[12.5px] text-ink-soft">
        {pct === null ? "—" : `${pct}%`}
      </span>
    </Link>
  );
}
