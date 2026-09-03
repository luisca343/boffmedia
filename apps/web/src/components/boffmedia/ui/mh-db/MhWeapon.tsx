"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Icon } from "@boffmedia/ui"
import { MhRarity } from "@boffmedia/tools-mhwilds/ui/mh-kit"
import { MH_COATINGS, MH_ELDERSEAL, MH_NOTE_COLORS, MH_PHIALS, MH_SHARPNESS, sharpnessAt, topSharpColor, type MhWeapon } from "./mh-db-util"

// Armory (weapon-DB) pieces: weapon card (grid/list, compare-select), interactive
// sharpness + Handicraft explorer, type-specific extra data and the elderseal
// badge. Prefix mh- in mh-db.css. Prop-driven (mock data). [deferred]

function rarNc(rarity: number) {
  return { "--nc": `var(--rar${Math.max(1, Math.min(8, rarity))})` } as React.CSSProperties
}

function WeaponPick({ selected, onToggleSelect }: { selected?: boolean; onToggleSelect?: () => void }) {
  return (
    <span
      role="checkbox"
      aria-checked={selected}
      aria-label="Comparar"
      onClick={(e) => {
        e.stopPropagation()
        onToggleSelect && onToggleSelect()
      }}
      className={cn("grid h-5 w-5 flex-none place-items-center border border-solid", selected ? "border-[color:var(--mh)] bg-[var(--mh)] text-[#06120c]" : "border-line-2 bg-panel-2 text-transparent")}
    >
      <Icon name="check" size={12} />
    </span>
  )
}

export function MhWeaponCard({ weapon, active, onOpen, view, selectable, selected, onToggleSelect }: { weapon: MhWeapon; active?: boolean; onOpen?: () => void; view?: "grid" | "list"; selectable?: boolean; selected?: boolean; onToggleSelect?: () => void }) {
  const attack = weapon.attack
  const affinity = weapon.affinity || 0
  const el = weapon.special
  const sharpColor = weapon.sharpness ? topSharpColor(weapon.sharpness)?.color : null
  const sel = selectable ? <WeaponPick selected={selected} onToggleSelect={onToggleSelect} /> : null

  if (view === "list") {
    return (
      <button type="button" onClick={onOpen} style={rarNc(weapon.rarity)} className={cn("grid w-full grid-cols-[2rem_1fr_auto_auto_auto] items-center gap-2.5 border border-solid border-line border-l-[3px] border-l-[color:var(--nc)] bg-panel px-2.5 py-2 text-left transition-[border-color,background] duration-[140ms] hover:border-line-2 hover:bg-panel-2", active && "border-[color:var(--mh)] [box-shadow:inset_0_0_0_1px_var(--mh)]")}>
        <span className="grid h-8 w-8 place-items-center border border-solid border-line bg-panel-2 text-txt-muted">
          <Icon name={weapon.typeIcon} size={16} />
        </span>
        <span className="min-w-0">
          <span className="block font-display text-[0.8125rem]/[1.1] font-bold uppercase not-italic tracking-[0.01em]">{weapon.name}</span>
          <span className="block truncate font-mono text-[0.625rem]/[1.2] font-medium text-txt-dim">
            {weapon.typeLabel} · ATQ {attack}
            {affinity ? " · " + (affinity > 0 ? "+" : "") + affinity + "%" : ""}
          </span>
        </span>
        {el && <span className="h-2.5 w-2.5 rounded-full [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.3)]" style={{ background: el.color }} title={el.short} />}
        <MhRarity rarity={weapon.rarity} />
        {sel}
      </button>
    )
  }
  return (
    <button type="button" onClick={onOpen} style={rarNc(weapon.rarity)} className={cn("relative flex flex-col gap-1 border border-solid border-line border-t-2 border-t-[color:var(--nc)] bg-panel px-3 pb-3 pt-[0.6875rem] text-left transition-[border-color,transform,box-shadow] duration-[140ms] hover:-translate-y-[2px] hover:border-line-2 hover:[box-shadow:0_12px_26px_-16px_#000]", active && "border-[color:var(--mh)] [box-shadow:0_0_0_1px_var(--mh)]", selected && "border-[color:var(--mh-bright)]")}>
      <span className="flex items-center gap-[0.4375rem]">
        <span className="grid h-[1.625rem] w-[1.625rem] flex-none place-items-center border border-solid border-line bg-panel-2 text-txt-muted">
          <Icon name={weapon.typeIcon} size={15} />
        </span>
        <span className="mr-auto">
          <MhRarity rarity={weapon.rarity} />
        </span>
        {sel}
      </span>
      <span className="font-display text-[0.8125rem]/[1.15] font-bold uppercase not-italic tracking-[0.01em]">{weapon.name}</span>
      <span className="font-mono text-[0.625rem]/none font-medium text-txt-muted">{weapon.typeLabel}</span>
      <span className="mt-[0.3125rem] flex gap-3">
        <span>
          <b className="block font-display text-[1rem]/none font-extrabold italic">{attack}</b>
          <i className="font-mono text-[0.5rem]/none font-semibold uppercase not-italic tracking-[0.06em] text-txt-dim">ATQ</i>
        </span>
        <span>
          <b className="block font-display text-[1rem]/none font-extrabold italic" style={{ color: affinity > 0 ? "var(--ok)" : affinity < 0 ? "var(--bad)" : "var(--muted)" }}>
            {affinity > 0 ? "+" : ""}
            {affinity}%
          </b>
          <i className="font-mono text-[0.5rem]/none font-semibold uppercase not-italic tracking-[0.06em] text-txt-dim">afin</i>
        </span>
        {el ? (
          <span>
            <b className="block font-display text-[1rem]/none font-extrabold italic" style={{ color: el.color }}>
              {el.value}
            </b>
            <i className="font-mono text-[0.5rem]/none font-semibold uppercase not-italic tracking-[0.06em] text-txt-dim">{el.short}</i>
          </span>
        ) : (
          <span>
            <b className="block font-display text-[1rem]/none font-extrabold italic text-txt-dim">—</b>
            <i className="font-mono text-[0.5rem]/none font-semibold uppercase not-italic tracking-[0.06em] text-txt-dim">elem</i>
          </span>
        )}
      </span>
      {sharpColor && (
        <span className="absolute bottom-0 right-0 flex h-1 w-[2.125rem]">
          <i className="flex-1" style={{ background: sharpColor }} />
        </span>
      )}
    </button>
  )
}

export function MhSharpHandicraft({ weapon, defaultLevel }: { weapon: MhWeapon; defaultLevel?: number }) {
  const t = useTranslations("tools.mhwilds.db.weapon")
  const levels = weapon.handicraftLevels || 5
  const [lv, setLv] = React.useState(defaultLevel != null ? defaultLevel : 0)
  if (!weapon.sharpness) return <div className="inline-block border border-solid border-line bg-panel-2 px-2 py-1 font-mono text-[0.6875rem]/none text-txt-muted">{t("noSharpness")}</div>
  const arr = sharpnessAt(weapon, lv)
  const total = arr.reduce((a, n) => a + n, 0)
  const top = topSharpColor(arr)
  return (
    <div className="flex flex-col gap-[0.5625rem]">
      <div className="flex h-4 overflow-hidden border border-solid border-line bg-panel-2">
        {arr.map((v, i) => v > 0 && <span key={i} className="transition-[flex-grow] duration-[260ms]" style={{ flexGrow: v, background: MH_SHARPNESS[i].color }} />)}
      </div>
      <div className="flex items-center justify-between gap-2.5">
        <span className="inline-flex items-center gap-1.5 font-mono text-[0.75rem]/none font-bold" style={{ color: top ? top.color : "var(--muted)" }}>
          <i className="h-[0.5625rem] w-[0.5625rem]" style={{ background: top ? top.color : "var(--muted)" }} />
          {t("sharpnessValue", { value: total })}
        </span>
        <span className="font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.06em] text-txt-dim">{t("handicraftStatus", { level: lv })}</span>
      </div>
      <div className="flex gap-1" role="tablist" aria-label={t("handicraftLevel")}>
        {Array.from({ length: levels + 1 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setLv(i)}
            aria-label={t("handicraftAriaLevel", { level: i })}
            className={cn("h-[1.625rem] flex-1 border border-solid font-mono text-[0.6875rem]/none font-bold transition-[color,background,border-color] duration-[140ms]", i === lv ? "border-[color:var(--mh)] bg-[var(--mh)] text-[#06120c]" : i <= lv ? "border-[color:var(--mh-line)] bg-panel text-[color:var(--mh-bright)]" : "border-line bg-panel text-txt-dim hover:border-line-2 hover:text-txt")}
          >
            {i}
          </button>
        ))}
      </div>
    </div>
  )
}

function MhLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mb-2 font-mono text-[0.6875rem]/none font-semibold uppercase tracking-[0.06em] text-txt-dim", className)}>{children}</div>
}

export function MhWeaponExtra({ weapon }: { weapon: MhWeapon }) {
  const t = useTranslations("tools.mhwilds.db")
  const ex = weapon.extra
  if (!ex) return null
  if (ex.coatings) {
    return (
      <div>
        <MhLabel>Recubrimientos compatibles</MhLabel>
        <div className="flex flex-wrap gap-1.5">
          {ex.coatings.map((c) => {
            const m = MH_COATINGS[c] || { label: c, color: "var(--muted)" }
            return (
              <span key={c} style={{ "--cc": m.color } as React.CSSProperties} className="inline-flex items-center gap-1.5 border border-solid border-line bg-base-2 px-[0.5625rem] py-[0.3125rem] font-mono text-[0.6875rem]/none font-semibold text-txt">
                <i className="h-[0.5625rem] w-[0.5625rem] rounded-full bg-[color:var(--cc)]" />
                {m.label}
              </span>
            )
          })}
        </div>
      </div>
    )
  }
  if (ex.phial) {
    const m = MH_PHIALS[ex.phial]
    const label = m ? t(`vial.${m.labelKey}`) : ex.phial
    const icon = m ? m.icon : ("sparkles" as const)
    return (
      <div>
        <MhLabel>Vial</MhLabel>
        <div className="inline-flex items-center gap-[0.4375rem] border border-solid border-[color:var(--mh-line)] bg-[var(--mh-soft)] px-[0.6875rem] py-[0.4375rem] font-mono text-[0.75rem]/none font-semibold text-[color:var(--mh-bright)]">
          <Icon name={icon} size={14} />
          {label}
        </div>
      </div>
    )
  }
  if (ex.melody || ex.songs) {
    return (
      <div>
        {ex.melody && (
          <>
            <MhLabel>{t("weapon.melodyNotes")}</MhLabel>
            <div className="flex gap-[0.3125rem]">
              {ex.melody.map((n, i) => (
                <span key={i} title={n} className="h-[0.9375rem] w-[0.9375rem] rounded-full [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.35),0_1px_3px_rgba(0,0,0,0.4)]" style={{ background: MH_NOTE_COLORS[n] || "var(--muted)" }} />
              ))}
            </div>
          </>
        )}
        {ex.songs && (
          <>
            <MhLabel className="mt-3">Cantos</MhLabel>
            <div className="flex flex-col gap-1.5">
              {ex.songs.map((song, i) => (
                <div key={i} className="flex items-center gap-2.5 border border-solid border-line bg-panel px-2.5 py-[0.4375rem]">
                  <span className="inline-flex flex-none gap-[3px]">
                    {song.sequence.map((n, j) => (
                      <i key={j} className="h-[0.6875rem] w-[0.6875rem] rounded-full [box-shadow:inset_0_0_0_1px_rgba(0,0,0,0.35)]" style={{ background: MH_NOTE_COLORS[n] || "var(--muted)" }} />
                    ))}
                  </span>
                  <span className="font-body text-[0.75rem]/[1.2] font-semibold text-txt">{song.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    )
  }
  return null
}

export function MhElderseal({ value }: { value?: string }) {
  const t = useTranslations("tools.mhwilds.db.elderseal")
  if (!value) return null
  const key = MH_ELDERSEAL[value]
  const lbl = key ? t(key) : value
  return (
    <span className={cn("inline-flex items-center gap-[0.3125rem] border border-solid border-[color-mix(in_srgb,#b06bff_36%,transparent)] bg-[color-mix(in_srgb,#b06bff_12%,transparent)] px-2 py-1 font-mono text-[0.625rem]/none font-semibold uppercase tracking-[0.04em]", value === "high" ? "text-[#d08bff]" : "text-[#b06bff]")}>
      <Icon name="flame" size={11} />
      Sello ancestral · {lbl}
    </span>
  )
}
