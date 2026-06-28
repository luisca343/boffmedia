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
  /** Why the move can't be used ("Sin PP", "Bloqueado por Choice"…). */
  disabledReason?: string
  onClick?: () => void
  onHover?: () => void
  onLeave?: () => void
  tera?: boolean
}

export function BSXKey({ move, hotkey, target, selected, disabled, disabledReason, onClick, onHover, onLeave, tera }: BSXKeyProps) {
  const off = disabled || move.pp <= 0
  const reason = off ? (disabledReason ?? (move.pp <= 0 ? "Sin PP" : "No disponible")) : null
  let effTag: { t: string; cls: string } | null = null
  if (move.cat !== "status" && target) {
    const E = effLabel(effMult(move.type, target.tera ? [target.teraType || ""] : target.types))
    if (E) effTag = E
  }

  const ariaLabel = [
    move.name,
    `tipo ${move.type}`,
    `${move.pp} de ${move.maxpp} PP`,
    effTag ? effTag.t : null,
    tera ? "con teracristalización" : null,
    reason,
  ].filter(Boolean).join(", ")

  return (
    <button
      className={[
        "bsx-focus relative flex items-center gap-[.55rem] text-left p-[var(--bsx-pad-md)] min-w-0 rounded-[var(--radius)] cursor-pointer overflow-hidden",
        "font-inherit transition-[transform,box-shadow,border-color] duration-[var(--dur-fast)] ease-[var(--ease)]",
        off ? "opacity-[.4] cursor-not-allowed saturate-[.4]" : "hover:-translate-y-px active:scale-[.98]",
        selected ? "bsx-key--sel" : "",
      ].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      aria-pressed={!!selected}
      aria-disabled={off || undefined}
      style={{
        "--_c": tyVar(move.type),
        color: "var(--text)",
        background: `linear-gradient(135deg, color-mix(in srgb, ${tyVar(move.type)} 13%, var(--layer-1)), var(--layer-1))`,
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
          className="font-mono font-bold text-t-3xs w-[19px] h-[19px] inline-grid place-items-center shrink-0 rounded-[var(--radius-sm)]"
          style={{ background: "color-mix(in srgb, #000 30%, var(--layer-3))", color: "var(--text-muted)", border: "1px solid var(--border-strong)" }}
        >
          {hotkey}
        </span>
      )}

      <div className="min-w-0 flex-1 flex flex-col gap-[.25rem]">
        <div className="font-display font-bold text-t-xs leading-[1.1] flex items-center gap-[.4rem] whitespace-nowrap overflow-hidden text-ellipsis">
          {move.name}
          {reason && (
            <span
              className="font-mono font-normal text-t-4xs tracking-[.04em] px-[.4em] py-[.14em] rounded-[var(--radius-sm)] shrink-0"
              style={{ color: "var(--rose-400)", background: "color-mix(in srgb, var(--rose-500) 14%, transparent)" }}
            >
              {reason}
            </span>
          )}
          {tera && (
            <span
              className="font-mono text-t-4xs tracking-[.08em] px-[.35em] py-[.12em] rounded-[var(--radius-sm)] shrink-0"
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
              className="font-mono font-bold text-t-4xs tracking-[.06em] px-[.4em] py-[.14em] rounded-[var(--radius-sm)]"
              style={{ color: "var(--text-muted)", background: "var(--layer-3)", border: "1px solid var(--border)" }}
            >
              {move.spread === "all" ? "ÁREA·TODOS" : "ÁREA"}
            </span>
          )}
          {move.prio && move.prio > 0 ? (
            <span
              className="font-mono font-bold text-t-4xs tracking-[.06em] px-[.4em] py-[.14em] rounded-[var(--radius-sm)]"
              style={{ color: "var(--cyan-400)", background: "var(--layer-3)", border: "1px solid var(--border)" }}
            >
              +{move.prio}
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-end gap-[.3rem] shrink-0">
        {effTag && (
          <span
            className="font-mono font-bold text-t-4xs tracking-[.05em] px-[.45em] py-[.16em] rounded-[var(--radius-sm)] whitespace-nowrap"
            style={
              effTag.cls === "super"
                ? { color: "var(--emerald-400)", background: "color-mix(in srgb, var(--emerald-500) 16%, transparent)" }
                : effTag.cls === "weak"
                ? { color: "var(--rose-400)", background: "color-mix(in srgb, var(--rose-500) 14%, transparent)" }
                : { color: "var(--text-dim)", background: "var(--layer-3)" }
            }
          >
            {effTag.t}
          </span>
        )}
        <span className="flex items-center gap-[.35rem] font-mono text-t-4xs tabular-nums" style={{ color: "var(--text-dim)" }}>
          <i
            className="w-[34px] h-[4px] rounded-[var(--radius-pill)] overflow-hidden inline-block"
            style={{ background: "color-mix(in srgb, #000 40%, var(--layer-3))" }}
          >
            <b className="block h-full rounded-[inherit]" style={{ width: `${(move.pp / move.maxpp) * 100}%`, background: "var(--secondary-hover)" }} />
          </i>
          {move.pp}/{move.maxpp}
        </span>
      </div>
    </button>
  )
}
