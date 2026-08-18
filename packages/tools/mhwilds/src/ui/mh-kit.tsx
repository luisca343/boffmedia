"use client"

import React, { useEffect } from "react"
import { useToolT } from "../i18n"
import { Icon, IconButton, type IconName } from "@boffmedia/ui"
import {
  MH_VARS, rarClamp, rarVar, rarInk, elementColor, SK_COLOR, skillCategory,
  SHARP_ORDER, RES_ORDER,
} from "./mh-helpers"

// ── app chassis (full-bleed inside the host's box) ───────────────────────────
/**
 * A `layout: "document"` chassis (see `ToolManifest.layout`): it grows with its
 * content and the HOST scrolls it.
 *
 * The min-height fills the host's box without the package knowing anything
 * about the host's chrome. This used to be `calc(100dvh - var(--nav-h))`, and
 * `--nav-h` is defined in apps/web's globals.css ONLY — so in the launcher the
 * whole declaration was invalid and silently dropped. Same host coupling the
 * schematic tools already removed; the rule for every future tool package is
 * that viewport math belongs to the host, never to the package.
 *
 * `100%` is the fallback rather than `100dvh` because a host that gives its
 * tools a definite box is the common case, and a bare `min-h-full` would not
 * do: on the web the ancestor chain has no definite height, so `100%` resolves
 * to `auto` and the chassis would quietly collapse to its content.
 */
export function MhApp({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      style={MH_VARS}
      className={`flex flex-col min-w-0 min-h-[var(--tool-vh,100%)] bg-base text-txt relative ${className}`}
    >
      {children}
    </div>
  )
}

export function MhBody({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex-1 min-h-0 ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function MhWrap({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-[clamp(16px,2.4vw,36px)] pt-5 pb-16 ${className}`}>{children}</div>
}

// ── top toolbar ──────────────────────────────────────────────────────────────
/**
 * `--tool-sticky-top` is the ONE thing a document-layout tool needs from its
 * host: how far below the scroll container's top edge its chrome must stick.
 *
 * It is not the same number as the host's total chrome height, which is why
 * this cannot reuse `--nav-h`. On the web the scroller IS the document and the
 * Navbar overlays its top, so the bar must clear it. In the launcher the
 * scroller starts *below* all the chrome, so the correct offset is 0 — and 0 is
 * the fallback, meaning a host that defines nothing still gets a usable tool.
 */
export function MhBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 flex-wrap flex-none px-[clamp(16px,2.4vw,36px)] py-[11px] border-b border-line bg-base sticky top-[var(--tool-sticky-top,0px)] z-30 min-h-[58px]">
      {children}
    </div>
  )
}

export function MhSeal({ name }: { name: IconName }) {
  return (
    <span className="w-[34px] h-[34px] flex-none grid place-items-center bg-[var(--mh-soft)] text-[var(--mh-bright)] border border-[var(--mh-line)] cut cut-edge-slant [--cut:9px] [--cut-line:var(--mh-line)]">
      <Icon name={name} size={18} />
    </span>
  )
}

export function MhBarSide({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 flex-wrap ml-auto">{children}</div>
}

// data-source pill
export function MhSrc({ label, className = "" }: { label: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] leading-none uppercase tracking-[0.08em] text-txt-muted px-2 py-[5px] border border-line bg-panel ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[var(--mh-bright)] shadow-[0_0_0_3px_var(--mh-soft)]" />
      {label}
    </span>
  )
}

// mode switch (emerald-scoped, distinct from the orange Seg)
export function MhModes({ options, value, onChange }: { options: { value: string; label: React.ReactNode }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-0.5 bg-panel border border-line p-[3px]" role="tablist">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`appearance-none border-0 cursor-pointer font-mono text-[12px] leading-none tracking-[0.04em] uppercase font-semibold py-2 px-[13px] inline-flex items-center gap-1.5 transition-colors ${on ? "bg-[var(--mh-soft)] text-[var(--mh-bright)]" : "bg-transparent text-txt-muted hover:text-txt"}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ── panel ─────────────────────────────────────────────────────────────────────
export function MhPanel({
  title, icon, count, aside, children, className = "",
}: {
  title?: React.ReactNode; icon?: IconName; count?: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <section className={`bg-panel border border-line cut-corner cut-corner-edge ${className}`}>
      {(title || aside) && (
        <div className="flex items-center gap-2.5 px-[15px] pt-3 pb-[11px] border-b border-line">
          {icon && <Icon name={icon} size={15} className="text-[var(--mh-bright)]" />}
          {title && <h3 className="font-mono text-[13px] leading-none font-bold uppercase tracking-[0.08em] text-txt-muted m-0 not-italic">{title}</h3>}
          <span className="flex-1" />
          {count != null && <span className="font-mono text-[11px] leading-none text-txt-dim tracking-[0.04em]">{count}</span>}
          {aside}
        </div>
      )}
      <div className="px-[15px] py-3.5">{children}</div>
    </section>
  )
}

export function MhLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`font-mono text-[10px] leading-none uppercase tracking-[0.08em] text-txt-dim mb-[7px] ${className}`}>{children}</div>
}

// ── rarity chip ───────────────────────────────────────────────────────────────
export function MhRarity({ rarity, long }: { rarity?: number; long?: boolean }) {
  return (
    <span
      className="font-mono text-[10px] leading-none font-bold tracking-[0.04em] px-1.5 py-1 flex-none"
      style={{ background: rarVar(rarity), color: rarInk(rarity) }}
    >
      {long ? `R${rarClamp(rarity)}` : `R${rarClamp(rarity)}`}
    </span>
  )
}

// ── element / status chip ─────────────────────────────────────────────────────
export function MhElement({ type, value, hidden, label }: { type: string; value: number; hidden?: boolean; label: string }) {
  const t = useToolT("tools.mhwilds.ui")
  return (
    <span className={`inline-flex items-center gap-[7px] px-2.5 py-1.5 bg-base-2 border border-line font-mono text-[12px] leading-none ${hidden ? "opacity-60" : ""}`} title={label}>
      <span className="w-[9px] h-[9px] rounded-full" style={{ background: elementColor(type) }} />
      <span>{label} {value}{hidden ? ` ${t("hidden")}` : ""}</span>
    </span>
  )
}

// ── stat trio ─────────────────────────────────────────────────────────────────
export function MhStat3({ items }: { items: { value: React.ReactNode; label: string; mod?: "attack" | "def"; color?: string }[] }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it, i) => (
        <div key={i} className="py-[11px] px-2.5 bg-base-2 border border-line text-center">
          <b
            className="block font-display text-[24px] leading-none italic font-extrabold"
            style={{ color: it.color || (it.mod === "attack" ? "#ff7a5c" : it.mod === "def" ? "var(--info)" : "var(--text)") }}
          >
            {it.value}
          </b>
          <span className="font-mono text-[10px] leading-none uppercase tracking-[0.05em] text-txt-dim mt-1 block">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

// ── resistances row ───────────────────────────────────────────────────────────
export function MhResistances({ res, labelFor }: { res: Record<string, number>; labelFor: (k: string) => string }) {
  return (
    <div className="grid grid-cols-5 gap-[5px]">
      {RES_ORDER.map((rk) => {
        const v = res[rk] || 0
        const tone = v > 0 ? "text-ok" : v < 0 ? "text-bad" : "text-txt-muted"
        return (
          <div key={rk} className="text-center py-[7px] px-0.5 bg-base-2 border border-line">
            <div className="w-2.5 h-2.5 rounded-full mx-auto mb-[5px]" style={{ background: elementColor(rk) }} />
            <div className={`font-mono text-[14px] leading-none font-bold ${tone}`}>{v > 0 ? "+" : ""}{v}</div>
            <div className="font-mono text-[9px] leading-none uppercase text-txt-dim mt-[3px]">{labelFor(rk).slice(0, 3)}</div>
          </div>
        )
      })}
    </div>
  )
}

// ── sharpness bar (object form: {red,orange,…}) ──────────────────────────────
export function MhSharpness({ sharpness, legend }: { sharpness: Record<string, number>; legend?: string }) {
  const total = SHARP_ORDER.reduce((a, s) => a + (sharpness[s.key] || 0), 0) || 1
  return (
    <div>
      <div className="flex h-[15px] bg-base-deep border border-line overflow-hidden">
        {SHARP_ORDER.map((s) => {
          const v = sharpness[s.key] || 0
          if (v <= 0) return null
          return <div key={s.key} style={{ width: `${(v / total) * 100}%`, background: s.color }} />
        })}
      </div>
      {legend && <div className="mt-1.5 font-mono text-[10px] leading-none text-txt-dim">{legend}</div>}
    </div>
  )
}

// ── skill row (pips + level, category-tinted) ────────────────────────────────
export function MhSkillRow({
  name, level, maxLevel, kind, desc,
}: { name: string; level: number; maxLevel: number; kind?: string; desc?: string }) {
  const capped = Math.min(level, maxLevel)
  const over = Math.max(0, level - maxLevel)
  const sk = SK_COLOR[skillCategory(kind)]
  return (
    <div
      className={`grid grid-cols-[1fr_auto] items-center gap-2.5 py-2 px-[11px] bg-base-2 border border-line transition-colors ${over ? "border-l-2 border-l-warn" : "border-l-2"}`}
      style={over ? undefined : ({ borderLeftColor: sk } as React.CSSProperties)}
      title={desc}
    >
      <div className="min-w-0">
        <div className="font-body text-[13px] leading-tight font-semibold truncate">{name}</div>
        {desc && <div className="font-mono text-[11px] leading-tight text-txt-dim mt-0.5 truncate">{desc}</div>}
      </div>
      <div className="flex items-center gap-[3px]">
        {Array.from({ length: Math.max(maxLevel, 1) }).map((_, i) => (
          <span
            key={i}
            className="w-2 h-3.5 -skew-x-12"
            style={{ background: i < capped ? sk : "var(--line-2)" }}
          />
        ))}
        {over > 0 && <span className="font-mono text-[11px] leading-none font-bold text-warn ml-1">+{over}</span>}
      </div>
    </div>
  )
}

export function MhCatLegend({ labels }: { labels: Record<string, string> }) {
  const cats: (keyof typeof SK_COLOR)[] = ["attack", "element", "defense", "utility"]
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {cats.map((c) => (
        <span key={c} className="inline-flex items-center gap-1.5 font-mono text-[10px] leading-none uppercase tracking-[0.04em] text-txt-muted">
          <i className="w-2 h-2" style={{ background: SK_COLOR[c] }} />
          {labels[c]}
        </span>
      ))}
    </div>
  )
}

// ── equipment slot (loadout) ─────────────────────────────────────────────────
export function MhSlot({
  icon, kind, name, rarity, filled, active, onOpen,
}: { icon: IconName; kind: string; name: string; rarity?: number; filled: boolean; active: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative grid grid-cols-[44px_1fr_auto] items-center gap-3 w-full text-left py-[11px] px-[13px] bg-panel border cursor-pointer transition-colors hover:bg-panel-2 ${active ? "border-[var(--mh)] shadow-[0_0_0_1px_var(--mh)]" : "border-line hover:border-line-2"}`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] bg-[var(--mh)] transition-opacity ${filled ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`} />
      <span className={`w-11 h-11 grid place-items-center flex-none border ${filled ? "text-[var(--mh-bright)] border-[var(--mh-line)] bg-[var(--mh-soft)]" : "text-txt-dim border-line bg-panel-2"}`}>
        <Icon name={icon} size={20} />
      </span>
      <span className="min-w-0 flex flex-col gap-0.5">
        <span className="font-mono text-[10px] leading-none uppercase tracking-[0.08em] text-txt-dim">{kind}</span>
        <span className={`font-body text-[14px] leading-tight truncate ${filled ? "text-txt font-semibold" : "text-txt-dim italic font-medium"}`}>{name}</span>
      </span>
      <span className="flex items-center gap-2 flex-none">
        {filled && rarity != null && <MhRarity rarity={rarity} />}
        <Icon name="chevronRight" size={16} className="text-txt-dim" />
      </span>
    </button>
  )
}

// ── decoration socket ────────────────────────────────────────────────────────
export function MhDecoSocket({
  size, decoName, decoSlot, onOpen, onClear,
}: { size: number; decoName?: string | null; decoSlot?: number; onOpen: () => void; onClear?: () => void }) {
  const t = useToolT("tools.mhwilds.ui")
  const filled = !!decoName
  return (
    <div className={`grid grid-cols-[22px_1fr_auto] items-center gap-[9px] w-full py-[7px] px-2.5 bg-base-2 border border-line border-l-2 transition-colors hover:bg-panel ${filled ? "border-l-[var(--mh)]" : "border-l-line-2 hover:border-l-[var(--mh)]"}`}>
      <button type="button" onClick={onOpen} aria-label={t("slotLevel", { size })} className="w-[22px] h-[22px] grid place-items-center flex-none font-mono text-[11px] leading-none font-bold text-[var(--mh-bright)] border border-[var(--mh-line)] rotate-45">
        <span className="-rotate-45">{filled ? decoSlot : size}</span>
      </button>
      <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left bg-transparent border-0 p-0 cursor-pointer">
        <span className={`block font-body text-[12px] leading-tight truncate ${filled ? "text-txt" : "text-txt-dim italic"}`}>
          {filled ? decoName : t("emptySlot", { size })}
        </span>
      </button>
      {filled && onClear && (
        <button type="button" onClick={onClear} aria-label={t("removeJewel")} className="text-txt-dim grid place-items-center hover:text-bad">
          <Icon name="x" size={13} />
        </button>
      )}
    </div>
  )
}

// slot pips (weapon/armor decoration slots)
export function MhSlotPips({ slots }: { slots?: number[] }) {
  const active = (slots || []).filter((s) => s > 0)
  if (!active.length) return null
  return (
    <span className="inline-flex gap-[3px] mt-1">
      {active.map((s, i) => (
        <span key={i} className="w-3.5 h-3.5 inline-grid place-items-center font-mono text-[8px] leading-none font-bold text-[var(--mh-bright)] border border-[var(--mh-line)] rotate-45">
          <span className="-rotate-45">{s}</span>
        </span>
      ))}
    </span>
  )
}

// ── material row (+ optional owned toggle) ───────────────────────────────────
export function MhMaterial({
  name, rarity, quantity, owned, onToggle,
}: { name: string; rarity?: number; quantity: number; owned?: boolean; onToggle?: () => void }) {
  const t = useToolT("tools.mhwilds.ui")
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 py-2 px-[11px] bg-base-2 border border-line">
      <span className="w-3 h-3 flex-none rotate-45 border" style={{ borderColor: rarVar(rarity), background: rarClamp(rarity) >= 7 ? rarVar(rarity) : "transparent" }} />
      <span className="min-w-0">
        <span className="font-body text-[13px] leading-tight truncate">{name}</span>{" "}
        <span className="font-mono text-[10px] leading-none text-txt-dim">R{rarClamp(rarity)}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-[13px] leading-none font-bold text-txt">×{quantity}</span>
        {onToggle && (
          <button type="button" onClick={onToggle} aria-label={t("markObtained")} className={`w-5 h-5 grid place-items-center border cursor-pointer ${owned ? "bg-[var(--mh-soft)] border-[var(--mh)] text-[var(--mh-bright)]" : "border-line-2 text-txt-dim"}`}>
            <Icon name="check" size={12} />
          </button>
        )}
      </span>
    </div>
  )
}

// ── equipment selector row (drawer) ──────────────────────────────────────────
export interface MhEquipItemData {
  name: string
  rarity?: number
  skills?: { name: string; level: number }[]
  attack?: number
  affinity?: number
  defense?: number
  slots?: number[]
}
export function MhEquipItem({
  item, kind, active, onPick,
}: { item: MhEquipItemData; kind: "weapon" | "armor" | "charm"; active?: boolean; onPick: () => void }) {
  const t = useToolT("tools.mhwilds.ui")
  const skills = (item.skills || []).map((s) => `${s.name} ${s.level}`)
  const stat =
    kind === "weapon" ? (
      <><b className="text-txt">{t("atk")} {item.attack}</b><br />{(item.affinity ?? 0) >= 0 ? "+" : ""}{item.affinity}% {t("affinity")}</>
    ) : kind === "charm" ? (
      <b className="text-txt">{t("rarity")} {rarClamp(item.rarity)}</b>
    ) : (
      <b className="text-txt">{t("def")} {item.defense}</b>
    )
  return (
    <button
      type="button"
      onClick={onPick}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-[11px] w-full text-left py-[11px] px-3 bg-base-2 border cursor-pointer transition-colors hover:bg-panel-2 hover:border-line-2 ${active ? "border-[var(--mh)] shadow-[inset_0_0_0_1px_var(--mh)]" : "border-line"}`}
    >
      <MhRarity rarity={item.rarity} />
      <span className="min-w-0">
        <span className="block font-body text-[14px] leading-[1.2] font-semibold truncate">{item.name}</span>
        {skills.length > 0 && (
          <span className="mt-[5px] flex flex-wrap gap-1">
            {skills.map((s) => <MhTag key={s} sk>{s}</MhTag>)}
          </span>
        )}
      </span>
      <span className="flex-none whitespace-nowrap text-right font-mono text-[12px] leading-[1.4] font-semibold text-txt-muted">
        {stat}
        {item.slots && item.slots.some((x) => x > 0) && <MhSlotPips slots={item.slots} />}
      </span>
    </button>
  )
}

// ── set bonus row ─────────────────────────────────────────────────────────────
export interface MhSetBonusData {
  bonusName: string
  pieces: number
  activeAt?: number | null
  nextAt?: number
  skill?: { name: string } | null
}
export function MhSetBonus({ bonus }: { bonus: MhSetBonusData }) {
  const t = useToolT("tools.mhwilds.ui")
  const active = bonus.activeAt != null
  return (
    <div className={`py-[9px] px-[11px] bg-base-2 border border-line ${active ? "" : "opacity-50"}`}>
      <div className="flex items-center gap-2">
        <span className="font-display text-[12px] leading-none font-bold uppercase tracking-[0.03em]">{bonus.bonusName}</span>
        <span className="ml-auto inline-flex gap-[3px]">
          {[1, 2, 3, 4, 5].map((n) => (
            <i key={n} className="w-[7px] h-[7px] rounded-full" style={{ background: n <= bonus.pieces ? "var(--mh)" : "var(--line-2)" }} />
          ))}
        </span>
      </div>
      <div className={`mt-[5px] font-mono text-[11px] leading-[1.3] ${active ? "text-[var(--mh-bright)]" : "text-txt-dim"}`}>
        {active ? (
          <><Icon name="check" size={11} className="align-[-1px]" /> {bonus.skill ? bonus.skill.name : bonus.bonusName} · {bonus.activeAt} {t("pieces")}</>
        ) : (
          <>{t("requires")} {bonus.nextAt} {t("piecesN")} ({bonus.pieces}/{bonus.nextAt})</>
        )}
      </div>
    </div>
  )
}

// ── skeleton loadout (loading state) ─────────────────────────────────────────
export function MhSkeletonSlots({ n = 6 }: { n?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className="h-[66px] border border-line bg-[linear-gradient(100deg,var(--panel)_30%,var(--panel-2)_50%,var(--panel)_70%)] bg-[length:220%_100%] animate-[mh-shimmer_1.3s_linear_infinite] motion-reduce:animate-none"
        />
      ))}
    </div>
  )
}

// ── meter ─────────────────────────────────────────────────────────────────────
export function MhMeter({ pct, className = "" }: { pct: number; className?: string }) {
  return (
    <span className={`block h-1.5 bg-line overflow-hidden ${className}`}>
      <i className="block h-full bg-[var(--mh)] transition-[width] duration-[260ms]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </span>
  )
}

// ── progress ring ─────────────────────────────────────────────────────────────
export function MhRing({ pct, label }: { pct: number; label: React.ReactNode }) {
  return (
    <div
      className="w-[42px] h-[42px] rounded-full flex-none grid place-items-center relative"
      style={{ background: `conic-gradient(var(--mh) ${pct}%, var(--line) 0)` }}
    >
      <span className="w-8 h-8 rounded-full bg-panel absolute" />
      <span className="relative font-mono text-[11px] leading-none font-bold text-txt z-[1]">{label}</span>
    </div>
  )
}

// ── search input (in the system chassis) ─────────────────────────────────────
export function MhSearch({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const t = useToolT("tools.mhwilds.ui")
  return (
    <div className="flex-1 min-w-0 inline-flex items-center gap-2.5 bg-panel border border-line px-3 h-[42px]">
      <Icon name="search" size={16} className="text-txt-dim flex-none" />
      <input
        className="flex-1 min-w-0 bg-transparent border-0 outline-none text-txt font-body text-[14px] placeholder:text-txt-dim"
        placeholder={placeholder || t("search")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label={t("clear")} className="text-txt-dim hover:text-txt flex-none">
          <Icon name="x" size={14} />
        </button>
      )}
    </div>
  )
}

// ── type chip (tree type rail / drawer filters) ──────────────────────────────
export function MhTypeChip({
  icon, label, count, on, disabled, onClick,
}: { icon?: IconName; label: React.ReactNode; count?: React.ReactNode; on?: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-[7px] py-2 px-3 bg-panel border font-mono text-[12px] leading-none tracking-[0.02em] transition-colors ${disabled ? "opacity-45 cursor-not-allowed border-line text-txt-muted" : on ? "text-[var(--mh-bright)] border-[var(--mh-line)] bg-[var(--mh-soft)] cursor-pointer" : "text-txt-muted border-line hover:text-txt hover:border-line-2 cursor-pointer"}`}
    >
      {icon && <Icon name={icon} size={14} />}
      {label}
      {count != null && <span className={`font-mono text-[10px] leading-none ${on ? "text-[var(--mh-bright)]" : "text-txt-dim"}`}>{count}</span>}
    </button>
  )
}

// ── item row (drawer selector) ───────────────────────────────────────────────
export function MhItem({
  active, onPick, children,
}: { active?: boolean; onPick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`grid grid-cols-[auto_1fr_auto] items-center gap-[11px] w-full text-left py-[11px] px-3 bg-base-2 border cursor-pointer transition-colors hover:bg-panel-2 ${active ? "border-[var(--mh)] shadow-[inset_0_0_0_1px_var(--mh)]" : "border-line hover:border-line-2"}`}
    >
      {children}
    </button>
  )
}

export function MhTag({ children, sk }: { children: React.ReactNode; sk?: boolean }) {
  return (
    <span className={`font-mono text-[10px] leading-none px-1.5 py-[3px] tracking-[0.02em] border ${sk ? "text-[var(--mh-bright)] border-[var(--mh-line)] bg-panel" : "text-txt-muted border-line bg-panel"}`}>
      {children}
    </span>
  )
}

// ── weapon tree node (positioned by the tree via style) ──────────────────────
export function MhNodeCard({
  name, rarity, attack, special, style, selected, dim, owned, isFinal, finalLabel, onSelect,
}: {
  name: string; rarity?: number; attack: number
  special: { type: string; value: number } | null
  style: React.CSSProperties; selected: boolean; dim: boolean; owned: boolean; isFinal: boolean; finalLabel: string; onSelect: () => void
}) {
  return (
    <button
      type="button"
      data-node
      onClick={onSelect}
      style={{ ...style, borderLeftColor: rarVar(rarity) }}
      className={`absolute box-border bg-panel border border-line border-l-[3px] py-[9px] px-[11px] text-left cursor-pointer transition-[border-color,box-shadow,transform,opacity] hover:-translate-y-0.5 hover:border-line-2 hover:[--cut-line:var(--line-2)] cut cut-edge-slant [--cut:9px] ${selected ? "!border-[var(--mh)] [--cut-line:var(--line)] shadow-[0_0_0_1px_var(--mh),0_12px_30px_-14px_#000]" : ""} ${dim ? "opacity-[0.34]" : ""}`}
    >
      {owned && <span className="absolute top-2 right-[9px] w-[7px] h-[7px] rounded-full bg-[var(--mh)] shadow-[0_0_0_3px_var(--mh-soft)]" />}
      <span className="flex items-center gap-[7px] mb-1.5">
        <MhRarity rarity={rarity} />
        <span className="font-body text-[13px] leading-[1.15] font-semibold truncate">{name}</span>
      </span>
      <span className="flex flex-wrap gap-x-2.5 gap-y-1">
        <span className="inline-flex items-center gap-1 font-mono text-[11px] leading-none text-txt-muted"><Icon name="sword" size={11} /><b className="text-txt">{attack}</b></span>
        {special && (
          <span className="inline-flex items-center gap-1 font-mono text-[11px] leading-none" style={{ color: elementColor(special.type) }}>
            <span className="w-[7px] h-[7px] rounded-full inline-block" style={{ background: elementColor(special.type) }} />{special.value}
          </span>
        )}
      </span>
      {isFinal && (
        <span className="absolute -bottom-px -right-px font-mono text-[8px] leading-none font-bold tracking-[0.06em] uppercase text-[var(--mh-bright)] bg-[var(--mh-soft)] border border-[var(--mh-line)] py-[3px] px-[5px]">{finalLabel}</span>
      )}
    </button>
  )
}

// ── drawer (selector / detail) ───────────────────────────────────────────────
export function MhDrawer({
  icon, iconName, title, sub, onClose, tools, children,
}: {
  icon?: React.ReactNode; iconName?: IconName; title: React.ReactNode; sub?: React.ReactNode; onClose: () => void; tools?: React.ReactNode; children: React.ReactNode
}) {
  const t = useToolT("tools.mhwilds.ui")
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", esc)
    return () => document.removeEventListener("keydown", esc)
  }, [onClose])
  return (
    <>
      <div className="absolute inset-0 bg-scrim z-[74] animate-[bm-fade_140ms_ease-out] motion-reduce:animate-none" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute top-0 right-0 bottom-0 w-[min(460px,96vw)] z-[75] bg-panel border-l border-line-2 shadow-[var(--shadow)] flex flex-col animate-[bm-drawer-in_260ms_ease-out] motion-reduce:animate-none"
      >
        <div className="flex items-center gap-[11px] flex-none py-[13px] px-4 border-b border-line">
          {(iconName || icon) && (
            <span className="w-9 h-9 grid place-items-center flex-none text-[var(--mh-bright)] border border-[var(--mh-line)] bg-[var(--mh-soft)]">
              {icon || <Icon name={iconName!} size={18} />}
            </span>
          )}
          <div className="min-w-0">
            <div className="font-display text-[16px] leading-[1.1] font-bold uppercase tracking-[0.03em] not-italic">{title}</div>
            {sub && <div className="font-mono text-[11px] leading-none text-txt-muted mt-0.5">{sub}</div>}
          </div>
          <IconButton name="x" label={t("close")} className="ml-auto" onClick={onClose} />
        </div>
        {tools && <div className="flex-none py-3 px-4 border-b border-line flex flex-col gap-2.5">{tools}</div>}
        <div className="flex-1 overflow-y-auto py-3 px-4 pb-10">{children}</div>
      </aside>
    </>
  )
}
