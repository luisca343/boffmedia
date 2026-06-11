"use client"

import { useEffect, useRef, useState } from "react"
import { aniF, hpColor, tyVar } from "./bs-data"
import { BSTera } from "./bs-tera"
import { BSTypeRow } from "./bs-type"
import { BSStatusChip } from "./bs-status-chip"
import { BSBoost } from "./bs-boost"
import { Icon } from "./icon"
import type { BSXMon } from "./bsx-data"

interface GhostData {
  min: number
  max: number
  ko: { t: string; cls: string } | null
}

interface BSXPlateProps {
  mon: BSXMon
  slotTag?: string
  foe?: boolean
  ghost?: GhostData | null
  active?: boolean
  /** Targeting highlight (aim pulse) without damage preview data. */
  aimed?: boolean
}

export function BSXPlate({ mon, slotTag, foe, ghost, active, aimed }: BSXPlateProps) {
  const pct = !mon || mon.fnt ? 0 : mon.hp

  // Brief flash when HP drops (damage feedback) — CSS class only, no Scene coupling.
  const prevHp = useRef(pct)
  const [flashing, setFlashing] = useState(false)
  useEffect(() => {
    if (pct < prevHp.current) {
      setFlashing(true)
      const t = setTimeout(() => setFlashing(false), 600)
      prevHp.current = pct
      return () => clearTimeout(t)
    }
    prevHp.current = pct
  }, [pct])

  if (!mon) return null
  const gMax = ghost ? Math.min(pct, ghost.max) : 0
  const gMin = ghost ? Math.min(pct, ghost.min) : 0
  const boosts = Object.entries(mon.boosts || {}).filter(([, v]) => v)
  const ty = mon.tera ? (mon.teraType || mon.types[0]) : (mon.types && mon.types[0])

  const plateCls = [
    "w-full max-w-[290px] p-[var(--bsx-pad-lg)] rounded-[var(--radius)] border grid items-center relative overflow-hidden transition-[border-color,box-shadow] duration-[var(--dur)] ease-[var(--ease)]",
    "grid-cols-[50px_1fr] gap-[.5rem_.65rem]",
    foe ? "bsx-plate--foe" : "",
    mon.fnt ? "opacity-[.55]" : "",
    active ? "bsx-plate--active" : "",
    ghost || aimed ? "bsx-plate--aimed" : "",
    flashing ? "bsx-dmg-flash" : "",
  ].filter(Boolean).join(" ")

  const aimGlow = ghost || aimed

  const ariaLabel = [
    `${foe ? "Rival" : "Aliado"}: ${mon.name}`,
    mon.fnt ? "debilitado" : `${pct}% PS`,
    mon.status ? `estado ${mon.status}` : null,
    mon.tera ? `teracristalizado a ${mon.teraType || mon.types[0]}` : null,
  ].filter(Boolean).join(", ")

  return (
    <div
      className={plateCls}
      role="group"
      aria-label={ariaLabel}
      style={{
        "--_ty": tyVar(ty || "Normal"),
        background: "color-mix(in srgb, var(--surface) 88%, transparent)",
        border: active ? "1px solid var(--accent-bright)" : aimGlow ? "color-mix(in srgb, var(--amber-400) 55%, transparent)" : "1px solid var(--border)",
        boxShadow: active ? "0 0 0 1px var(--accent-bright) inset, 0 0 18px -8px var(--accent-bright)" : aimGlow ? "0 0 0 1px color-mix(in srgb, var(--amber-400) 70%, transparent) inset, 0 0 16px -6px var(--amber-400)" : undefined,
        animation: aimGlow ? "bsx-aim-pulse var(--dur-pulse) ease-in-out infinite" : undefined,
      } as React.CSSProperties}
    >
      {/* type aura */}
      <div
        className="absolute pointer-events-none rounded-[50%]"
        style={{
          top: -30, left: -30, width: 120, height: 120,
          background: `radial-gradient(circle, ${tyVar(ty || "Normal")}, transparent 70%)`,
          opacity: .1,
        }}
      />
      <div
        className="relative w-[50px] h-[50px] rounded-[var(--radius)] grid place-items-center overflow-hidden"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <img
          src={aniF(mon.id)}
          alt={mon.name}
          className="w-[46px] h-[46px] object-contain"
          style={{ imageRendering: "pixelated", filter: mon.fnt ? "grayscale(1) brightness(.7)" : undefined }}
        />
        {mon.fnt && (
          <span
            className="absolute inset-0 grid place-items-center font-mono font-bold text-t-3xs tracking-[.08em]"
            style={{ color: "var(--rose-400)", background: "color-mix(in srgb, var(--bg) 55%, transparent)" }}
          >
            KO
          </span>
        )}
      </div>

      <div className="flex flex-col gap-[.3rem] min-w-0">
        <div className="flex items-center gap-[.4rem] min-w-0">
          {slotTag && (
            <span
              className="font-mono font-bold text-t-4xs w-[15px] h-[15px] inline-grid place-items-center rounded-[var(--radius-sm)] shrink-0"
              style={{
                background: foe ? "color-mix(in srgb, var(--orange-500) 20%, transparent)" : "color-mix(in srgb, var(--accent) 24%, transparent)",
                color: foe ? "var(--orange-400)" : "var(--accent-bright)",
                border: foe ? "1px solid color-mix(in srgb, var(--orange-500) 45%, transparent)" : "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
              }}
            >
              {slotTag}
            </span>
          )}
          {mon.tera && <BSTera type={mon.teraType || "Normal"} size=".8em" />}
          <span className="font-display font-extrabold text-t-xs min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{mon.name}</span>
          <span
            className="ml-auto font-mono font-bold text-t-2xs tabular-nums shrink-0"
            style={{ color: "var(--text-muted)" }}
          >
            {mon.fnt ? "KO" : `${pct}%`}
          </span>
        </div>

        <div className="relative h-[10px] rounded-[var(--radius-pill)] overflow-hidden border border-[var(--border)]" style={{ background: "color-mix(in srgb, #000 45%, var(--surface-3))" }}>
          <i className="absolute top-0 bottom-0 w-[1px] pointer-events-none z-[1]" style={{ left: "50%", background: "color-mix(in srgb, #fff 14%, transparent)" }} />
          <i className="absolute top-0 bottom-0 w-[1px] pointer-events-none z-[1]" style={{ left: "25%", background: "color-mix(in srgb, #fff 14%, transparent)" }} />
          <i
            className="absolute inset-y-0 left-0 rounded-[inherit]"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(180deg, color-mix(in srgb, #fff 28%, ${hpColor(pct)}), ${hpColor(pct)})`,
              boxShadow: `0 0 10px -2px ${hpColor(pct)}`,
              transition: "width var(--dur-slow) var(--ease), background var(--dur) var(--ease)",
            }}
          />
          {ghost && gMax > gMin && (
            <i
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: `${pct - gMax}%`,
                width: `${gMax - gMin}%`,
                background: "repeating-linear-gradient(45deg, color-mix(in srgb, var(--amber-400) 75%, transparent) 0 3px, transparent 3px 6px)",
              }}
            />
          )}
          {ghost && gMin > 0 && (
            <i
              className="absolute top-0 bottom-0 pointer-events-none"
              style={{
                left: `${Math.max(0, pct - gMin)}%`,
                width: `${Math.min(gMin, pct)}%`,
                background: "repeating-linear-gradient(45deg, color-mix(in srgb, var(--rose-500) 85%, transparent) 0 3px, rgba(0,0,0,.25) 3px 6px)",
              }}
            />
          )}
        </div>

        {ghost ? (
          <div className="flex items-center gap-[.35rem] font-mono font-bold text-t-3xs" style={{ color: "var(--amber-400)" }}>
            <Icon name="target" size={11} />
            <span className="tabular-nums tracking-[.03em]">−{ghost.min}–{ghost.max}%</span>
            {ghost.ko && (
              <span
                className={`font-mono font-bold text-t-4xs tracking-[.05em] px-[.4em] py-[.16em] rounded-[var(--radius-sm)] whitespace-nowrap ${
                  ghost.ko.cls === "sure" ? "text-white" : ""
                }`}
                style={
                  ghost.ko.cls === "sure"
                    ? { background: "var(--rose-500)" }
                    : { background: "color-mix(in srgb, var(--amber-400) 22%, transparent)", color: "var(--amber-400)", border: "1px solid color-mix(in srgb, var(--amber-400) 45%, transparent)" }
                }
              >
                {ghost.ko.t}
              </span>
            )}
          </div>
        ) : null}
      </div>

      <div className="col-span-2 flex items-center gap-[.3rem] flex-wrap">
        <BSTypeRow types={mon.tera ? [mon.teraType || mon.types[0]] : mon.types} ghost />
        {mon.status && <BSStatusChip status={mon.status} />}
        {mon.protect && (
          <span
            className="font-mono font-bold text-t-4xs tracking-[.08em] px-[.4em] py-[.16em] rounded-[var(--radius-sm)]"
            style={{ color: "var(--cyan-400)", background: "color-mix(in srgb, var(--cyan-500) 16%, transparent)", border: "1px solid color-mix(in srgb, var(--cyan-500) 40%, transparent)" }}
          >
            PROT
          </span>
        )}
        {boosts.map(([s, v]) => <BSBoost key={s} stat={s} value={v as number} />)}
      </div>
    </div>
  )
}
