import * as React from "react";

export function Sparkline({ data, height = 60, color = "#60a5fa", fillFrom = "rgba(96,165,250,0.45)", fillTo = "rgba(96,165,250,0)", showArea = true, strokeWidth = 2 }: {
  data: number[];
  height?: number;
  color?: string;
  fillFrom?: string;
  fillTo?: string;
  showArea?: boolean;
  strokeWidth?: number;
}) {
  const id = React.useId().replace(/[:]/g, "");
  if (!data || data.length < 2) return null;

  const width = 600;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${path} L${width},${height} L0,${height} Z`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fillFrom} />
          <stop offset="100%" stopColor={fillTo} />
        </linearGradient>
      </defs>
      {showArea && <path d={area} fill={`url(#${id})`} />}
      <path d={path} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r={3.5} fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}
