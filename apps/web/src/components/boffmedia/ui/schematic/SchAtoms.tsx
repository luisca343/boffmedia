"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { SCH_GLYPHS, SCH_STATUS, schColor, schColor2, schGlyphFor, schToneVars, type SchTone } from "./schematic-util"

// Schematic Compat atoms: custom glyph, block thumb, stepper, readiness meter,
// status filter chips, layer slider and the 3D preview stage. Prefix sch-.

export function SchGlyph({ name, size = 18, className, style }: { name: string; size?: number; className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={cn("flex-none", className)} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={SCH_GLYPHS[name] || SCH_GLYPHS.cube} />
    </svg>
  )
}

const RING: Record<string, string> = { ok: "var(--ok)", warn: "var(--warn)", bad: "var(--bad)", dim: "var(--line-2)" }

export function BlockThumb({ id, size = 28, ring }: { id: string; size?: number; ring?: SchTone | null }) {
  return (
    <span
      title={id}
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.42),
        background: `linear-gradient(135deg, ${schColor(id)}, ${schColor2(id)})`,
        boxShadow: ring ? `inset 0 1px 0 rgba(255,255,255,0.14), 0 0 0 2px var(--bg), 0 0 0 3px ${RING[ring] || "var(--line-2)"}` : "inset 0 1px 0 rgba(255,255,255,0.14)",
      }}
      className="relative grid flex-none place-items-center overflow-hidden border border-solid border-[rgba(0,0,0,0.35)] font-mono font-bold text-[rgba(255,255,255,0.92)] [text-shadow:0_1px_2px_rgba(0,0,0,0.55)]"
    >
      <span className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(0,0,0,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.18)_1px,transparent_1px)] [background-size:50%_50%]" />
      {schGlyphFor(id)}
    </span>
  )
}

export function SchSteps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="m-0 flex list-none items-center gap-1 p-0" aria-label="Progreso">
      {steps.map((s, i) => {
        const state = i < current ? "done" : i === current ? "active" : "idle"
        return (
          <React.Fragment key={s}>
            {i > 0 && <span aria-hidden className="h-0.5 w-[26px] flex-none bg-line-2 max-[1180px]:w-4" />}
            <li className="flex items-center gap-[7px]">
              <span
                className={cn(
                  "grid h-[22px] w-[22px] flex-none place-items-center border border-solid font-mono text-[11px] font-semibold cut-tag [--cut-tag:5px]",
                  state === "active" ? "border-accent bg-accent text-accent-ink" : state === "done" ? "border-ok bg-ok-soft text-ok" : "border-line-2 bg-panel text-txt-muted",
                )}
              >
                {state === "done" ? <Icon name="check" size={11} /> : String(i + 1)}
              </span>
              <span className={cn("font-mono text-[11px] tracking-[0.03em] max-[1180px]:hidden", state === "active" ? "text-txt" : state === "done" ? "text-txt-muted" : "text-txt-dim")}>{s}</span>
            </li>
          </React.Fragment>
        )
      })}
    </ol>
  )
}

export function CompatMeter({ resolved, total, blocked, size = 64, label = "Listo para exportar" }: { resolved: number; total: number; blocked: number; size?: number; label?: string }) {
  const pct = total ? Math.round((resolved / total) * 100) : 0
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  const tone: SchTone = blocked > 0 ? "warn" : pct >= 100 ? "ok" : "accent"
  return (
    <div className="relative flex items-center gap-3" style={schToneVars(tone)}>
      <svg className="relative block flex-none" width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-line-2" strokeWidth="4" fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} className="stroke-[color:var(--st)] transition-[stroke-dashoffset] duration-[420ms]" strokeWidth="4" fill="none" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="pointer-events-none absolute left-0 top-1/2 flex w-16 -translate-y-1/2 items-baseline justify-center gap-px">
        <b className="font-display text-[22px] font-extrabold italic leading-none text-txt">{pct}</b>
        <small className="font-mono text-[10px] text-txt-dim">%</small>
      </div>
      <div className="flex min-w-0 flex-col gap-[3px]">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-muted">{label}</span>
        <span className="text-[12.5px] text-txt-dim [&_b]:font-semibold [&_b]:text-txt [&_em]:not-italic [&_em]:text-warn">
          <b>{resolved}</b>/{total} resueltos{blocked > 0 ? <> · <em>{blocked} sin resolver</em></> : null}
        </span>
      </div>
    </div>
  )
}

export function StatusChips({ chips, active, onToggle }: { chips: { key: string; label: string; count: number }[]; active: string | null; onToggle: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-[7px]" role="group" aria-label="Filtrar por estado">
      {chips.map((c) => {
        const on = active === c.key
        const dim = active !== null && !on
        return (
          <button
            key={c.key}
            type="button"
            disabled={c.count === 0}
            aria-pressed={on}
            title={c.label}
            onClick={() => onToggle(c.key)}
            style={schToneVars(SCH_STATUS[c.key].tone)}
            className={cn(
              "flex items-center gap-[7px] border border-solid bg-panel px-2.5 py-[5px] font-body text-[12px] text-txt-muted transition-[opacity,border-color,background] duration-[140ms] disabled:cursor-default disabled:opacity-[0.32]",
              on ? "border-[color:var(--st)] bg-[color:var(--st-soft)]" : "border-line hover:border-line-2",
              dim && "opacity-[0.42]",
            )}
          >
            <span className="h-[7px] w-[7px] flex-none bg-[color:var(--st)]" />
            <span className="font-mono text-[12px] font-bold text-[color:var(--st)]">{c.count}</span>
            <span className={cn(on ? "text-txt" : "text-txt-dim")}>{c.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function LayerSlider({ axis = "Y", value, max, onChange }: { axis?: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-none items-center gap-2.5 border-t border-solid border-line px-3 py-[9px]">
      <span className="w-[14px] font-mono text-[11px] font-bold text-accent-bright">{axis}</span>
      <input type="range" min={0} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={"Capa " + axis} className="h-1 flex-1 [accent-color:var(--accent)]" />
      <span className="min-w-[44px] text-right font-mono text-[11px] text-txt-muted">
        {value}/{max}
      </span>
    </div>
  )
}

export function IsoStage({ selected, caption = "Vista 3D del esquema · WebGL" }: { selected?: boolean; caption?: string }) {
  return (
    <div className="relative min-h-[200px] flex-1 overflow-hidden [background:radial-gradient(120%_120%_at_50%_30%,var(--panel)_0%,var(--bg)_80%)]">
      <div aria-hidden className="absolute inset-0 opacity-[0.35] [background-image:linear-gradient(var(--line)_1px,transparent_1px),linear-gradient(90deg,var(--line)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(120%_90%_at_50%_40%,#000_30%,transparent_85%)]" />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="[filter:drop-shadow(0_8px_24px_color-mix(in_srgb,var(--accent)_30%,transparent))] animate-[schfloat_5s_ease-in-out_infinite] motion-reduce:animate-none">
          <g stroke="var(--accent-bright)" strokeWidth="1.5" strokeLinejoin="round">
            <path d="M60 16 L100 38 L60 60 L20 38 Z" fill="color-mix(in srgb, var(--accent) 30%, transparent)" />
            <path d="M20 38 L60 60 L60 104 L20 82 Z" fill="color-mix(in srgb, var(--accent) 15%, transparent)" />
            <path d="M100 38 L60 60 L60 104 L100 82 Z" fill="color-mix(in srgb, var(--accent) 9%, transparent)" />
          </g>
          <g stroke="color-mix(in srgb, var(--accent-bright) 45%, transparent)" strokeWidth="0.75">
            <path d="M40 27 L80 49 M80 27 L40 49" />
          </g>
        </svg>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-txt-dim">{caption}</span>
      </div>
      <div className="absolute inset-x-0 bottom-2.5 text-center text-[11px] text-txt-muted">{selected ? "Bloque seleccionado resaltado" : "Clic en un bloque para inspeccionar"}</div>
    </div>
  )
}
