"use client"

import { cn } from "@/lib/utils"
import { hpColor } from "./bs-data"
import { BSPokeChip } from "./bs-poke-chip"
import { BSStatusChip } from "./bs-status-chip"
import { BSTypeRow } from "./bs-type"

interface TraySlotMon {
  id: string
  name: string
  types: string[]
  hp: number
  fnt?: boolean
  status?: string | null
}

interface BSTraySlotProps {
  mon: TraySlotMon
  active?: boolean
  onClick?: () => void
}

export function BSTraySlot({ mon, active, onClick }: BSTraySlotProps) {
  const pct = mon.fnt ? 0 : mon.hp
  return (
    <button
      className={cn(
        "flex gap-[.6rem] items-center rounded-[var(--radius)] cursor-pointer text-left",
        "border border-solid transition-all duration-[var(--dur)] ease-[var(--ease)] text-[var(--text)] font-inherit",
        "px-[.6rem] py-[.55rem] bg-[var(--surface-2)] border-[var(--border)]",
        "hover:not(:disabled):border-[var(--accent-bright)] hover:not(:disabled):translate-y-[-2px]",
        "disabled:opacity-45 disabled:cursor-not-allowed",
        active && "border-[var(--accent-bright)] shadow-[inset_0_0_0_1px_var(--accent-bright)]",
      )}
      onClick={onClick}
      disabled={mon.fnt || active}
    >
      <BSPokeChip mon={mon} sm />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-t-sm flex items-center gap-[.4rem]">
          {mon.name}
          {mon.status && <BSStatusChip status={mon.status} />}
          {active && <span className="font-mono text-[.54rem] text-[var(--accent-bright)] tracking-[.1em]">ACTIVO</span>}
        </div>
        <div className="flex gap-[.25rem] mt-[.35rem]"><BSTypeRow types={mon.types} ghost /></div>
        {!mon.fnt && (
          <div
            className="h-[5px] rounded-[3px] overflow-hidden mt-[.35rem]"
            style={{ background: "color-mix(in srgb, #000 45%, var(--surface-3))" }}
          >
            <span className="block h-full" style={{ width: `${pct}%`, background: hpColor(pct) }} />
          </div>
        )}
      </div>
    </button>
  )
}
