import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/boffmedia/primitives"
import { elementColor } from "../../_components/mh-helpers"
import type { MhMonster, MhMonsterWeakness } from "@/types/tools/mhwilds"

/** Status/effect swatches — cosmetic only (the API gives no colour). */
const STATUS_COLOR: Record<string, string> = {
  poison: "#a855f7",
  paralysis: "#eab308",
  sleep: "#38bdf8",
  blast: "#f97316",
  blastblight: "#f97316",
  stun: "#f59e0b",
  exhaust: "#84cc16",
  fireblight: "#ef4444",
  waterblight: "#3b82f6",
  thunderblight: "#facc15",
  iceblight: "#67e8f9",
  dragonblight: "#c026d3",
}

export function vulnLabel(w: { element?: string; status?: string; effect?: string }): string {
  return w.element ?? w.status ?? w.effect ?? "—"
}
export function vulnColor(w: { kind?: string; element?: string; status?: string; effect?: string }): string {
  if (w.element) return elementColor(w.element)
  const key = (w.status ?? w.effect ?? "").toLowerCase()
  return STATUS_COLOR[key] ?? "var(--mh)"
}

/** Deterministic species hue so avatars read as families. Cosmetic. */
export function speciesHue(species: string): number {
  let h = 0
  for (let i = 0; i < species.length; i++) h = (h * 31 + species.charCodeAt(i)) % 360
  return h
}

const cap = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)

/* ── level pips (weakness strength 0–3) ─────────────────────────────────────── */
export function Pips({ level, color }: { level: number; color: string }) {
  return (
    <span className="inline-flex gap-[3px]">
      {[1, 2, 3].map((i) => (
        <i
          key={i}
          className="w-[14px] h-[6px] -skew-x-12 bg-line-2"
          style={i <= level ? { background: color } : undefined}
        />
      ))}
    </span>
  )
}

/* ── weakness dot row (roster) ──────────────────────────────────────────────── */
export function WeakDots({ monster }: { monster: MhMonster }) {
  const els = monster.weaknesses.filter((w) => w.kind === "element" && (w.level ?? 0) >= 2).slice(0, 4)
  if (!els.length) return null
  return (
    <span className="inline-flex gap-[3px]">
      {els.map((w) => (
        <span
          key={w.id}
          title={cap(vulnLabel(w))}
          className="w-2 h-2 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.3)_inset]"
          style={{ background: vulnColor(w) }}
        />
      ))}
    </span>
  )
}

/* ── roster: grid card ──────────────────────────────────────────────────────── */
export function MonsterCard({ m, active, onClick }: { m: MhMonster; active: boolean; onClick: () => void }) {
  const sh = speciesHue(m.species)
  return (
    <button
      onClick={onClick}
      className={cn(
        "cut-tag [--cut-tag:10px] flex flex-col text-left bg-panel border border-solid border-line overflow-hidden transition-[border-color,transform] duration-[140ms] hover:-translate-y-0.5 hover:border-line-2",
        active && "border-[var(--mh)] shadow-[0_0_0_1px_var(--mh)]",
      )}
    >
      <div
        className="relative h-[84px] grid place-items-center overflow-hidden"
        style={{
          background: `radial-gradient(120% 90% at 70% 10%, hsl(${sh} 45% 30% / 0.5), transparent 60%), repeating-linear-gradient(135deg, var(--bg-2) 0 8px, var(--panel-2) 8px 16px)`,
        }}
      >
        <Icon name="paw" size={40} style={{ color: `hsl(${sh} ${active ? 55 : 40}% ${active ? 74 : 70}% / ${active ? 1 : 0.55})` }} />
      </div>
      <div className="p-[9px_10px_10px] flex flex-col gap-0.5 min-w-0">
        <span className="font-display text-[14px] font-bold leading-[1.05] uppercase tracking-[0.01em] truncate">{m.name}</span>
        <span className="font-mono text-[10px] leading-[1.2] text-txt-muted truncate">{cap(m.species)}</span>
        <span className="flex items-center justify-between gap-1.5 mt-[7px]">
          <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-txt-dim">{m.kind === "large" ? "Grande" : "Pequeño"}</span>
          <WeakDots monster={m} />
        </span>
      </div>
    </button>
  )
}

/* ── roster: list row ───────────────────────────────────────────────────────── */
export function MonsterRow({ m, active, onClick }: { m: MhMonster; active: boolean; onClick: () => void }) {
  const sh = speciesHue(m.species)
  return (
    <button
      onClick={onClick}
      className={cn(
        "grid grid-cols-[34px_1fr_auto] items-center gap-2.5 w-full text-left p-[8px_10px] bg-panel border border-solid border-line border-l-[3px] border-l-[var(--mh)] transition-[border-color,background] duration-[140ms] hover:bg-panel-2 hover:border-line-2",
        active && "border-[var(--mh)] shadow-[inset_0_0_0_1px_var(--mh)]",
      )}
    >
      <span
        className="w-[34px] h-[34px] grid place-items-center border border-solid border-line"
        style={{ background: `hsl(${sh} 40% 30% / 0.28)`, color: `hsl(${sh} 45% 72%)` }}
      >
        <Icon name="paw" size={17} />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-[13px] font-bold leading-[1.1] uppercase tracking-[0.01em] truncate">{m.name}</span>
        <span className="block font-mono text-[10px] leading-[1.2] text-txt-dim truncate">{cap(m.species)}</span>
      </span>
      <WeakDots monster={m} />
    </button>
  )
}

/* ── detail: element weakness cell ──────────────────────────────────────────── */
export function WeakCell({ w, best }: { w: MhMonsterWeakness; best: boolean }) {
  const color = vulnColor(w)
  const immune = (w.level ?? 0) <= 0
  return (
    <div
      className={cn(
        "grid grid-cols-[auto_1fr_auto] items-center gap-2 p-[9px_11px] bg-base-2 border border-solid border-line border-t-2",
        immune && "opacity-50",
      )}
      style={{ borderTopColor: color, ...(best ? { background: `color-mix(in srgb, ${color} 12%, var(--bg-2))`, boxShadow: `0 0 0 1px color-mix(in srgb, ${color} 40%, transparent)` } : {}) }}
    >
      <span className="w-2.5 h-2.5 rounded-full" style={{ background: immune ? "var(--line-2)" : color }} />
      <span className="font-mono text-[12px] text-txt capitalize">{vulnLabel(w)}</span>
      <Pips level={w.level ?? 0} color={color} />
      {w.condition && <span className="col-span-full font-mono text-[10px] leading-[1.3] text-warn pl-[18px]">{w.condition}</span>}
    </div>
  )
}

/* ── detail: status/effect vuln row ─────────────────────────────────────────── */
export function VulnRow({ w }: { w: MhMonsterWeakness }) {
  const color = vulnColor(w)
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-[9px] p-[7px_10px] bg-base-2 border border-solid border-line">
      <span className="w-[9px] h-[9px] rounded-full" style={{ background: color }} />
      <span className="font-body text-[12px] font-semibold capitalize">{vulnLabel(w)}</span>
      <Pips level={w.level ?? 0} color={color} />
    </div>
  )
}

/* ── detail: neutral tag ────────────────────────────────────────────────────── */
export function Tag2({ children, good, dot }: { children: React.ReactNode; good?: boolean; dot?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 p-[4px_8px] font-mono text-[11px] leading-none border border-solid",
        good ? "text-[var(--mh-bright)] border-[var(--mh-line)] bg-panel" : "text-txt-muted bg-base-2 border-line",
      )}
    >
      {dot && <span className="w-2 h-2 rounded-full inline-block" style={{ background: dot }} />}
      {children}
    </span>
  )
}

/* ── detail: drop row ───────────────────────────────────────────────────────── */
export function chanceTone(pct: number): { cls: string; color: string } {
  if (pct >= 60) return { cls: "hi", color: "var(--ok)" }
  if (pct >= 30) return { cls: "mid", color: "var(--warn)" }
  return { cls: "low", color: "var(--bad)" }
}
