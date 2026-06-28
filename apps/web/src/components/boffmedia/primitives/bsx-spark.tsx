"use client"

interface BSXSparkProps {
  data: number[]
  w?: number
  h?: number
}

export function BSXSpark({ data, w = 220, h = 44 }: BSXSparkProps) {
  const pts = data.length > 1 ? data : [50, ...data]
  const step = w / (pts.length - 1)
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (v / 100) * h).toFixed(1)}`).join(" ")
  const last = pts[pts.length - 1]

  return (
    <div className="flex items-end gap-[.5rem]">
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="flex-1 min-w-0">
        <line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke="var(--border)" strokeDasharray="3 4" />
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="color-mix(in srgb, var(--secondary) 14%, transparent)" stroke="none" />
        <path d={path} fill="none" stroke="var(--secondary-hover)" strokeWidth={2} />
      </svg>
      <span
        className="font-mono font-bold text-t-sm tabular-nums"
        style={{ color: last >= 50 ? "var(--emerald-400)" : "var(--rose-400)" }}
      >
        {last}%
      </span>
    </div>
  )
}
