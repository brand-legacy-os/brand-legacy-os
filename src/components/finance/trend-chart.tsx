type Point = { label: string; value: number };

export function TrendChart({
  points,
  formatValue,
  color = "var(--color-brand-deep)",
}: {
  points: Point[];
  formatValue: (v: number) => string;
  color?: string;
}) {
  if (points.length === 0) {
    return (
      <p className="py-6 text-center text-[12.5px] text-ink-faint">
        Sem dados suficientes para o gráfico ainda.
      </p>
    );
  }

  const width = 640;
  const height = 180;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;

  const values = points.map((p) => p.value);
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const stepX = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0;
  const yFor = (v: number) =>
    height - padBottom - ((v - min) / range) * (height - padTop - padBottom);
  const xFor = (i: number) => padX + i * stepX;

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.value)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xFor(points.length - 1)} ${yFor(min)} L ${xFor(0)} ${yFor(min)} Z`;
  const zeroY = yFor(0);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="Gráfico de evolução"
    >
      <defs>
        <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {min < 0 && max > 0 && (
        <line
          x1={padX}
          x2={width - padX}
          y1={zeroY}
          y2={zeroY}
          stroke="var(--color-border-strong)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />
      )}

      <path d={areaPath} fill="url(#trendFill)" stroke="none" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <circle key={i} cx={xFor(i)} cy={yFor(p.value)} r={i === points.length - 1 ? 3.5 : 2.5} fill={color} />
      ))}

      {points.map((p, i) => (
        <text
          key={`label-${i}`}
          x={xFor(i)}
          y={height - 8}
          fontSize="10.5"
          textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"}
          fill="var(--color-ink-faint)"
        >
          {p.label}
        </text>
      ))}

      <text
        x={xFor(points.length - 1)}
        y={Math.max(12, yFor(points[points.length - 1].value) - 8)}
        fontSize="11.5"
        fontWeight="600"
        textAnchor="end"
        fill="var(--color-ink)"
      >
        {formatValue(points[points.length - 1].value)}
      </text>
    </svg>
  );
}
