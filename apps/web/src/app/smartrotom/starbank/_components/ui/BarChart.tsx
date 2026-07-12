"use client";
import * as React from "react";


interface Bar { label: string; income: number; expense: number }

export function BarChart({ data, height = 220 }: { data: Bar[]; height?: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(560);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const padX = 40, padY = 18;
  const innerW = w - padX - 12;
  const innerH = height - padY * 2;
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));
  const groupW = innerW / (data.length || 1);
  const barW = Math.min(28, (groupW - 12) / 2);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ y: padY + (1 - t) * innerH, v: t * max }));

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <g>{ticks.map((t, i) => <line key={i} x1={padX} x2={w - 12} y1={t.y} y2={t.y} className="stroke-sb-border" strokeDasharray="2 4" />)}</g>
        <g>{ticks.map((t, i) => <text key={i} x={padX - 8} y={t.y + 3} textAnchor="end" fontSize="10" className="fill-sb-fg-muted tabular-nums">{Math.round(t.v / 1000)}k</text>)}</g>
        {data.map((d, i) => {
          const x0 = padX + groupW * i + groupW / 2;
          const iH = (d.income / max) * innerH;
          const eH = (d.expense / max) * innerH;
          return (
            <g key={i}>
              <rect x={x0 - barW - 3} y={padY + innerH - iH} width={barW} height={iH} className="fill-sb-pos-2" rx="3" />
              <rect x={x0 + 3} y={padY + innerH - eH} width={barW} height={eH} className="fill-sb-neg-2" rx="3" />
              <text x={x0} y={height - 4} textAnchor="middle" fontSize="11" className="fill-sb-fg-muted">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
