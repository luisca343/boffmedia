"use client";
import * as React from "react";
import { formatMoney } from "../../_utils/format";

// Axis/grid/ink follow the theme, so they are Tailwind token classes rather than
// baked hex — a light-tuned grid line is invisible on the dark navy canvas.

interface Point { balance: number; day: number }

export function AreaChart({ data, height = 240, color = "#2463eb", showAxis = true, valueFmt = (v: number) => formatMoney(v) }: {
  data: Point[];
  height?: number;
  color?: string;
  showAxis?: boolean;
  valueFmt?: (v: number) => string;
}) {
  const gid = React.useId().replace(/[:]/g, "");
  const ref = React.useRef<HTMLDivElement>(null);
  const [w, setW] = React.useState(720);
  const [hover, setHover] = React.useState<{ x: number; y: number; d: Point } | null>(null);

  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  if (!data || data.length < 2) {
    return <div ref={ref} className="grid place-items-center text-[13px] text-sb-fg-muted" style={{ height }}>Sin datos suficientes</div>;
  }

  const padX = showAxis ? 36 : 10;
  const padY = showAxis ? 18 : 6;
  const innerW = w - padX - 8;
  const innerH = height - padY * 2;
  const min = Math.min(...data.map((d) => d.balance));
  const max = Math.max(...data.map((d) => d.balance));
  const range = max - min || 1;

  const xy = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * innerW,
    y: padY + (1 - (d.balance - min) / range) * innerH,
    d,
  }));
  const path = xy.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${path} L${xy[xy.length - 1].x},${padY + innerH} L${xy[0].x},${padY + innerH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ y: padY + (1 - t) * innerH, v: min + t * range }));

  function onMove(e: React.MouseEvent) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.max(0, Math.min(data.length - 1, Math.round(((x - padX) / innerW) * (data.length - 1))));
    setHover({ x: xy[idx].x, y: xy[idx].y, d: data[idx] });
  }

  return (
    <div ref={ref} className="relative w-full" style={{ height }} onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
      <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {showAxis && (
          <g>
            {ticks.map((t, i) => <line key={i} x1={padX} x2={w - 8} y1={t.y} y2={t.y} className="stroke-sb-border" strokeDasharray="2 4" />)}
          </g>
        )}
        {showAxis && (
          <g>
            {ticks.map((t, i) => (
              <text key={i} x={padX - 8} y={t.y + 3} textAnchor="end" fontSize="10" className="fill-sb-fg-subtle tabular-nums">
                {Math.round(t.v / 1000)}k
              </text>
            ))}
          </g>
        )}
        <path d={area} fill={`url(#${gid})`} />
        <path d={path} stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {hover && (
          <g>
            <line x1={hover.x} x2={hover.x} y1={padY} y2={padY + innerH} stroke={color} strokeOpacity=".25" strokeDasharray="2 3" />
            <circle cx={hover.x} cy={hover.y} r="4" fill={color} className="stroke-sb-surface" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover && (
        <div
          className="pointer-events-none absolute z-[5] -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-sb-sm border border-sb-border bg-sb-surface px-2.5 py-2 text-[12px] tabular-nums shadow-sb-2"
          style={{ left: hover.x, top: hover.y }}
        >
          <div className="mb-0.5 text-[11px] text-sb-fg-muted">Hace {hover.d.day} días</div>
          <div className="font-bold">{valueFmt(hover.d.balance)}</div>
        </div>
      )}
    </div>
  );
}
