import { damageColor, type DamageTone } from "./theme"

// min–max damage band on a 0–100% scale.
export function DamageBar({ minPct = 0, maxPct = 0, tone = "dim" }: { minPct?: number; maxPct?: number; tone?: DamageTone }) {
  const c = damageColor(tone)
  const lo = Math.min(100, minPct)
  const hi = Math.min(100, maxPct)
  return (
    <div className="w-full max-w-[240px]" role="img" aria-label={`${minPct.toFixed(1)}–${maxPct.toFixed(1)}%`}>
      <div className="relative h-2 overflow-hidden border border-solid border-line-2 bg-base">
        <span className="absolute inset-y-0 opacity-[0.35]" style={{ left: 0, width: hi + "%", background: c }} />
        <span className="absolute inset-y-0" style={{ left: lo + "%", width: Math.max(1.5, hi - lo) + "%", background: c }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px]/none text-txt-dim">
        <span>0%</span>
        <span>50%</span>
        <span>100%</span>
      </div>
    </div>
  )
}
