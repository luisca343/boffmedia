"use client"

import { aniF, hpColor } from "./bs-data"
import { BSTypeRow } from "./bs-type"
import { BSStatusChip } from "./bs-status-chip"
import type { BSXMon } from "./bsx-data"

interface BSXBenchChipProps {
  mon: BSXMon
  hotkey?: string
  disabled?: boolean
  reserved?: boolean
  onClick?: () => void
}

export function BSXBenchChip({ mon, hotkey, disabled, reserved, onClick }: BSXBenchChipProps) {
  const pct = mon.fnt ? 0 : mon.hp

  return (
    <button
      className={[
        "flex items-center gap-[.55rem] p-[.55rem_.6rem] text-left rounded-[var(--radius)] border font-inherit cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)]",
        "min-w-0",
        mon.fnt ? "" : "",
        disabled || mon.fnt ? "opacity-[.45] cursor-not-allowed" : "",
      ].join(" ")}
      style={{
        background: "var(--surface-2)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
      disabled={disabled || mon.fnt}
      onClick={onClick}
    >
      {hotkey && (
        <span
          className="font-mono font-bold text-[.6rem] w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[5px]"
          style={{ background: "color-mix(in srgb, #000 30%, var(--surface-3))", color: "var(--text-muted)", border: "1px solid var(--border-strong)" }}
        >
          {hotkey}
        </span>
      )}
      <img
        src={aniF(mon.id)}
        alt={mon.name}
        className="w-[38px] h-[38px] object-contain shrink-0"
        style={{ filter: mon.fnt ? "grayscale(1) opacity(.5)" : undefined }}
      />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-t-xs flex items-center gap-[.35rem]">
          {mon.name}
          {mon.status && <BSStatusChip status={mon.status} />}
          {reserved && <span className="font-mono text-[.52rem] tracking-[.08em]" style={{ color: "var(--accent-bright)" }}>ELEGIDO</span>}
        </div>
        <div
          className="h-[4px] rounded-[2px] my-[.3rem] overflow-hidden"
          style={{ background: "color-mix(in srgb, #000 40%, var(--surface-3))" }}
        >
          <i className="block h-full rounded-[2px]" style={{ width: `${pct}%`, background: hpColor(pct) }} />
        </div>
        <div className="flex gap-[.25rem]">
          <BSTypeRow types={mon.types} ghost />
        </div>
      </div>
    </button>
  )
}
