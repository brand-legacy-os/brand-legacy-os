export function Sparkline({
  series,
  target,
  width = 240,
  height = 64,
}: {
  series: { date: Date; value: number }[];
  target?: number | null;
  width?: number;
  height?: number;
}) {
  if (series.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-[11.5px] text-ink-faint"
      >
        Sem histórico suficiente ainda.
      </div>
    );
  }

  const values = series.map((s) => s.value);
  const max = Math.max(...values, target ?? -Infinity);
  const min = Math.min(...values, target ?? Infinity, 0);
  const range = max - min || 1;
  const pad = 6;

  const points = series.map((s, i) => {
    const x = pad + (i / (series.length - 1)) * (width - pad * 2);
    const y = height - pad - ((s.value - min) / range) * (height - pad * 2);
    return { x, y };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - pad} L ${points[0].x.toFixed(1)} ${height - pad} Z`;

  const targetY =
    target !== null && target !== undefined
      ? height - pad - ((target - min) / range) * (height - pad * 2)
      : null;

  const last = points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-label="Evolução do indicador no período"
    >
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {targetY !== null && (
        <line
          x1={pad}
          x2={width - pad}
          y1={targetY}
          y2={targetY}
          stroke="var(--color-gold)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}
      <path d={areaPath} fill="url(#sparkFill)" />
      <path
        d={linePath}
        fill="none"
        stroke="var(--color-brand)"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.75" fill="var(--color-brand-deep)" />
    </svg>
  );
}
