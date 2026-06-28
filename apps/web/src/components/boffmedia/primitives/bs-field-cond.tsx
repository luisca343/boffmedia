"use client"

import { cn } from "@/lib/utils"

interface FieldCondData {
  name: string
  icon: string
  c: string
  turns?: number
  lvl?: number
}

interface BSFieldCondProps {
  cond: FieldCondData
  side?: boolean
}

export function BSFieldCond({ cond, side }: BSFieldCondProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-[.4rem] rounded-[var(--radius-pill)] font-mono tracking-[.06em] uppercase font-semibold",
        side ? "text-[.58rem] px-[.5rem] py-[.28rem]" : "text-[.62rem] px-[.65rem] py-[.35rem]",
      )}
      style={{
        background: `color-mix(in srgb, ${cond.c} 14%, var(--layer-2))`,
        border: `1px solid color-mix(in srgb, ${cond.c} 38%, var(--border))`,
        color: `color-mix(in srgb, ${cond.c} 88%, var(--text))`,
      }}
    >
      <IconBlock icon={cond.icon} size={side ? 12 : 14} />
      {cond.name}
      {cond.lvl ? ` ×${cond.lvl}` : ""}
      {cond.turns != null && <span className="tabular-nums opacity-70">{cond.turns}t</span>}
    </span>
  )
}

const icons: Record<string, string> = {
  sun: '<circle cx="7" cy="7" r="2.5"/><path d="M7 1v1M7 12v1M1 7h1M12 7h1M2.5 2.5l.7.7M10.8 10.8l.7.7M2.5 11.5l.7-.7M10.8 3.2l.7-.7"/>',
  bolt: '<path d="M7.5 1L3 8h3.5l-.5 5L11 6H7.5l.5-5z"/>',
  shield: '<path d="M7 1L2 3v4a6 6 0 005 5 6 6 0 005-5V3L7 1z"/>',
  target: '<circle cx="7" cy="7" r="5.5"/><circle cx="7" cy="7" r="2"/><circle cx="7" cy="7" r=".5"/><path d="M7 1v2M7 11v2M1 7h2M11 7h2"/>',
  snow: '<circle cx="4" cy="5" r="2.5"/><circle cx="10" cy="7" r="2.5"/><circle cx="7" cy="11" r="2.5"/><path d="M7 4v2M7 14v2M4 9l-2 2M12 6l2 2M4 11l-1 1M12 4l1-1"/>',
  wind: '<path d="M2 5h7a2 2 0 000-4M1 8h8a3 3 0 000-6M3 11h5a1.5 1.5 0 000-3"/>',
}

function IconBlock({ icon, size }: { icon: string; size: number }) {
  const p = icons[icon]
  if (!p) return null
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: size, height: size }}>
      <g dangerouslySetInnerHTML={{ __html: p }} />
    </svg>
  )
}
