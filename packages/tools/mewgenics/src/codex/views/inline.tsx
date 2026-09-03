"use client"

import { Icon, type IconName } from "@boffmedia/ui"
import { useToolT, MEWGENICS_NS } from "../../i18n"
import { MewKind, MewRarity, MewText, MewTile } from "../../MewAtoms"
import { select } from "../../mew-store"
import { mewClip, mewHuman } from "../../mew-util"
import { MewRef, type NavFn } from "../MewRefs"
import { getTargetMode, abilityRange } from "./ability-format"

// Compact embedded cards for 1:1 references — inline the target's key facts (with a
// click to open its full fiche) instead of a hover-only pill.

function MiniFlag({ icon, children }: { icon?: IconName; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper)] px-1.5 py-px text-[0.65625rem]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:7px_9px_8px_10px] [&_svg]:text-[color:var(--mwp-ink-soft)]">
      {icon && <Icon name={icon} size={10} />}
      {children}
    </span>
  )
}

// Flat layout (no box of its own) — the parent MewPanel is the single wrapper.
// A dashed top-divider only appears when several stack in one panel.
function InlineShell({ cat, id, rec, badges, facts, desc, onNav }: { cat: string; id: string; rec: { id: string; name: string }; badges?: React.ReactNode; facts?: React.ReactNode; desc?: string; onNav: NavFn }) {
  const clipped = mewClip(desc, 120)
  return (
    <div className="border-t border-dashed border-[color:var(--mwp-ink-line)] pt-3 first:border-t-0 first:pt-0">
      <button type="button" onClick={() => onNav(cat, id)} className="group flex w-full items-center gap-2.5 text-left">
        <MewTile cat={cat} rec={rec as never} size={42} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-1.5">
            <span className="text-[0.875rem]/[1.15] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] group-hover:text-[color:var(--mwp-red-deep)]">{rec.name}</span>
            {badges}
          </span>
          {clipped ? <MewText muted className="text-[0.78125rem]/[1.4]">{clipped}</MewText> : null}
        </span>
        <Icon name="arrow" size={13} className="flex-none text-[color:var(--mwp-ink-soft)] group-hover:text-[color:var(--mwp-red)]" />
      </button>
      {facts ? <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[0.71875rem]/[1.3] text-[color:var(--mwp-ink-soft)]">{facts}</div> : null}
    </div>
  )
}

function factLabel(label: string, value: React.ReactNode) {
  return (
    <span className="inline-flex items-baseline gap-1">
      <b className="font-sans text-[0.625rem] uppercase tracking-[0.05em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">{label}</b>
      <span className="font-bold text-[color:var(--mwp-ink)]">{value}</span>
    </span>
  )
}

/** Compact card for an ability referenced 1:1 (item «Uso», enemy attack, chain). */
export function MewAbilityInline({ id, onNav, label }: { id: string; onNav: NavFn; label?: string }) {
  const t = useToolT(MEWGENICS_NS)
  const TARGET_MODE = getTargetMode(t)
  const ab = select.get("abilities", id)
  if (!ab) return <MewRef id={id} cat="abilities" icon="bolt" onNav={onNav} label={label} />
  const cost = ab.cost || {}
  const tgt = ab.target || {}
  const dmg = ab.dmg || {}
  const range = abilityRange(tgt)
  const effNames = dmg.effects ? Object.keys(dmg.effects).map((k) => (select.effect(k)?.rec.name ?? mewHuman(k))) : []
  const facts = (
    <>
      {tgt.target_mode && factLabel(t("inline.targetAbbr"), TARGET_MODE[tgt.target_mode] || mewHuman(tgt.target_mode))}
      {range && factLabel(t("inline.rangeAbbr"), range)}
      {dmg.damage != null && factLabel(t("inline.damageAbbr"), String(dmg.damage))}
      {dmg.heal != null && factLabel(t("inline.healAbbr"), String(dmg.heal))}
      {effNames.length > 0 && factLabel(t("inline.appliesAbbr"), effNames.slice(0, 4).join(" · ") + (effNames.length > 4 ? " +" + (effNames.length - 4) : ""))}
    </>
  )
  const badges = (
    <>
      {cost.act_points != null && <MiniFlag icon="bolt">{cost.act_points} {t("data.statAbbr.pa")}</MiniFlag>}
      {cost.move_points ? <MiniFlag icon="compass">{cost.move_points} {t("data.statAbbr.pm")}</MiniFlag> : null}
    </>
  )
  const hasFacts = !!(tgt.target_mode || range || dmg.damage != null || dmg.heal != null || effNames.length)
  return <InlineShell cat="abilities" id={ab.id} rec={{ id: ab.id, name: label || ab.name }} badges={badges} facts={hasFacts ? facts : undefined} desc={ab.desc} onNav={onNav} />
}

/** Compact card for an item referenced 1:1 (class innate weapon). */
export function MewItemInline({ id, onNav }: { id: string; onNav: NavFn }) {
  const t = useToolT(MEWGENICS_NS)
  const it = select.get("items", id)
  if (!it) return <MewRef id={id} cat="items" icon="sword" onNav={onNav} />
  const passNames = it.passives ? Object.keys(it.passives).map((k) => (select.effect(k)?.rec.name ?? mewHuman(k))) : []
  const badges = (
    <>
      {it.kind && <MewKind kind={it.kind} />}
      {it.rarity && <MewRarity rarity={it.rarity} />}
    </>
  )
  const facts = (
    <>
      {it.shield != null && factLabel(t("inline.shieldAbbr"), String(it.shield))}
      {it.durability != null && factLabel(t("inline.durabilityAbbr"), String(it.durability))}
      {passNames.length > 0 && factLabel(t("inline.passivesAbbr"), passNames.slice(0, 4).join(" · ") + (passNames.length > 4 ? " +" + (passNames.length - 4) : ""))}
    </>
  )
  const hasFacts = it.shield != null || it.durability != null || passNames.length > 0
  return <InlineShell cat="items" id={it.id} rec={{ id: it.id, name: it.name }} badges={badges} facts={hasFacts ? facts : undefined} desc={it.desc} onNav={onNav} />
}
