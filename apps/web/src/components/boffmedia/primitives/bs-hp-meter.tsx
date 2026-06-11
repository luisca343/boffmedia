"use client"

import { cn } from "@/lib/utils"
import { hpColor } from "./bs-data"
import { BSTera } from "./bs-tera"
import { BSTypeRow } from "./bs-type"
import { BSStatusChip } from "./bs-status-chip"
import { BSBoost } from "./bs-boost"

interface HpMeterMon {
  name: string
  types: string[]
  hp: number
  fnt?: boolean
  tera?: boolean
  teraType?: string
  status?: string | null
  boosts?: Record<string, number>
}

interface BSHpMeterProps {
  mon: HpMeterMon
  compact?: boolean
}

export function BSHpMeter({ mon, compact }: BSHpMeterProps) {
  const pct = mon.fnt ? 0 : mon.hp
  const boosts = Object.entries(mon.boosts || {}).filter(([, v]) => v)
  const hpc = hpColor(pct)
  return (
    <div
      className="flex flex-col gap-[.3rem] rounded-[var(--radius-lg)]"
      style={{ padding: ".6rem .75rem", background: "color-mix(in srgb, var(--surface) 86%, transparent)" }}
    >
      <div className="flex items-baseline justify-between gap-[.6rem]">
        <div className="font-display font-extrabold text-t-base tracking-[.01em] flex items-center gap-[.5rem] min-w-0">
          {mon.tera && <BSTera type={mon.teraType || "Normal"} size=".85em" />}
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{mon.name}</span>
          <span className="font-mono text-[.66rem] text-[var(--text-dim)] tracking-[.06em] shrink-0">Nv50</span>
        </div>
        <span className="font-mono font-bold text-[.72rem] shrink-0 text-[var(--text-muted)] tabular-nums">
          {mon.fnt ? "DEBILITADO" : `${pct}%`}
        </span>
      </div>
      <div className={cn("relative h-[11px] rounded-[var(--radius-pill)] overflow-hidden border border-[var(--border)]", "bg-[color-mix(in_srgb,#000_45%,var(--surface-3))]")}>
        <div
          className="absolute inset-y-0 left-0 rounded-[inherit] transition-[width] duration-[.6s] ease-[var(--ease)]"
          style={{ width: `${pct}%`, background: `linear-gradient(180deg, color-mix(in srgb, #fff 30%, ${hpc}), ${hpc})`, boxShadow: `0 0 12px -2px ${hpc}` }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0 calc(6.25% - 1px), color-mix(in srgb, #000 40%, transparent) calc(6.25% - 1px) 6.25%)" }}
        />
        {mon.fnt && (
          <div className="absolute inset-y-0 left-0 right-0 rounded-[inherit] bg-[var(--text-dim)]" />
        )}
      </div>
      {!compact && (
        <div className="flex items-center gap-[.35rem] flex-wrap">
          <BSTypeRow types={mon.types} ghost />
          <BSStatusChip status={mon.status} />
          {boosts.map(([s, v]) => <BSBoost key={s} stat={s} value={v} />)}
        </div>
      )}
    </div>
  )
}
