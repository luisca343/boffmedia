"use client"

import { tyVar } from "./bs-data"

interface BSXTickEv {
  turn?: number
  kind?: string
  who?: string
  type?: string
  crit?: boolean
  txt?: string
  dmg?: string
  eff?: string
  boost?: string
}

interface BSXTickProps {
  ev: BSXTickEv
}

export function BSXTick({ ev }: BSXTickProps) {
  if (ev.turn != null) {
    return (
      <div
        className="flex items-center gap-[.55rem] pt-[.45rem] pb-[.15rem] font-mono font-bold text-[.6rem] tracking-[.14em]"
        style={{ color: "var(--accent-bright)", background: "none" }}
      >
        <span>T{ev.turn}</span>
        <i className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg, var(--accent-soft), transparent)" }} />
      </div>
    )
  }

  if (ev.kind === "sys") {
    return (
      <div
        className="relative pl-[.65rem] pr-[.5rem] py-[.3rem] rounded-[var(--radius)] text-t-xs leading-[1.45] italic"
        style={{ color: "var(--text-dim)", background: "none" }}
      >
        <span className="absolute left-0 top-[4px] bottom-[4px] w-[2.5px] rounded-[2px]" style={{ background: "var(--border-strong)" }} />
        <span dangerouslySetInnerHTML={{ __html: ev.txt || "" }} />
      </div>
    )
  }

  const c = ev.type ? tyVar(ev.type)
    : ev.kind === "boost" ? "var(--emerald-400)"
    : ev.kind === "switch" ? "var(--accent)" : "var(--accent)"

  return (
    <div
      className={`relative pl-[.65rem] pr-[.5rem] py-[.3rem] rounded-[var(--radius)] text-t-xs leading-[1.45] ${
        ev.crit ? "" : ""
      }`}
      style={{
        "--_c": c,
        color: "var(--text-muted)",
        background: ev.crit
          ? "color-mix(in srgb, var(--orange-500) 10%, transparent)"
          : `color-mix(in srgb, ${c} 6%, transparent)`,
      } as React.CSSProperties}
    >
      <span
        className="absolute left-0 top-[4px] bottom-[4px] w-[2.5px] rounded-[2px]"
        style={{ background: c, opacity: ev.who === "foe" ? ".55" : undefined }}
      />
      <span
        className="[&_b]:text-[color:var(--text)]"
        dangerouslySetInnerHTML={{ __html: ev.txt || "" }}
      />
      {(ev.dmg || ev.eff || ev.boost) && (
        <span className="inline-flex gap-[.3rem] ml-[.4rem] align-baseline">
          {ev.dmg && (
            <b
              className="font-mono font-bold text-[.56rem] px-[.4em] py-[.14em] rounded-[4px] tracking-[.04em]"
              style={{ color: "var(--rose-400)", background: "color-mix(in srgb, var(--rose-500) 14%, transparent)" }}
            >
              {ev.dmg}
            </b>
          )}
          {ev.eff === "super" && (
            <b
              className="font-mono font-bold text-[.56rem] px-[.4em] py-[.14em] rounded-[4px] tracking-[.04em]"
              style={{ color: "var(--emerald-400)", background: "color-mix(in srgb, var(--emerald-500) 14%, transparent)" }}
            >
              ¡EFICAZ!
            </b>
          )}
          {ev.eff === "weak" && (
            <b
              className="font-mono font-bold text-[.56rem] px-[.4em] py-[.14em] rounded-[4px] tracking-[.04em]"
              style={{ color: "var(--text-dim)", background: "var(--surface-3)" }}
            >
              resistido
            </b>
          )}
          {ev.boost && (
            <b
              className="font-mono font-bold text-[.56rem] px-[.4em] py-[.14em] rounded-[4px] tracking-[.04em]"
              style={{ color: "var(--emerald-400)", background: "color-mix(in srgb, var(--emerald-500) 14%, transparent)" }}
            >
              {ev.boost}
            </b>
          )}
        </span>
      )}
    </div>
  )
}
