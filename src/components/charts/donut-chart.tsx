// Categorical palette validated with dataviz skill's validate_palette.js
// (light mode, all 6 checks pass at 4 slots). Fixed order — never cycled;
// a 5th+ category should fold into "Outros" rather than get a new hue.
const CATEGORICAL = ["#0f6c2b", "#eca206", "#2166AC", "#B0473A"];

export function DonutChart({
  data,
  formatValue,
  centerLabel = "mentorados",
  emptyMessage = "Sem mentorados cadastrados ainda.",
  ariaLabel = "Distribuição de mentorados por produto",
  centerAsCurrency = false,
}: {
  data: { label: string; value: number }[];
  formatValue: (v: number) => string;
  centerLabel?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  /** Mostra formatValue(total) no centro em vez da contagem bruta. */
  centerAsCurrency?: boolean;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0 || data.length === 0) {
    return (
      <p className="py-6 text-center text-[12.5px] text-ink-faint">
        {emptyMessage}
      </p>
    );
  }

  const size = 180;
  const r = 70;
  const strokeWidth = 30;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offset = 0;
  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const seg = {
      ...d,
      color: CATEGORICAL[i % CATEGORICAL.length],
      dasharray: `${Math.max(0, dash - 2)} ${circumference - dash + 2}`,
      dashoffset: -offset,
      pct: Math.round(fraction * 100),
    };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center sm:gap-8">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        role="img"
        aria-label={ariaLabel}
      >
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          {segments.map((s) => (
            <circle
              key={s.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={strokeWidth}
              strokeDasharray={s.dasharray}
              strokeDashoffset={s.dashoffset}
              strokeLinecap="round"
            >
              <title>{`${s.label}: ${formatValue(s.value)} (${s.pct}%)`}</title>
            </circle>
          ))}
        </g>
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize={centerAsCurrency ? "14" : "20"}
          fontWeight="600"
          fill="var(--color-ink)"
          className="tnum"
        >
          {centerAsCurrency ? formatValue(total) : total}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="var(--color-ink-faint)">
          {centerLabel}
        </text>
      </svg>

      <div className="flex flex-col gap-1.5">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[12.5px]">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="text-ink">{s.label}</span>
            <span className="tnum text-ink-faint">
              {formatValue(s.value)} · {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
