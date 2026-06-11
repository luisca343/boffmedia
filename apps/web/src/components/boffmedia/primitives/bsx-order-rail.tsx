"use client"

import { aniF } from "./bs-data"
import { effSpeed } from "./bsx-data"
import { Icon } from "./icon"
import type { BSXMon } from "./bsx-data"

interface BSXOrderSlot {
  side: string
  idx: number
  mon?: BSXMon
}

interface BSXOrderRailProps {
  slots: BSXOrderSlot[]
}

export function BSXOrderRail({ slots }: BSXOrderRailProps) {
  const active = slots.filter((s) => s.mon && !s.mon.fnt)
  const withSpe = active.map((s) => ({ ...s, spe: effSpeed(s.mon!) }))
  const order = withSpe.sort((a, b) => b.spe - a.spe)

  return (
    <div
      className="flex items-center gap-[.7rem] flex-wrap p-[.45rem_.8rem] rounded-[var(--radius)] border border-[var(--border)]"
      style={{ background: "color-mix(in srgb, var(--surface) 70%, transparent)" }}
    >
      <span className="font-mono text-[.58rem] tracking-[.1em] uppercase inline-flex items-center gap-[.35rem] whitespace-nowrap" style={{ color: "var(--accent-bright)" }}>
        <Icon name="trending" size={12} /> Orden previsto
      </span>

      <div className="flex gap-[.45rem] flex-wrap">
        {order.map((s, i) => (
          <span
            key={s.side + s.idx}
            className={`inline-flex items-center gap-[.4rem] p-[.22rem_.55rem_.22rem_.35rem] rounded-[var(--radius-pill)] border text-t-xs font-semibold ${
              s.side === "foe" ? "" : ""
            }`}
            style={{
              borderColor: s.side === "foe"
                ? "color-mix(in srgb, var(--orange-500) 40%, var(--border))"
                : "color-mix(in srgb, var(--accent) 36%, var(--border))",
              background: s.side === "foe"
                ? "color-mix(in srgb, var(--orange-500) 10%, var(--surface-2))"
                : "color-mix(in srgb, var(--accent) 10%, var(--surface-2))",
            }}
          >
            <b
              className="font-mono text-[.56rem] w-[14px] h-[14px] rounded-[4px] grid place-items-center"
              style={{ background: "var(--surface-3)", color: "var(--text-muted)" }}
            >
              {i + 1}
            </b>
            <img src={aniF(s.mon!.id)} alt="" className="w-[22px] h-[22px] object-contain" />
            <span className="max-w-[9ch] overflow-hidden text-ellipsis whitespace-nowrap">{s.mon!.name}</span>
            <span className="font-mono text-[.6rem] tabular-nums" style={{ color: "var(--text-dim)" }}>{s.spe}</span>
          </span>
        ))}
      </div>

      <span className="font-mono text-[.58rem] tracking-[.1em] uppercase ml-auto inline-flex items-center gap-[.35rem] whitespace-nowrap" style={{ color: "var(--text-dim)" }}>
        La prioridad puede alterarlo
      </span>
    </div>
  )
}
