"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon, type IconName } from "@/components/boffmedia/primitives"
import { MhStars } from "@/app/(boffmedia)/(herramientas)/mhwilds/monsters/_components/bst-kit"
import { MhRarity } from "@/app/(boffmedia)/(herramientas)/mhwilds/_components/ui/mh-kit"

// v3 «Señal» — MH Wilds Bestiary detail molecules (weakness/hitzone/drops/
// strategy). Mirrors v3-mh-monsters-kit.jsx; prop-driven (mock data). [deferred]

export const MH_ELEM: Record<string, { color: string; label: string; short: string }> = {
  fire: { color: "#ff7a5c", label: "Fuego", short: "FUE" },
  water: { color: "#4f89e8", label: "Agua", short: "AGU" },
  thunder: { color: "#e0c93c", label: "Rayo", short: "RAY" },
  ice: { color: "#5fe3f0", label: "Hielo", short: "HIE" },
  dragon: { color: "#b06bff", label: "Dragón", short: "DRA" },
}
export const MH_WEAK_ORDER = ["fire", "water", "thunder", "ice", "dragon"]

const HZ_COLOR: Record<string, string> = { great: "#46e39a", good: "#8fd6a0", ok: "var(--warn)", poor: "var(--line-2)" }
const HZ_TEXT: Record<string, string> = { great: "#46e39a", good: "#8fd6a0", ok: "var(--warn)", poor: "var(--dim)" }
function hzTone(v: number): string {
  return v >= 45 ? "great" : v >= 30 ? "good" : v >= 15 ? "ok" : "poor"
}

// ── weakness grid ─────────────────────────────────────────────────────────────
export interface MhWeak {
  element: string
  stars: number
  condition?: string
}
export function MhWeaknessGrid({ weaknesses }: { weaknesses: MhWeak[] }) {
  const byEl: Record<string, MhWeak> = {}
  weaknesses.forEach((w) => (byEl[w.element] = w))
  const rows = MH_WEAK_ORDER.map((el) => byEl[el] || { element: el, stars: 0 })
  return (
    <div className="grid gap-[7px] [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
      {rows.map((w) => {
        const m = MH_ELEM[w.element]
        return (
          <div
            key={w.element}
            style={{ "--ec": m.color } as React.CSSProperties}
            className={cn("grid grid-cols-[auto_1fr_auto] items-center gap-2 border border-solid border-line border-t-2 border-t-[color:var(--ec)] bg-base-2 px-[11px] py-[9px]", w.stars >= 3 && "bg-[color-mix(in_srgb,var(--ec)_12%,var(--bg-2))] [box-shadow:0_0_0_1px_color-mix(in_srgb,var(--ec)_40%,transparent)]", w.stars === 0 && "opacity-50")}
          >
            <span className={cn("h-2.5 w-2.5 rounded-full", w.stars === 0 ? "bg-line-2" : "bg-[color:var(--ec)]")} />
            <span className="font-mono text-[12px]/none font-semibold text-txt">{m.label}</span>
            <MhStars value={w.stars} max={3} />
          </div>
        )
      })}
    </div>
  )
}

// ── status vulnerabilities ────────────────────────────────────────────────────
const STATUS_DEFS = [
  { key: "poison", label: "Veneno", color: "#a855f7" },
  { key: "sleep", label: "Sueño", color: "#6f8bff" },
  { key: "paralysis", label: "Parálisis", color: "#ffd34d" },
  { key: "blast", label: "Explosión", color: "#ff8a3d" },
  { key: "stun", label: "Aturdir", color: "#ffe08a" },
  { key: "exhaust", label: "Agotar", color: "#7fd6a8" },
]
const EFF_LABEL = ["Inmune", "Bajo", "Medio", "Alto"]
export function MhStatusVulns({ statuses }: { statuses: Record<string, { eff: number }> }) {
  return (
    <div className="flex flex-col gap-[5px]">
      {STATUS_DEFS.map((s) => {
        const eff = statuses[s.key]?.eff ?? 0
        return (
          <div key={s.key} style={{ "--sc": s.color } as React.CSSProperties} className={cn("grid grid-cols-[auto_1fr_auto_auto] items-center gap-[9px] border border-solid border-line bg-base-2 px-2.5 py-[7px]", eff === 0 && "opacity-[0.42]")}>
            <span className={cn("h-[9px] w-[9px] rounded-full", eff === 0 ? "bg-line-2" : "bg-[color:var(--sc)]")} />
            <span className="font-body text-[12px]/none font-semibold">{s.label}</span>
            <span className="inline-flex gap-[3px]">
              {[1, 2, 3].map((n) => (
                <i key={n} className={cn("h-[6px] w-[14px] [transform:skewX(-14deg)]", n <= eff ? "bg-[color:var(--sc)]" : "bg-line-2")} />
              ))}
            </span>
            <span className="min-w-[42px] text-right font-mono text-[10px]/none font-semibold uppercase tracking-[0.05em] text-txt-dim">{EFF_LABEL[eff]}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── hitzones ──────────────────────────────────────────────────────────────────
export interface MhHitzone {
  part: string
  sever: number
  blunt: number
  shot: number
  fire?: number
  water?: number
  thunder?: number
  ice?: number
  dragon?: number
  stun?: number
  weakest?: boolean
}
export function MhHitzoneScan({ hitzones }: { hitzones: MhHitzone[] }) {
  const ranked = hitzones
    .map((h) => {
      const best = Math.max(h.sever, h.blunt, h.shot)
      const bestType = h.sever >= h.blunt && h.sever >= h.shot ? "Corte" : h.blunt >= h.shot ? "Impacto" : "Disparo"
      return { part: h.part, best, bestType, weakest: h.weakest }
    })
    .sort((a, b) => b.best - a.best)
  const top = ranked[0]?.best || 1
  return (
    <div className="flex flex-col gap-[7px]">
      {ranked.map((r) => (
        <div key={r.part} className="grid grid-cols-[130px_1fr_auto] items-center gap-[11px]">
          <span className={cn("truncate font-body text-[12px]/[1.2] font-semibold", r.weakest ? "text-[color:var(--mh-bright)]" : "text-txt")}>{r.part}</span>
          <span className="h-3 overflow-hidden border border-solid border-line bg-base-deep">
            <i className="block h-full" style={{ width: (r.best / top) * 100 + "%", background: HZ_COLOR[hzTone(r.best)] }} />
          </span>
          <span className="whitespace-nowrap font-mono text-[11px]/none font-semibold text-txt-muted [&_b]:text-txt">
            <b>{r.best}</b> · {r.bestType}
          </span>
        </div>
      ))}
    </div>
  )
}

const HZ_PHYS: [keyof MhHitzone, string][] = [["sever", "Corte"], ["blunt", "Impacto"], ["shot", "Disparo"]]
export function MhHitzoneTable({ hitzones }: { hitzones: MhHitzone[] }) {
  const th = "whitespace-nowrap border-b border-solid border-line px-1.5 py-2 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.06em] text-txt-dim"
  const td = "border-b border-solid border-line px-1.5 py-2 text-center"
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse font-mono text-[12px] font-semibold">
        <thead>
          <tr>
            <th className={cn(th, "text-left")}>Parte</th>
            {HZ_PHYS.map(([k, l]) => (
              <th key={k} className={th}>
                {l}
              </th>
            ))}
            {MH_WEAK_ORDER.map((el) => (
              <th key={el} className={th} title={MH_ELEM[el].label}>
                <span className="mr-1 inline-block h-2 w-2 rounded-full align-0" style={{ background: MH_ELEM[el].color }} />
                {MH_ELEM[el].short}
              </th>
            ))}
            <th className={th} title="Aturdimiento">
              KO
            </th>
          </tr>
        </thead>
        <tbody>
          {hitzones.map((h) => (
            <tr key={h.part} className={h.weakest ? "[&_td]:bg-[var(--mh-soft)]" : undefined}>
              <td className={cn(td, "text-left font-body text-[12px] text-txt")}>
                {h.weakest && <span className="mr-1.5 text-[10px] text-[color:var(--mh-bright)]">◆</span>}
                {h.part}
              </td>
              {HZ_PHYS.map(([k]) => (
                <td key={k} className={td} style={{ color: HZ_TEXT[hzTone(h[k] as number)], fontWeight: hzTone(h[k] as number) === "great" ? 700 : undefined }}>
                  {h[k] as number}
                </td>
              ))}
              {MH_WEAK_ORDER.map((el) => {
                const v = h[el as keyof MhHitzone] as number | undefined
                return (
                  <td key={el} className={td} style={v ? { color: HZ_TEXT[hzTone(v)] } : { color: "var(--dim)" }}>
                    {v || "—"}
                  </td>
                )
              })}
              <td className={td} style={h.stun ? { color: HZ_TEXT[hzTone(h.stun)] } : { color: "var(--dim)" }}>
                {h.stun || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-[11px] flex flex-wrap gap-x-[14px] gap-y-1.5 font-mono text-[10px]/none text-txt-dim [&_i]:mr-1 [&_i]:inline-block [&_i]:h-2.5 [&_i]:w-2.5 [&_i]:align-[-1px]">
        <span>
          <i style={{ background: "#46e39a" }} /> ≥45 excelente
        </span>
        <span>
          <i style={{ background: "#8fd6a0" }} /> 30–44 bueno
        </span>
        <span>
          <i style={{ background: "var(--warn)" }} /> 15–29 flojo
        </span>
        <span>
          <i style={{ background: "var(--line-2)" }} /> &lt;15 rebota
        </span>
      </div>
    </div>
  )
}

// ── drops ─────────────────────────────────────────────────────────────────────
export function MhDropChance({ chance, rare }: { chance: number; rare?: boolean }) {
  const band = rare ? "rare" : chance >= 40 ? "hi" : chance >= 18 ? "mid" : "low"
  const col = { hi: "var(--ok)", mid: "var(--warn)", low: "var(--bad)", rare: "var(--rar8)" }[band]
  return (
    <span className="inline-flex min-w-[96px] items-center gap-[7px]" title={chance + "% de probabilidad"}>
      <span className="h-[7px] flex-1 overflow-hidden border border-solid border-line bg-base-deep">
        <i className="block h-full" style={{ width: Math.max(6, Math.min(100, chance)) + "%", background: col }} />
      </span>
      <span className="min-w-[30px] text-right font-mono text-[11px]/none font-bold" style={{ color: col }}>
        {chance}%
      </span>
    </span>
  )
}

const DROP_TYPES: Record<string, { label: string; icon: IconName }> = {
  carve: { label: "Corte", icon: "sword" },
  reward: { label: "Recompensa", icon: "gift" },
  break: { label: "Rotura", icon: "hammer" },
  investigation: { label: "Investigación", icon: "compass" },
  track: { label: "Rastro", icon: "target" },
}
export interface MhRewardItem {
  name: string
  rarity: number
}
export interface MhReward {
  item: MhRewardItem
  conditions: { type: string; rank?: string; chance: number; quantity: number; subtype?: string }[]
}
export function MhDropTable({ rewards }: { rewards: MhReward[] }) {
  const rows: { item: MhRewardItem; cond: MhReward["conditions"][number]; rare: boolean }[] = []
  rewards.forEach((r) => r.conditions.forEach((c) => rows.push({ item: r.item, cond: c, rare: r.item.rarity >= 7 })))
  rows.sort((a, b) => b.cond.chance - a.cond.chance)
  return (
    <div className="flex flex-col gap-[5px]">
      {rows.map((row, i) => {
        const dt = DROP_TYPES[row.cond.type] || { label: row.cond.type, icon: "gift" as IconName }
        return (
          <div key={i} className={cn("grid grid-cols-[minmax(0,1.5fr)_auto_auto_minmax(96px,0.8fr)] items-center gap-3 border border-solid border-line bg-base-2 px-[11px] py-2", row.rare && "border-[color-mix(in_srgb,var(--rar8)_40%,var(--line))] bg-[color-mix(in_srgb,var(--rar8)_6%,var(--bg-2))]")}>
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-[11px] w-[11px] flex-none rotate-45 border border-solid" style={{ borderColor: `var(--rar${row.item.rarity})`, background: `var(--rar${row.item.rarity})` }} />
              <span className="truncate font-body text-[13px] text-txt">{row.item.name}</span>
              <MhRarity rarity={row.item.rarity} />
              {row.rare && <span className="text-[12px] text-[color:var(--rar8)]" title="Material raro">★</span>}
            </span>
            <span className="inline-flex items-center gap-[5px] whitespace-nowrap font-mono text-[10px]/none uppercase tracking-[0.04em] text-txt-muted">
              <Icon name={dt.icon} size={11} />
              {dt.label}
              {row.cond.subtype ? " · " + row.cond.subtype : ""}
            </span>
            <span className="font-mono text-[12px]/none font-bold text-txt">×{row.cond.quantity}</span>
            <MhDropChance chance={row.cond.chance} rare={row.rare} />
          </div>
        )
      })}
    </div>
  )
}

export interface MhBreak {
  part: string
  impact: number
  effect: string
  unlocks?: MhRewardItem[]
}
export function MhBreakPanel({ breaks }: { breaks: MhBreak[] }) {
  return (
    <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
      {breaks.map((b, i) => (
        <div key={i} className="border border-solid border-line border-t-2 border-t-[color:var(--mh)] bg-panel px-[13px] py-3">
          <div className="mb-[7px] flex items-center justify-between gap-2">
            <span className="font-display text-[13px]/none font-bold uppercase not-italic tracking-[0.02em]">{b.part}</span>
            <span className="inline-flex gap-[3px]">
              {[1, 2, 3].map((n) => (
                <i key={n} className={cn("h-3 w-[6px] [transform:skewX(-12deg)]", n <= b.impact ? "bg-[color:var(--mh)]" : "bg-line-2")} />
              ))}
            </span>
          </div>
          <div className="font-body text-[12px]/[1.45] text-txt-muted">{b.effect}</div>
          {b.unlocks && b.unlocks.length > 0 && (
            <div className="mt-[9px] flex flex-wrap gap-[5px]">
              {b.unlocks.map((it) => (
                <span key={it.name} style={{ "--rc": `var(--rar${it.rarity})` } as React.CSSProperties} className="inline-flex items-center gap-1.5 border border-solid border-line bg-base-2 px-2 py-1 font-body text-[11px] text-txt">
                  <span className="h-[9px] w-[9px] flex-none rotate-45 border border-solid border-[color:var(--rc)] bg-[color:var(--rc)]" />
                  {it.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── strategy ──────────────────────────────────────────────────────────────────
export function MhStatBlock({ items }: { items: { icon?: IconName; label: string; value: React.ReactNode }[] }) {
  return (
    <div className="flex flex-col">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-[auto_1fr] items-baseline gap-3 border-b border-dashed border-line py-2 last:border-b-0">
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px]/[1.2] uppercase tracking-[0.04em] text-txt-dim">
            {it.icon && <Icon name={it.icon} size={12} />}
            {it.label}
          </span>
          <span className="text-right font-body text-[13px]/[1.3] font-semibold text-txt">{it.value}</span>
        </div>
      ))}
    </div>
  )
}

export function MhDangerCard({ danger }: { danger: { name: string; tell: string; counter: string } }) {
  return (
    <div className="border border-solid border-line border-l-[3px] border-l-[color:var(--bad)] bg-base-2 px-[13px] py-[11px]">
      <div className="mb-2 flex items-center gap-[7px] font-display text-[13px]/[1.2] font-bold uppercase not-italic tracking-[0.02em] text-[color:var(--bad)]">
        <Icon name="alert" size={13} />
        {danger.name}
      </div>
      <div className="mt-[5px] pl-0.5 font-body text-[12px]/[1.45] text-txt-muted">
        <span className="mr-[7px] inline-block font-mono text-[9px]/none font-bold uppercase tracking-[0.08em] text-txt-dim">Aviso</span>
        {danger.tell}
      </div>
      <div className="mt-[5px] pl-0.5 font-body text-[12px]/[1.45] text-txt">
        <span className="mr-[7px] inline-block font-mono text-[9px]/none font-bold uppercase tracking-[0.08em] text-[color:var(--mh-bright)]">Respuesta</span>
        {danger.counter}
      </div>
    </div>
  )
}

export function MhRelGear({ icon, name, meta, onClick }: { icon: IconName; name: string; meta?: string; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={!onClick} className="grid w-full grid-cols-[34px_1fr_auto] items-center gap-[11px] border border-solid border-line bg-base-2 px-[11px] py-[9px] text-left transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2 disabled:cursor-default">
      <span className="grid h-[34px] w-[34px] place-items-center border border-solid border-[color:var(--mh-line)] bg-[var(--mh-soft)] text-[color:var(--mh-bright)]">
        <Icon name={icon} size={15} />
      </span>
      <span className="min-w-0">
        <span className="block truncate font-body text-[13px]/[1.2] font-semibold">{name}</span>
        {meta && <span className="block truncate font-mono text-[10px]/[1.3] text-txt-dim">{meta}</span>}
      </span>
      {onClick && <Icon name="chevronRight" size={15} className="text-txt-dim" />}
    </button>
  )
}

// ── generic tabs + ailment + neutral tag ─────────────────────────────────────
export function MhTabs({ tabs, value, onChange }: { tabs: { id: string; label: string; icon?: IconName; count?: number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="flex gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cn("inline-flex items-center gap-[7px] whitespace-nowrap border-0 border-b-2 border-solid border-transparent bg-transparent px-[15px] py-[11px] font-mono text-[12px]/none font-bold uppercase tracking-[0.04em] transition-[color,border-color] duration-[140ms]", value === t.id ? "border-b-[color:var(--mh)] text-[color:var(--mh-bright)]" : "text-txt-muted hover:text-txt")}
        >
          {t.icon && <Icon name={t.icon} size={14} />}
          <span>{t.label}</span>
          {t.count != null && <span className={cn("border border-solid px-[5px] py-0.5 font-mono text-[10px]/none font-bold", value === t.id ? "border-[color:var(--mh-line)] text-[color:var(--mh-bright)]" : "border-line bg-panel text-txt-dim")}>{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

const AILMENTS: Record<string, { label: string; color: string }> = {
  fireblight: { label: "Quemadura", color: "#ff7a5c" },
  waterblight: { label: "Empapado", color: "#4f89e8" },
  thunderblight: { label: "Paralizante", color: "#e0c93c" },
  paralysis: { label: "Parálisis", color: "#ffd34d" },
  poison: { label: "Veneno", color: "#a855f7" },
}
export function MhAilmentTag({ id }: { id: string }) {
  const a = AILMENTS[id]
  if (!a) return null
  return (
    <span style={{ "--ac": a.color } as React.CSSProperties} className="inline-flex flex-wrap items-center gap-1.5 border border-solid border-line border-l-2 border-l-[color:var(--ac)] bg-base-2 px-[9px] py-[5px] font-body text-[11px]/[1.3] font-semibold">
      <span className="h-2 w-2 flex-none rounded-full bg-[color:var(--ac)]" />
      {a.label}
    </span>
  )
}

export function MhTag2({ icon, children, tone }: { icon?: IconName; children: React.ReactNode; tone?: "good" }) {
  return (
    <span className={cn("inline-flex items-center gap-[5px] border border-solid px-2 py-1 font-mono text-[11px]/none font-semibold", tone === "good" ? "border-[color:var(--mh-line)] bg-base-2 text-[color:var(--mh-bright)]" : "border-line bg-base-2 text-txt-muted")}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}
