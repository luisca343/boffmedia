"use client"

interface BSXRingProps {
  sec: number
  max?: number
  size?: number
}

export function BSXRing({ sec, max = 45, size = 54 }: BSXRingProps) {
  const r = (size - 6) / 2
  const c = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, sec / max))
  const low = sec <= 10
  return (
    <div
      className="relative grid place-items-center shrink-0"
      style={{ width: size, height: size, animation: low ? "bsx-ring-low .9s ease-in-out infinite" : undefined }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={4} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={low ? "var(--rose-500)" : "var(--accent-bright)"} strokeWidth={4}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - frac)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }}
        />
      </svg>
      <span
        className="absolute font-mono font-bold text-[.78rem] tabular-nums"
        style={{ color: low ? "var(--rose-400)" : undefined }}
      >
        {sec}
      </span>
    </div>
  )
}
