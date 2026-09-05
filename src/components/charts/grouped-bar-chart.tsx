// Duas séries fixas por gráfico (ex.: Novos/Churn, Disponível/Realizado) —
// mesmas duas primeiras cores categóricas validadas do donut, para manter
// "cor segue a entidade" consistente em todo o dashboard.
const SERIES_COLORS = ["#0f6c2b", "#B0473A"];

export function GroupedBarChart({
  categories,
  series,
  formatValue,
}: {
  categories: string[];
  series: { label: string; values: number[] }[];
  formatValue: (v: number) => string;
}) {
  const allValues = series.flatMap((s) => s.values);
  const max = Math.max(1, ...allValues);
  // Nomes de categoria longos (ex.: nome de evento) não cabem centralizados
  // sob uma barra estreita — rótulo vai rotacionado e truncado, então a
  // largura de grupo pode ficar menor sem sobrepor o texto do vizinho.
  const width = Math.max(560, categories.length * 72);
  const height = 220;
  const padBottom = 56;
  const padTop = 8;
  const chartH = height - padBottom - padTop;
  const groupWidth = width / categories.length;
  const barWidth = Math.min(14, (groupWidth - 12) / series.length);
  const maxLabelChars = 16;
  const truncate = (label: string) =>
    label.length > maxLabelChars ? `${label.slice(0, maxLabelChars - 1)}…` : label;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-4 text-[11.5px]">
        {series.map((s, i) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-sm"
              style={{ background: SERIES_COLORS[i % SERIES_COLORS.length] }}
            />
            <span className="text-ink-soft">{s.label}</span>
          </div>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          role="img"
          aria-label="Comparação mensal"
          style={{ minWidth: width }}
        >
          <line
            x1={0}
            x2={width}
            y1={height - padBottom}
            y2={height - padBottom}
            stroke="var(--color-border)"
            strokeWidth="1"
          />
          {categories.map((cat, ci) => {
            const groupX = ci * groupWidth;
            return (
              <g key={cat}>
                {series.map((s, si) => {
                  const value = s.values[ci] ?? 0;
                  const barH = (value / max) * chartH;
                  const x = groupX + (groupWidth - series.length * barWidth - (series.length - 1) * 2) / 2 + si * (barWidth + 2);
                  const y = height - padBottom - barH;
                  return (
                    <rect
                      key={s.label}
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(0, barH)}
                      rx={2}
                      fill={SERIES_COLORS[si % SERIES_COLORS.length]}
                    >
                      <title>{`${cat} · ${s.label}: ${formatValue(value)}`}</title>
                    </rect>
                  );
                })}
                <text
                  x={groupX + groupWidth / 2}
                  y={height - padBottom + 14}
                  textAnchor="end"
                  fontSize="9.5"
                  fill="var(--color-ink-faint)"
                  transform={`rotate(-40 ${groupX + groupWidth / 2} ${height - padBottom + 14})`}
                >
                  <title>{cat}</title>
                  {truncate(cat)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
