"use client"

import { tyVar, effLabel, effMult } from "./bs-data"
import { BSType } from "./bs-type"
import { BSCat } from "./bs-type"

interface BSXKeyMove {
  name: string
  type: string
  cat: string
  power: number
  acc: number | null
  pp: number
  maxpp: number
  prio?: number
  spread?: string
  effect?: string
}

interface BSXKeyTarget {
  types: string[]
  tera?: boolean
  teraType?: string
}

interface BSXKeyProps {
  move: BSXKeyMove
  hotkey?: string
  target?: BSXKeyTarget | null
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  onHover?: () => void
  onLeave?: () => void
  tera?: boolean
}

export function BSXKey({ move, hotkey, target, selected, disabled, onClick, onHover, onLeave, tera }: BSXKeyProps) {
  const off = disabled || move.pp <= 0
  let effTag: { t: string; cls: string } | null = null
  if (move.cat !== "status" && target) {
    const E = effLabel(effMult(move.type, target.tera ? [target.teraType || ""] : target.types))
    if (E) effTag = E
  }

  return (
    <button
      className={[
        "relative flex items-center gap-[.55rem] text-left p-[.55rem_.65rem_.55rem_.6rem] min-w-0 rounded-[var(--radius)] cursor-pointer overflow-hidden",
        "font-inherit transition-[transform,box-shadow,border-color] duration-[var(--dur)] ease-[var(--ease)]",
        off ? "opacity-[.4] cursor-not-allowed saturate-[.4]" : "",
        selected ? "bsx-key--sel" : "",
      ].filter(Boolean).join(" ")}
      style={{
        "--_c": tyVar(move.type),
        color: "var(--text)",
        background: `linear-gradient(135deg, color-mix(in srgb, ${tyVar(move.type)} 13%, var(--surface)), var(--surface))`,
        border: `1px solid color-mix(in srgb, ${tyVar(move.type)} 36%, var(--border))`,
        boxShadow: selected ? `0 0 0 1px ${tyVar(move.type)} inset, 0 0 18px -8px ${tyVar(move.type)}` : undefined,
      } as React.CSSProperties}
      disabled={off}
      onClick={off ? undefined : onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onFocus={onHover}
      onBlur={onLeave}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ background: tyVar(move.type) }}
      />

      {hotkey && (
        <span
          className="font-mono font-bold text-[.6rem] w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[5px]"
          style={{ background: "color-mix(in srgb, #000 30%, var(--surface-3))", color: "var(--text-muted)", border: "1px solid var(--border-strong)" }}
        >
          {hotkey}
        </span>
      )}

      <div className="min-w-0 flex-1 flex flex-col gap-[.25rem]">
        <div className="font-display font-bold text-[.8rem] leading-[1.1] flex items-center gap-[.4rem] whitespace-nowrap overflow-hidden text-ellipsis">
          {move.name}
          {tera && (
            <span
              className="font-mono text-[.52rem] tracking-[.08em] px-[.35em] py-[.12em] rounded-[4px] shrink-0"
              style={{ background: "var(--purple-500)", color: "#fff" }}
            >
              TERA
            </span>
          )}
        </div>
        <div className="flex items-center gap-[.4rem] flex-wrap">
          <BSType type={move.type} />
          <BSCat cat={move.cat as "phys" | "spec" | "status"} />
          {move.spread && (
            <span
              className="font-mono font-bold text-[.52rem] tracking-[.06em] px-[.4em] py-[.14em] rounded-[4px]"
              style={{ color: "var(--text-muted)", background: "var(--surface-3)", border: "1px solid var(--border)" }}
            >
              {move.spread === "all" ? "ÁREA·TODOS" : "ÁREA"}
            </span>
          )}
          {move.prio && move.prio > 0 ? (
            <span
              className="font-mono font-bold text-[.52rem] tracking-[.06em] px-[.4em] py-[.14em] rounded-[4px]"
              style={{ color: "var(--cyan-400)", background: "var(--surface-3)", border: "1px solid var(--border)" }}
            >
              +{move.prio}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-[.3rem] shrink-0">
        {effTag && (
          <span
            className={`font-mono font-bold text-[.56rem] tracking-[.05em] px-[.45em] py-[.16em] rounded-[4px] whitespace-nowrap ${
              effTag.cls === "super" ? "" : effTag.cls === "weak" ? "" : ""
            }`}
            style={
              effTag.cls === "super"
                ? { color: "var(--emerald-400)", background: "color-mix(in srgb, var(--emerald-500) 16%, transparent)" }
                : effTag.cls === "weak"
                ? { color: "var(--rose-400)", background: "color-mix(in srgb, var(--rose-500) 14%, transparent)" }
                : { color: "var(--text-dim)", background: "var(--surface-3)" }
            }
          >
            {effTag.t}
          </span>
        )}
        <span className="flex items-center gap-[.35rem] font-mono text-[.56rem] tabular-nums" style={{ color: "var(--text-dim)" }}>
          <i
            className="w-[34px] h-[4px] rounded-[2px] overflow-hidden inline-block"
            style={{ background: "color-mix(in srgb, #000 40%, var(--surface-3))" }}
          >
            <b className="block h-full rounded-[2px]" style={{ width: `${(move.pp / move.maxpp) * 100}%`, background: "var(--accent-bright)" }} />
          </i>
          {move.pp}/{move.maxpp}
        </span>
      </div>
    </button>
  )
}
