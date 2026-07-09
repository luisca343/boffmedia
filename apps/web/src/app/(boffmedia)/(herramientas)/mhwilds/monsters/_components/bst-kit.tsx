import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives"
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

/* ── threat tiers & species meta (editorial — see [deferred] fields on MhMonster) ── */
export const THREAT: Record<number, { key: string; label: string; color: string; desc: string }> = {
  1: { key: "low", label: "Menor", color: "#7fd6a8", desc: "Presa o estorbo. Poco riesgo." },
  2: { key: "med", label: "Estándar", color: "#6cc4e8", desc: "Gran monstruo de cacería habitual." },
  3: { key: "high", label: "Peligroso", color: "#ffb224", desc: "Alta amenaza. Ataques que noquean." },
  4: { key: "apex", label: "Ápex", color: "#ff7a33", desc: "Depredador dominante del bioma." },
  5: { key: "elder", label: "Anciano", color: "#b06bff", desc: "Dragón anciano. Nivel de catástrofe." },
}

export const SPECIES: Record<string, { label: string; icon: IconName; hue: number }> = {
  "flying-wyvern": { label: "Wyvern volador", icon: "flame", hue: 8 },
  "brute-wyvern": { label: "Wyvern bruto", icon: "axe", hue: 24 },
  "fanged-wyvern": { label: "Wyvern colmillo", icon: "bolt", hue: 48 },
  "fanged-beast": { label: "Bestia colmillo", icon: "paw", hue: 210 },
  temnoceran: { label: "Temnóceros", icon: "puzzle", hue: 280 },
  leviathan: { label: "Leviatán", icon: "target", hue: 190 },
  "elder-dragon": { label: "Dragón anciano", icon: "sparkles", hue: 270 },
  wraith: { label: "Wyvern guardián", icon: "sword", hue: 340 },
}

function speciesMeta(species: string): { label: string; icon: IconName; hue: number } {
  return SPECIES[species] ?? { label: cap(species.replace(/-/g, " ")), icon: "paw", hue: speciesHue(species) }
}

function topWeaknesses(m: MhMonster): MhMonsterWeakness[] {
  return m.weaknesses.filter((w) => w.kind === "element").sort((a, b) => (b.level ?? 0) - (a.level ?? 0))
}

/* ── star rating (weakness effectiveness, break impact) ─────────────────────── */
export function MhStars({ value = 0, max = 3 }: { value?: number; max?: number }) {
  return (
    <span className="inline-flex gap-px" title={`${value}/${max}`}>
      {Array.from({ length: max }).map((_, i) => (
        <Icon key={i} name="star" size={12} className={i < value ? "text-warn" : "text-line-2"} />
      ))}
    </span>
  )
}

/* ── threat tier badge ──────────────────────────────────────────────────────── */
export function MhThreatBadge({ threat, showLabel = true, size = "md" }: { threat: number; showLabel?: boolean; size?: "sm" | "md" }) {
  const t = THREAT[threat]
  if (!t) return null
  const sm = size === "sm"
  return (
    <span className="inline-flex items-center gap-1.5" title={t.desc}>
      <span className="inline-flex gap-[2px]">
        {[1, 2, 3, 4, 5].map((n) => (
          <i
            key={n}
            className={cn("block", sm ? "w-1 h-[9px]" : "w-[5px] h-[11px]")}
            style={{ transform: "skewX(-12deg)", background: n <= threat ? t.color : "var(--line-2)" }}
          />
        ))}
      </span>
      {showLabel && (
        <span className={cn("font-mono font-bold leading-none uppercase tracking-[0.06em]", sm ? "text-[9px]" : "text-[10px]")} style={{ color: t.color }}>
          {t.label}
        </span>
      )}
    </span>
  )
}

/* ── species tag ────────────────────────────────────────────────────────────── */
export function MhSpeciesTag({ species, icon = true }: { species: string; icon?: boolean }) {
  const s = speciesMeta(species)
  return (
    <span
      className="inline-flex items-center gap-[5px] px-2 py-1 border border-solid font-mono text-[10px] font-semibold leading-none uppercase tracking-[0.04em]"
      style={{ color: `hsl(${s.hue} 45% 74%)`, background: `hsl(${s.hue} 45% 40% / 0.14)`, borderColor: `hsl(${s.hue} 45% 50% / 0.3)` }}
    >
      {icon && <Icon name={s.icon} size={12} />}
      {s.label}
    </span>
  )
}

/* ── element badge (weakness / damage recommendation) ───────────────────────── */
export function MhElemBadge({ element, stars, muted }: { element: string; stars?: number; muted?: boolean }) {
  const color = elementColor(element)
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-[9px] py-[5px] bg-base-2 border border-solid border-line font-mono text-[12px] font-semibold leading-none", muted && "opacity-45")}>
      <span className="w-[9px] h-[9px] rounded-full flex-none" style={{ background: color, boxShadow: `0 0 8px -1px ${color}` }} />
      <span>{cap(element)}</span>
      {stars != null && <MhStars value={stars} max={3} />}
    </span>
  )
}

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
  const s = speciesMeta(m.species)
  const top = topWeaknesses(m).slice(0, 3)
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ clipPath: "polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 0 100%)" }}
      className={cn(
        "flex flex-col text-left bg-panel border border-solid border-line text-inherit cursor-pointer overflow-hidden transition-[border-color,transform,box-shadow] duration-[140ms] hover:border-line-2 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-16px_#000]",
        active && "border-[var(--mh)] shadow-[0_0_0_1px_var(--mh)]",
      )}
    >
      <div
        className="relative h-[84px] grid place-items-center overflow-hidden"
        style={{
          background: `radial-gradient(120% 90% at 70% 10%, hsl(${s.hue} 45% 30% / 0.5), transparent 60%), repeating-linear-gradient(135deg, var(--bg-2) 0 8px, var(--panel-2) 8px 16px)`,
        }}
      >
        <span style={{ color: active ? `hsl(${s.hue} 55% 74%)` : `hsl(${s.hue} 40% 70% / 0.55)`, filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.4))" }}>
          <Icon name={s.icon} size={40} />
        </span>
        {m.threat != null && (
          <span className="absolute top-[7px] left-[7px]">
            <MhThreatBadge threat={m.threat} size="sm" />
          </span>
        )}
        {m.flagship && (
          <span
            className="absolute top-[7px] right-[7px] font-mono text-[8px] font-bold leading-none uppercase tracking-[0.05em] text-warn bg-warn-soft border border-solid px-[5px] py-[3px]"
            style={{ borderColor: "color-mix(in srgb, var(--warn) 40%, transparent)" }}
            title="Monstruo insignia"
          >
            ◆ Insignia
          </span>
        )}
      </div>
      <div className="p-[9px_10px_10px] flex flex-col gap-0.5 min-w-0">
        <div className="font-display text-[14px] font-bold leading-[1.05] uppercase tracking-[0.01em]">{m.name}</div>
        {m.title && <div className="font-mono text-[10px] font-medium leading-[1.2] text-txt-muted truncate">{m.title}</div>}
        <div className="flex items-center justify-between gap-1.5 mt-[7px]">
          <MhSpeciesTag species={m.species} />
          <span className="inline-flex gap-[3px]">
            {top.map((w) => (
              <span key={w.id} className="w-2 h-2 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.3)_inset]" style={{ background: vulnColor(w) }} title={`${vulnLabel(w)} ${w.level ?? 0}★`} />
            ))}
          </span>
        </div>
      </div>
    </button>
  )
}

/* ── roster: list row ───────────────────────────────────────────────────────── */
export function MonsterRow({ m, active, onClick }: { m: MhMonster; active: boolean; onClick: () => void }) {
  const s = speciesMeta(m.species)
  const top = topWeaknesses(m).slice(0, 3)
  const tc = m.threat != null ? THREAT[m.threat]?.color ?? "var(--mh)" : "var(--mh)"
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ borderLeftColor: tc }}
      className={cn(
        "grid grid-cols-[34px_1fr_auto_auto] items-center gap-2.5 w-full text-left p-[8px_10px] bg-panel border border-solid border-line border-l-[3px] text-inherit cursor-pointer transition-[border-color,background] duration-[140ms] hover:bg-panel-2 hover:border-line-2",
        active && "border-[var(--mh)] shadow-[inset_0_0_0_1px_var(--mh)]",
      )}
    >
      <span
        className="w-[34px] h-[34px] grid place-items-center border border-solid border-line"
        style={{ background: `hsl(${s.hue} 40% 30% / 0.28)`, color: `hsl(${s.hue} 45% 72%)` }}
      >
        <Icon name={s.icon} size={18} />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-[5px] font-display text-[13px] font-bold leading-[1.1] uppercase tracking-[0.01em]">
          <span className="truncate">{m.name}</span>
          {m.flagship && <span className="text-warn text-[10px] flex-none" title="Insignia">◆</span>}
        </span>
        <span className="block font-mono text-[10px] font-medium leading-[1.2] text-txt-dim truncate">
          {s.label}
          {m.locations[0] ? ` · ${m.locations[0].name}` : ""}
        </span>
      </span>
      <span className="inline-flex gap-[3px]">
        {top.map((w) => (
          <span key={w.id} className="w-2 h-2 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.3)_inset]" style={{ background: vulnColor(w) }} title={vulnLabel(w)} />
        ))}
      </span>
      {m.threat != null ? <MhThreatBadge threat={m.threat} showLabel={false} size="sm" /> : <span />}
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
