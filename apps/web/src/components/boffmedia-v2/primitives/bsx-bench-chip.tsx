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
  const off = disabled || mon.fnt

  const ariaLabel = [
    `Cambiar a ${mon.name}`,
    mon.fnt ? "debilitado" : `${pct}% PS`,
    mon.status ? `estado ${mon.status}` : null,
    reserved ? "ya elegido" : null,
    off && !mon.fnt ? "no disponible" : null,
  ].filter(Boolean).join(", ")

  return (
    <button
      className={[
        "bsx-focus flex items-center gap-[.55rem] p-[var(--bsx-pad-md)] text-left rounded-[var(--radius)] border font-inherit cursor-pointer transition-all duration-[var(--dur)] ease-[var(--ease)]",
        "min-w-0",
        off ? "opacity-[.45] cursor-not-allowed" : "hover:-translate-y-px hover:border-edge-strong",
      ].filter(Boolean).join(" ")}
      style={{
        background: "var(--layer-2)",
        border: "1px solid var(--border)",
        color: "var(--text)",
      }}
      disabled={off}
      aria-disabled={off || undefined}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {hotkey && (
        <span
          className="font-mono font-bold text-t-3xs w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[var(--radius-sm)]"
          style={{ background: "color-mix(in srgb, #000 30%, var(--layer-3))", color: "var(--text-muted)", border: "1px solid var(--border-strong)" }}
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
          {mon.fnt && (
            <span aria-hidden="true" className="font-mono font-bold text-t-3xs" style={{ color: "var(--rose-400)" }}>✕</span>
          )}
          {mon.status && <BSStatusChip status={mon.status} />}
          {reserved && <span className="font-mono text-t-4xs tracking-[.08em]" style={{ color: "var(--secondary-hover)" }}>ELEGIDO</span>}
        </div>
        <div
          className="h-[4px] rounded-[var(--radius-pill)] my-[.3rem] overflow-hidden"
          style={{ background: "color-mix(in srgb, #000 40%, var(--layer-3))" }}
        >
          <i className="block h-full rounded-[inherit]" style={{ width: `${pct}%`, background: hpColor(pct) }} />
        </div>
        <div className="flex gap-[.25rem]">
          <BSTypeRow types={mon.types} ghost />
        </div>
      </div>
    </button>
  )
}
