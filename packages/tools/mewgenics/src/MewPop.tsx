"use client"

import * as React from "react"
import { useToolT, MEWGENICS_NS } from "./i18n"
import { cn } from '@boffmedia/ui'
import { Icon, type IconName } from "@boffmedia/ui"
import { mewCursor } from "./mew-art"
import { MewFaction, MewKind, MewRarity, MewStats, MewText, MewTile } from "./MewAtoms"
import { MEW, MEW_KIND_LABEL, mewBodyPartLabel, mewCatKey, mewClip, mewFactionLabel, mewHueFor, mewHuman, mewRarityLabel, mewStatModLabel, type MewRec } from "./mew-util"

// Mewgenics roster card (CxCard) + the hover popover card. Prefix cx- / mew-pop-.

export function CxCard({ cat, rec, active, onOpen, view, cursorEnabled, playSound }: { cat: string; rec: MewRec; active?: boolean; onOpen?: () => void; view?: "grid" | "list"; cursorEnabled?: boolean; playSound?: (key: string) => void }) {
  const t = useToolT(MEWGENICS_NS)
  const inspectCursorData = React.useMemo(() => (cursorEnabled ? mewCursor("inspect") : null), [cursorEnabled])
  const [isHovering, setIsHovering] = React.useState(false)

  const handleHoverEnter = () => {
    setIsHovering(true)
    playSound?.("hover")
  }
  const meta =
    cat === "items" ? (
      <>
        {rec.kind && <MewKind kind={rec.kind} />}
        {rec.rarity && <MewRarity rarity={rec.rarity} />}
      </>
    ) : cat === "characters" ? (
      <>
        {rec.faction && <MewFaction faction={rec.faction} />}
        {rec.hp != null && (
          <span className="inline-flex items-center gap-[3px] font-mono text-[10px]/none font-bold text-[color:var(--mwp-bad)]">
            <Icon name="heart" size={11} />
            {rec.hp}
          </span>
        )}
      </>
    ) : cat === "abilities" ? (
      <>
        {rec.cls && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="star" size={10} className="text-[color:var(--mwp-ink-soft)]" />{mewHuman(rec.cls)}</span>}
        {rec.cost?.act_points != null && <span className="inline-flex items-center gap-1 border-2 border-solid border-[color-mix(in_srgb,var(--mwp-warn)_45%,transparent)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-warn)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="bolt" size={10} />{rec.cost.act_points} {t("data.statAbbr.pa")}</span>}
        {rec.cost?.move_points != null && <span className="inline-flex items-center gap-1 border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="compass" size={10} />{rec.cost.move_points} {t("data.statAbbr.pm")}</span>}
      </>
    ) : cat === "passives" ? (
      <>
        {rec.cls ? <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="star" size={10} className="text-[color:var(--mwp-ink-soft)]" />{mewHuman(rec.cls)}</span> : <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="shield" size={10} className="text-[color:var(--mwp-ink-soft)]" />{t("label.general")}</span>}
      </>
    ) : cat === "keywords" ? (
      <>
        <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color-mix(in_srgb,var(--mwp-warn)_45%,transparent)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-warn)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="flame" size={10} />{t("label.statusBadge")}</span>
      </>
    ) : cat === "events" ? (
      <>
        {rec.subject && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="compass" size={10} className="text-[color:var(--mwp-ink-soft)]" />{rec.subject}</span>}
      </>
    ) : cat === "classes" ? (
      <>
        {rec.weapon && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="sword" size={10} className="text-[color:var(--mwp-ink-soft)]" />{mewHuman(rec.weapon)}</span>}
        {!rec.weapon && rec.abilities && Array.isArray(rec.abilities) && rec.abilities.length > 0 && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="bolt" size={10} className="text-[color:var(--mwp-ink-soft)]" />{rec.abilities.length}</span>}
      </>
    ) : cat === "maps" ? (
      <>
        {rec.act != null && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="map" size={10} className="text-[color:var(--mwp-ink-soft)]" />{t("label.act")} {rec.act} {rec.tileset && `· ${rec.tileset}`}</span>}
      </>
    ) : cat === "furniture" ? (
      <>
        {rec.stats && Object.entries(rec.stats).length > 0 && (
          <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="home" size={10} className="text-[color:var(--mwp-ink-soft)]" />{["comfort", "appeal", "stimulation", "evolution", "health"].includes(Object.keys(rec.stats)[0]) ? t(`label.${Object.keys(rec.stats)[0]}`) : mewHuman(Object.keys(rec.stats)[0])}</span>
        )}
        {rec.special && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color-mix(in_srgb,var(--mwp-good)_45%,transparent)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-good)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="star" size={10} />{t("label.special")}</span>}
        {rec.removed && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color-mix(in_srgb,var(--mwp-bad)_45%,transparent)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-bad)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="trash" size={10} />{t("label.removed")}</span>}
      </>
    ) : cat === "mutations" ? (
      <>
        {rec.body_part && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="sparkles" size={10} className="text-[color:var(--mwp-ink-soft)]" />{mewBodyPartLabel(t, String(rec.body_part))}</span>}
      </>
    ) : cat === "sets" ? (
      <>
        {rec.pieces_required != null && <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="layers" size={10} className="text-[color:var(--mwp-ink-soft)]" />{rec.pieces_required}</span>}
      </>
    ) : cat === "story_cats" ? (
      <>
        <span className="inline-flex items-center gap-[5px] border-2 border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2.5 pb-1 pt-[5px] text-[11px]/none font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]"><Icon name="book" size={10} className="text-[color:var(--mwp-ink-soft)]" />{t("label.storyCat")}</span>
      </>
    ) : null
  // w-full: a <button> is shrink-to-fit even as a grid container, so without it
  // short-named cards render narrower than their track and their badges spill out.
  const base = "relative w-full cursor-pointer border-2 border-solid bg-[color:var(--mwp-paper)] text-left text-[color:var(--mwp-ink)] transition-[transform,box-shadow,border-color] duration-[160ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0"
  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseEnter={handleHoverEnter}
      onMouseLeave={() => setIsHovering(false)}
      data-cxid={rec.id}
      style={{
        "--h": mewHueFor(cat, rec),
        ...(isHovering && inspectCursorData ? { cursor: `url(${inspectCursorData.src}) ${inspectCursorData.hotspot[0]} ${inspectCursorData.hotspot[1]}, auto` } : {})
      } as React.CSSProperties}
      className={cn(
        base,
        active ? "border-[hsl(var(--h)_70%_34%)] [box-shadow:inset_0_0_0_3px_hsl(var(--h)_62%_62%/0.65),0_4px_0_var(--mwp-shadow-lg)] active:translate-y-0.5 active:[box-shadow:inset_0_0_0_3px_hsl(var(--h)_62%_62%/0.65),0_2px_0_var(--mwp-shadow-md)]" : "border-[color:var(--mwp-ink)] [box-shadow:0_3px_0_var(--mwp-shadow-lg)] hover:-translate-y-[3px] hover:[box-shadow:0_7px_0_var(--mwp-shadow-lg)] active:translate-y-0.5 active:[box-shadow:0_1px_0_var(--mwp-shadow-sm)]",
        view === "list" ? "grid grid-cols-[40px_1fr_auto] items-center gap-2.5 px-[11px] py-2.5 h-[64px] [border-radius:var(--wob-sm)]" : "grid grid-rows-[68px_1fr_26px] gap-2 h-full px-[11px] pb-2.5 pt-[13px] [border-radius:var(--wob-c)]",
      )}
    >
      {view === "list" ? (
        <MewTile cat={cat} rec={rec} size={40} frame="slot" />
      ) : (
        <span className="flex items-start justify-center">
          <MewTile cat={cat} rec={rec} size={66} frame="slot" />
        </span>
      )}
      {view === "list" ? (
        <span className="flex min-w-0 flex-col justify-center">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[13.5px]/[1.15] font-bold [font-family:var(--mwf-hand)] min-[1600px]:text-[15px]">{rec.name}</span>
        </span>
      ) : (
        <>
          <span className="flex min-w-0 flex-col overflow-hidden">
            <span className="overflow-hidden text-center text-[13.5px]/[1.15] font-bold [font-family:var(--mwf-hand)] min-[1600px]:text-[15px] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box] [min-height:2.3em]">{rec.name}</span>
          </span>
          <span className="flex min-h-[26px] min-w-0 max-w-full items-center justify-center gap-1 overflow-hidden [&>*]:min-w-0 [&>*]:overflow-hidden">
            {meta}
          </span>
        </>
      )}
      {view === "list" && <Icon name="chevronRight" size={15} className="flex-none text-[color:var(--mwp-ink-soft)]" />}
    </button>
  )
}

function mewCatLabel(cat: string, t: (k: string, p?: Record<string, string | number | Date>) => string): string {
  if (cat === "sets") return t("pop.setFlag").toLowerCase()
  const c = MEW.catBy[cat]
  return c ? t(mewCatKey(c.key, "singular")) : cat
}
function mewPopHue(cat: string, rec: MewRec): number {
  if (cat === "sets") return 40
  if (cat === "items" && rec.rarity) return MEW.rarity(rec.rarity).hue
  if (cat === "characters" && rec.faction) return MEW.faction(rec.faction).hue
  return MEW.catBy[cat] ? MEW.catBy[cat].hue : 230
}
function mewEffectNames(map?: Record<string, unknown>, max = 4): string | null {
  const keys = map ? Object.keys(map) : []
  if (!keys.length) return null
  return keys.slice(0, max).map((k) => mewHuman(k)).join(" · ") + (keys.length > max ? " +" + (keys.length - max) : "")
}

const FLAG_TONE: Record<string, string> = {
  warn: "text-[color:var(--mwp-warn)] border-[color-mix(in_srgb,var(--mwp-warn)_45%,transparent)] [&_svg]:text-[color:var(--mwp-warn)]",
  bad: "text-[color:var(--mwp-bad)] border-[color-mix(in_srgb,var(--mwp-bad)_45%,transparent)] [&_svg]:text-[color:var(--mwp-bad)]",
  good: "text-[color:var(--mwp-good)] border-[color-mix(in_srgb,var(--mwp-good)_45%,transparent)] [&_svg]:text-[color:var(--mwp-good)]",
  rar: "text-[hsl(var(--h)_45%_34%)] border-[color-mix(in_srgb,hsl(var(--h)_55%_50%)_55%,transparent)] [&_svg]:text-[hsl(var(--h)_55%_45%)]",
}
function PopFlag({ icon, tone, children }: { icon?: IconName; tone?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-0.5 pt-[3px] text-[11px]/[1.2] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:9px_11px_8px_12px] [&_svg]:text-[color:var(--mwp-ink-soft)]", tone && FLAG_TONE[tone])}>
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  )
}

type FactRow = { label: string; value: React.ReactNode; mono?: boolean }
function PopFacts({ rows }: { rows: unknown[] }) {
  const list = rows.filter((r): r is FactRow => !!r && typeof r === "object")
  if (!list.length) return null
  return (
    <dl className="m-0 flex flex-col">
      {list.map((r, i) => (
        <div className="flex items-baseline justify-between gap-3 border-b-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] py-[5px] last:border-b-0" key={i}>
          <dt className="flex-none text-[10.5px]/[1.2] uppercase tracking-[0.06em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">{r.label}</dt>
          <dd className={cn("m-0 text-right", r.mono ? "font-mono text-[12px]/[1.3] font-bold text-[color:var(--mwp-red-deep)]" : "text-[12.5px]/[1.3] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]")}>{r.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function MewPopBody({ cat, rec, t }: { cat: string; rec: MewRec; t: (k: string, p?: Record<string, string | number | Date>) => string }) {
  if (cat === "abilities") {
    const cost = rec.cost || {}
    const tgt = rec.target || {}
    const dmg = rec.dmg || {}
    const TM: Record<string, string> = { none: t("targetMode.none"), self: t("targetMode.self"), single: t("targetMode.single"), tile: t("targetMode.tile"), line: t("targetMode.line"), cone: t("targetMode.cone"), all: t("targetMode.all"), aoe: t("targetMode.aoe") }
    const range = tgt.min_range != null || tgt.max_range != null ? (tgt.min_range === tgt.max_range ? String(tgt.max_range || 0) : (tgt.min_range || 0) + "–" + (tgt.max_range || 0)) : null
    const eff = mewEffectNames(dmg.effects)
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {rec.cls && <PopFlag icon="star">{mewHuman(String(rec.cls).replace(/Ability$/, ""))}</PopFlag>}
          {cost.act_points != null && (
            <PopFlag icon="bolt" tone="warn">
              {cost.act_points} {t("data.statAbbr.pa")}
            </PopFlag>
          )}
          {cost.move_points ? <PopFlag icon="compass">{cost.move_points} {t("data.statAbbr.pm")}</PopFlag> : null}
        </div>
        {mewClip(rec.desc, 130) ? <MewText muted>{mewClip(rec.desc, 130)}</MewText> : null}
        <PopFacts rows={[tgt.target_mode && { label: t("label.target"), value: TM[tgt.target_mode] || mewHuman(tgt.target_mode) }, range && { label: t("label.range"), value: range }, dmg.damage && { label: t("label.damage"), value: dmg.damage, mono: true }, dmg.heal && { label: t("label.heal"), value: dmg.heal, mono: true }, eff && { label: t("label.applies"), value: eff }]} />
      </>
    )
  }
  if (cat === "passives") {
    const base = mewEffectNames(rec.base)
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {rec.cls ? <PopFlag icon="star">{mewHuman(rec.cls)}</PopFlag> : <PopFlag icon="shield">{t("label.general")}</PopFlag>}
          {rec.ranks && rec.ranks.length > 0 && <PopFlag icon="layers">{t("pop.passiveRanks", { n: rec.ranks.length })}</PopFlag>}
        </div>
        {mewClip(rec.desc, 150) ? <MewText muted>{mewClip(rec.desc, 150)}</MewText> : null}
        <PopFacts rows={[base && { label: t("pop.effect"), value: base }, rec.shield != null && { label: t("label.shield"), value: rec.shield, mono: true }]} />
      </>
    )
  }
  if (cat === "keywords") {
    const tip = mewClip(rec.tip, 190)
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          <PopFlag icon="flame" tone="warn">
            {t("label.statusBadge")}
          </PopFlag>
        </div>
        {tip ? <MewText muted>{tip}</MewText> : <div className="text-[12px]/[1.4] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("pop.noDesc")}</div>}
      </>
    )
  }
  if (cat === "items") {
    const passN = rec.passives ? Object.keys(rec.passives).length : 0
    const kindLabel = MEW_KIND_LABEL[rec.kind || ""] ? t(`data.kind.${rec.kind}`) : mewHuman(rec.kind)
    const rarityLabel = rec.rarity ? mewRarityLabel(t, rec.rarity) : null
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          <PopFlag icon="bookmark">{kindLabel}</PopFlag>
          {rarityLabel && (
            <PopFlag tone="rar" icon="star">
              {rarityLabel}
            </PopFlag>
          )}
        </div>
        {mewClip(rec.desc, 130) ? <MewText muted>{mewClip(rec.desc, 130)}</MewText> : null}
        <PopFacts rows={[rec.shield != null && { label: t("label.shield"), value: rec.shield, mono: true }, rec.durability != null && { label: t("label.durability"), value: rec.durability, mono: true }, passN > 0 && { label: t("inline.passivesAbbr"), value: t("pop.passivesCount", { n: passN }) }]} />
      </>
    )
  }
  if (cat === "furniture") {
    const stats = (rec.stats || {}) as Record<string, number>
    const FURN_I18N = ["comfort", "appeal", "stimulation", "evolution", "health"]
    const statRows = Object.entries(stats).map(([k, v]) => ({ label: FURN_I18N.includes(k) ? t(`label.${k}`) : mewHuman(k), value: (v > 0 ? "+" : "") + v, mono: true }))
    const hasBody = statRows.length > 0 || !!mewClip(rec.desc, 130)
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {rec.special && <PopFlag icon="star" tone="good">{t("label.special")}</PopFlag>}
          {rec.removed && <PopFlag icon="trash" tone="bad">{t("label.removed")}</PopFlag>}
        </div>
        {mewClip(rec.desc, 130) ? <MewText muted>{mewClip(rec.desc, 130)}</MewText> : null}
        <PopFacts rows={statRows} />
        {!hasBody && <div className="text-[12px]/[1.4] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("label.noData")}</div>}
      </>
    )
  }
  if (cat === "mutations") {
    const mods = rec.statMods
      ? Object.entries(rec.statMods as Record<string, unknown>).map(([k, v]) => mewStatModLabel(t, k) + " " + ((typeof v === "number" && v > 0 ? "+" : "") + v)).join(" · ")
      : null
    const eff = mewEffectNames(rec.passives as Record<string, unknown> | undefined)
    const hasBody = !!(mods || eff || mewClip(rec.desc, 150))
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {rec.body_part ? <PopFlag icon="sparkles">{mewBodyPartLabel(t, String(rec.body_part))}</PopFlag> : null}
        </div>
        {mewClip(rec.desc, 150) ? <MewText muted>{mewClip(rec.desc, 150)}</MewText> : null}
        <PopFacts rows={[mods && { label: t("panel.statMods"), value: mods }, eff && { label: t("pop.effect"), value: eff }]} />
        {!hasBody && <div className="text-[12px]/[1.4] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("label.noData")}</div>}
      </>
    )
  }
  if (cat === "statuses") {
    const kind = typeof rec.status_kind === "string" ? rec.status_kind : ""
    const kindIcon = (kind === "weather" ? "cloud" : kind === "injuries" ? "heart" : kind === "elite_buffs" ? "sparkles" : "flame") as IconName
    const eff = mewEffectNames((rec.effects || rec.passives) as Record<string, unknown> | undefined)
    const mods = rec.statMods
      ? Object.entries(rec.statMods as Record<string, unknown>).map(([k, v]) => mewStatModLabel(t, k) + " " + ((typeof v === "number" && v > 0 ? "+" : "") + v)).join(" · ")
      : null
    const hasBody = !!(eff || mods || mewClip(rec.desc, 150))
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {kind ? <PopFlag icon={kindIcon}>{t(`filter.statuses.${kind}`)}</PopFlag> : null}
          {rec.elite_type === "boss" && <PopFlag icon="star" tone="warn">{t("label.bossLabel")}</PopFlag>}
          {rec.unique === true && <PopFlag icon="sparkles" tone="good">{t("label.unique")}</PopFlag>}
        </div>
        {mewClip(rec.desc, 150) ? <MewText muted>{mewClip(rec.desc, 150)}</MewText> : null}
        <PopFacts rows={[eff && { label: t("pop.effect"), value: eff }, mods && { label: t("panel.statMods"), value: mods }]} />
        {!hasBody && <div className="text-[12px]/[1.4] font-medium italic text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("label.noData")}</div>}
      </>
    )
  }
  if (cat === "characters") {
    const factionLabel = rec.faction ? mewFactionLabel(t, rec.faction) : null
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          {factionLabel && <PopFlag icon="paw">{factionLabel}</PopFlag>}
          {rec.type && (
            <PopFlag icon="star" tone="warn">
              {mewHuman(rec.type)}
            </PopFlag>
          )}
          {rec.hp != null && (
            <PopFlag icon="heart" tone="bad">
              {rec.hp} {t("data.statAbbr.pv")}
            </PopFlag>
          )}
        </div>
        {rec.stats ? (
          <div className="mt-px">
            <MewStats stats={rec.stats} />
          </div>
        ) : null}
      </>
    )
  }
  if (cat === "sets") {
    const members = rec.members || []
    const kinds = [...new Set(members.map((m) => MEW_KIND_LABEL[m.kind] ? t(`data.kind.${m.kind}`) : mewHuman(m.kind)).filter(Boolean))]
    return (
      <>
        <div className="flex flex-wrap gap-[5px]">
          <PopFlag icon="layers">{t("pop.setFlag")}</PopFlag>
          <PopFlag icon="sword" tone="rar">
            {t("pop.setPieces", { n: members.length })}
          </PopFlag>
        </div>
        {members.length ? (
          <div className="flex flex-wrap gap-[5px]">
            {members.slice(0, 9).map((m) => (
              <span key={m.id} className="border-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-0.5 pt-[3px] text-[11px]/[1.2] font-bold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:8px_10px_9px_11px]">
                {m.name}
              </span>
            ))}
            {members.length > 9 && (
              <span className="border-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-0.5 pt-[3px] text-[10px]/[1.2] font-bold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [border-radius:8px_10px_9px_11px]">
                +{members.length - 9}
              </span>
            )}
          </div>
        ) : null}
        {kinds.length ? <PopFacts rows={[{ label: t("pop.slots"), value: kinds.join(" · ") }]} /> : null}
      </>
    )
  }
  return mewClip(rec.desc || rec.tip, 160) ? <MewText muted>{mewClip(rec.desc || rec.tip, 160)}</MewText> : null
}

export function MewPopCard({ cat, rec }: { cat: string; rec: MewRec }) {
  const t = useToolT(MEWGENICS_NS)
  const isSet = cat === "sets"

  return (
    // The game's tooltip PNG cannot 9-slice to arbitrary card sizes without
    // smearing its mottled fill, so the card renders the same motifs natively:
    // paper + tamed grain (mew-paper) and the teal accent rule (mew-rule).
    <div
      style={{ "--h": mewPopHue(cat, rec) } as React.CSSProperties}
      className="relative border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] text-[color:var(--mwp-ink)] mew-paper mew-rule [border-radius:var(--wob-c)] [box-shadow:0_5px_0_var(--mwp-shadow-lg)] [font-family:var(--mwf-hand)] [transform:rotate(-0.5deg)]"
    >
      <span aria-hidden className="pointer-events-none absolute -top-[9px] left-[22px] h-[17px] w-[58px] border-l border-r border-dashed border-[var(--mwp-tape-light-bright)] bg-[color-mix(in_srgb,hsl(var(--h)_60%_70%)_40%,var(--mwp-tape))] [transform:rotate(-4deg)]" />
      <header className="flex items-center gap-[11px] border-b-2 border-dashed border-[color:var(--mwp-ink-line)] px-[14px] pb-2.5 pt-3">
        <MewTile cat={cat} rec={rec} size={40} glyph={isSet ? "layers" : undefined} />
        <div className="flex min-w-0 flex-col gap-[3px]">
          <span className="text-[10px]/none uppercase tracking-[0.1em] text-[hsl(var(--h)_45%_34%)] [font-family:var(--mwf-disp)]">{mewCatLabel(cat, t)}</span>
          <span className="truncate text-[16px]/none text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)] [text-shadow:1.5px_1.5px_0_color-mix(in_srgb,hsl(var(--h)_55%_55%)_40%,transparent)]">{rec.name}</span>
        </div>
      </header>
      <div className="flex flex-col gap-[9px] px-[14px] pb-3 pt-[11px]">
        <MewPopBody cat={cat} rec={rec} t={t} />
      </div>
      {isSet ? (
        <div className="flex items-center gap-[5px] border-t-2 border-dashed border-[color:var(--mwp-ink-line)] px-[14px] py-2 text-[10.5px]/none font-bold tracking-[0.02em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)] [&_svg]:text-[color:var(--mwp-ink-soft)]">
          <Icon name="layers" size={11} />
          {t("pop.setFooter")}
        </div>
      ) : (
        <div className="flex items-center gap-[5px] border-t-2 border-dashed border-[color:var(--mwp-ink-line)] bg-[color-mix(in_srgb,var(--mwp-red)_6%,transparent)] px-[14px] py-2 text-[10.5px]/none font-bold tracking-[0.02em] text-[color:var(--mwp-red-deep)] [font-family:var(--mwf-hand)] [&_svg]:text-[color:var(--mwp-red)]">
          <Icon name="arrow" size={11} />
          {t("pop.openCard")}
        </div>
      )}
    </div>
  )
}

export function MewHoverCard({ cat, rec, children }: { cat: string; rec: MewRec; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  const [posAbove, setPosAbove] = React.useState(false)
  const showT = React.useRef(0)
  const hideT = React.useRef(0)
  const containerRef = React.useRef<HTMLSpanElement>(null)
  const popoverRef = React.useRef<HTMLDivElement>(null)
  const popIdRef = React.useRef(Math.random().toString(36).substring(7))

  const openFn = React.useCallback(() => {
    clearTimeout(hideT.current)
    showT.current = window.setTimeout(() => setOpen(true), 90)
  }, [])

  const closeFn = React.useCallback(() => {
    clearTimeout(showT.current)
    hideT.current = window.setTimeout(() => setOpen(false), 110)
  }, [])

  // Collision detection on open + resize
  React.useEffect(() => {
    if (!open) return

    const place = () => {
      const el = popoverRef.current
      if (!el) return
      el.style.left = ""
      el.style.right = ""
      const popover = el.getBoundingClientRect()
      setPosAbove(popover.bottom > window.innerHeight - 10)
      if (popover.left < 10) {
        el.style.left = "10px"
      } else if (popover.right > window.innerWidth - 10) {
        el.style.right = "10px"
      }
    }
    place()
    window.addEventListener("resize", place)
    return () => window.removeEventListener("resize", place)
  }, [open])

  // Escape key handler
  React.useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
      }
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [open])

  // Touch handling - close on scroll/touch elsewhere
  React.useEffect(() => {
    if (!open) return
    const handleTouchOrScroll = () => {
      setOpen(false)
    }
    window.addEventListener("scroll", handleTouchOrScroll, true)
    window.addEventListener("touchstart", handleTouchOrScroll, true)
    return () => {
      window.removeEventListener("scroll", handleTouchOrScroll, true)
      window.removeEventListener("touchstart", handleTouchOrScroll, true)
    }
  }, [open])

  React.useEffect(
    () => () => {
      clearTimeout(showT.current)
      clearTimeout(hideT.current)
    },
    [],
  )

  const triggerId = `mew-hover-trigger-${popIdRef.current}`

  return (
    <span
      ref={containerRef}
      className="relative inline-flex max-w-full"
      onMouseEnter={openFn}
      onMouseLeave={closeFn}
      onFocus={openFn}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          closeFn()
        }
      }}
    >
      <span id={triggerId}>{children}</span>
      {open && (
        <div
          ref={popoverRef}
          className={`absolute z-[120] w-[300px] max-w-[calc(100vw_-_20px)] ${
            posAbove ? "bottom-[calc(100%_+_9px)]" : "top-[calc(100%_+_9px)]"
          } left-1/2 -translate-x-1/2 [filter:drop-shadow(0_10px_14px_var(--mwp-shadow-lg))] focus-within:outline-none`}
          role="tooltip"
          aria-describedby={triggerId}
          tabIndex={-1}
          onMouseEnter={() => clearTimeout(hideT.current)}
          onMouseLeave={closeFn}
        >
          <MewPopCard cat={cat} rec={rec} />
        </div>
      )}
    </span>
  )
}

// The paper pill link used as a hover trigger (mew-ref--link).
export function MewRefLink({ icon, count, onClick, children }: { icon?: IconName; count?: number; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="group inline-flex cursor-pointer items-center gap-[5px] border-[1.5px] border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] px-[9px] pb-1 pt-[5px] text-[12px]/[1.15] font-semibold text-[color:var(--mwp-ink)] transition-[color,border-color,transform,box-shadow] duration-[130ms] [box-shadow:0_2px_0_var(--mwp-shadow-pop)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)] hover:border-[color:var(--mwp-red-deep)] hover:text-[color:var(--mwp-red-deep)] hover:[transform:rotate(-1.2deg)_translateY(-1px)] active:translate-y-0.5 active:[box-shadow:0_1px_0_var(--mwp-shadow-pop)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--mwp-red)] focus-visible:ring-offset-0">
      {icon && <Icon name={icon} size={12} className="flex-none text-[color:var(--mwp-ink-soft)] group-hover:text-[color:var(--mwp-red)]" />}
      <span className="min-w-0">{children}</span>
      {count != null && <span className="pl-[3px] font-mono text-[9px]/none font-bold text-[color:var(--mwp-ink-soft)]">{count}</span>}
    </button>
  )
}

// The set tag (mew-tag--set) — a help-cursor sticker used as a hover trigger.
export function MewSetTag({ children }: { children: React.ReactNode }) {
  return <span className="cursor-help border-[1.5px] border-solid border-[color-mix(in_srgb,var(--mwp-paper-warn)_45%,var(--mwp-ink-line))] bg-[color:var(--mwp-paper-2)] px-2 pb-1 pt-[5px] text-[11.5px]/none font-semibold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)] [border-radius:var(--wob-sm)]">{children}</span>
}
