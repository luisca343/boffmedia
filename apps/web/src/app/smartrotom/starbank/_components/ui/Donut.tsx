import * as React from "react";
import { formatMoney } from "../../_utils/format";

const FG_MUTED = "#5b6b85";
const FG = "#0c1830";

interface Slice { value: number; hex: string }

export function Donut({ data, size = 200, thickness = 22 }: { data: Slice[]; size?: number; thickness?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const c = size / 2;
  let acc = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {data.map((d, i) => {
        const frac = d.value / total;
        const a0 = acc * 2 * Math.PI - Math.PI / 2;
        const a1 = (acc + frac) * 2 * Math.PI - Math.PI / 2;
        acc += frac;
        const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0);
        const x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1);
        const large = frac > 0.5 ? 1 : 0;
        const path = `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
        return <path key={i} d={path} stroke={d.hex} strokeWidth={thickness} fill="none" strokeLinecap="butt" />;
      })}
      <text x={c} y={c - 4} textAnchor="middle" fontSize="11" fill={FG_MUTED}>Total</text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="16" fontWeight="700" fill={FG} className="tabular-nums">
        {formatMoney(total)}
      </text>
    </svg>
  );
}
