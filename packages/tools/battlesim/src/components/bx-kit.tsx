"use client"

// v3 «Bx» battle-HUD kit — the `bx-*` primitives, consuming the real engine's
// BSX shapes (see `lib/bx-helpers`). Presentational only; callers own data +
// choices. Sprites resolve through the shared `spriteUrl` used by every other
// v3 Pokémon tool. Every word here comes from the catalog through
// `useBxLabels()`; the helpers module keeps colours and numbers only.
import * as React from "react"
import { cn } from "@boffmedia/ui"
import { Icon } from "@boffmedia/ui"
import { DkSprite, DkSeg } from "@boffmedia/ui/datakit"
import { spriteUrl, handleSpriteError } from "@boffmedia/tools-pokemon"
import { Dex } from "@pkmn/dex"
import { useToolT, BATTLESIM_NS } from "../i18n"
import { sanitizeHtml } from "../engine/sanitizeHtml"
import type { LedgerEntry } from "../engine/TurnLedger"
import { BSIM_FOCUS, BSIM_FOCUS_CUT } from "./bsim-kit"
import {
  tyColor, tyLabel, TYPE_ES, hpTone, hpBand, effTag, effMult, speedOrder,
  hpSegments, shownVolatiles, perishCount, volatileTone, STATUS_DOT, GENDER_GLYPH,
  type BxMon, type BxMove, type BxTickEv, type BxTeamHP, type OrderSlot, type EffKey,
} from "../lib/bx-helpers"

const tyc = (v: string) => ({ ["--tyc"]: v }) as React.CSSProperties

/**
 * Champions-style HUD nameplate voice: Saira italic (not Saira Condensed,
 * which ships normal styles only with no italic file). The oblique effect
 * comes from real italic + a condensed width via the wdth axis.
 *
 * CRITICAL: font-variation-settings overrides font-weight, so always set
 * both axes together in the same declaration. Tailwind's arbitrary values
 * with commas/quotes (e.g. `[font-variation-settings:'wdth'_75,'wght'_800]`)
 * are fragile — define as a named constant (CSS class or inline style).
 */
export const BX_PLATE_VOICE: React.CSSProperties = {
  fontFamily: "Saira, sans-serif",
  fontStyle: "italic",
  fontVariationSettings: '"wdth" 75, "wght" 800',
  letterSpacing: "-0.01em",
  textTransform: "uppercase",
  // HP counts down digit by digit; proportional figures make the readout
  // shuffle sideways on every tick.
  fontVariantNumeric: "tabular-nums",
}

/**
 * The HP readout's accessible name.
 *
 * The visible text is `19/155`, which a screen reader pronounces as "19 slash
 * 155" — so the number is spelled out in words instead. In the reader's own
 * language: this is a Spanish-first product and an English aria-label here is a
 * regression, not a stopgap.
 */
export function hpAriaLabel(
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  mon: { fnt?: boolean; hpCur?: number | null; hpMax?: number | null },
  pct: number,
  exact: boolean,
): string {
  if (mon.fnt) return t("battle.labels.statusLong.fnt")
  return exact && mon.hpCur != null && mon.hpMax != null
    ? t("battle.hp.ariaExact", { cur: mon.hpCur, max: mon.hpMax })
    : t("battle.hp.ariaPct", { pct })
}

/**
 * The second half of the focus ring for a CUT shape.
 *
 * `BSIM_FOCUS_CUT` widens the chamfer stroke, which is the design system's
 * answer and the only one an outline survives on a clipped box — but on a
 * 500x56 move key that stroke is a 3px tick in one corner, which a keyboard
 * user tracking focus across sixteen controls cannot follow. An INSET ring is
 * drawn inside the border box, so the clip never eats it, and it reads as an
 * edge rather than as a shadow.
 */
const FOCUS_RING = "focus-visible:[box-shadow:inset_0_0_0_2px_var(--accent)]"

/** Press feedback, with the reduced-motion opt-out the system requires. */
const PRESS = "active:translate-y-px motion-reduce:active:translate-y-0"

/* ── Catalog resolvers ───────────────────────────────────────────────────── */
export interface BxLabels {
  type: (t: string) => string
  cat: (c: string) => string
  status: (s: string) => string
  statusLong: (s: string) => string
  boost: (b: string) => string
  eff: (k: EffKey) => string
  stat: (s: string) => string
}
/** Domain words (types, categories, statuses, stat names) resolved from the catalog. */
export function useBxLabels(): BxLabels {
  const t = useToolT(BATTLESIM_NS)
  return React.useMemo<BxLabels>(() => ({
    type: (ty) => (ty in TYPE_ES ? t(`battle.types.${ty}`) : tyLabel(ty)),
    cat: (c) => (c === "phys" || c === "spec" || c === "status" ? t(`battle.labels.cat.${c}`) : c),
    status: (s) => (["brn", "par", "psn", "tox", "slp", "frz", "fnt"].includes(s) ? t(`battle.labels.status.${s}`) : s.toUpperCase()),
    statusLong: (s) => (["brn", "par", "psn", "tox", "slp", "frz", "fnt"].includes(s) ? t(`battle.labels.statusLong.${s}`) : s),
    boost: (b) => (["atk", "def", "spa", "spd", "spe", "accuracy", "evasion"].includes(b) ? t(`battle.labels.boost.${b}`) : b),
    eff: (k) => t(`battle.labels.eff.${k}`),
    stat: (s) => (["hp", "atk", "def", "spa", "spd", "spe"].includes(s) ? t(`battle.labels.stat.${s}`) : s),
  }), [t])
}

export function BxSprite({ mon, size = 40 }: { mon: BxMon; size?: number }) {
  return <DkSprite src={spriteUrl(mon.species || mon.name)} alt={mon.name} size={size} onError={handleSpriteError} />
}

/* ── Type / category / status / boost / tera ─────────────────────────────── */
export function BxType({ type, ghost = false, small = false }: { type: string; ghost?: boolean; small?: boolean }) {
  const L = useBxLabels()
  return (
    <span style={{ ...tyc(tyColor(type)) }}
      className={cn("cut cut-edge-slant [--cut:3px]", "inline-flex items-center gap-[0.3125rem] font-mono font-semibold uppercase leading-none tracking-[0.06em]",
        small ? "gap-1 px-[0.3125rem] py-[3px] text-[0.53125rem]" : "px-[0.4375rem] py-1 text-[0.625rem]",
        ghost
          ? "border border-solid border-[color-mix(in_srgb,var(--tyc)_40%,transparent)] text-[var(--tyc)] [background:color-mix(in_srgb,var(--tyc)_13%,transparent)]"
          : "text-accent-ink [background:var(--tyc)]")}>
      <i aria-hidden className={cn("[clip-path:circle(50%)]", ghost ? "bg-[var(--tyc)]" : "bg-current opacity-55")} style={{ width: 4, height: 4 }} />{L.type(type)}
    </span>
  )
}
export function BxTypeRow({ types, ghost = true, small = false }: { types: string[]; ghost?: boolean; small?: boolean }) {
  return <span className="inline-flex flex-wrap gap-1">{types.map((t) => <BxType key={t} type={t} ghost={ghost} small={small} />)}</span>
}

const CAT_MARK: Record<string, string> = {
  phys: "[clip-path:polygon(50%_0,100%_100%,0_100%)] bg-bad",
  spec: "[clip-path:circle(50%)] bg-signal",
  status: "bg-txt-dim",
}
export function BxCat({ cat }: { cat: string }) {
  const L = useBxLabels()
  return (
    <span className="inline-flex items-center gap-1 font-mono text-[0.53125rem] font-semibold uppercase leading-none tracking-[0.08em] text-txt-muted">
      <i aria-hidden className={cn("h-[0.4375rem] w-[0.4375rem] flex-none", CAT_MARK[cat] || CAT_MARK.status)} />{L.cat(cat)}
    </span>
  )
}

export const STATUS_BG: Record<string, string> = {
  brn: "bg-[#ff7a33] text-accent-ink", par: "bg-[#f7d02c] text-accent-ink",
  psn: "bg-[#a33ea1] text-white", tox: "bg-[#a33ea1] text-white",
  slp: "bg-txt-dim text-base", frz: "bg-[#74c6c2] text-accent-ink", fnt: "bg-line-2 text-txt",
}
/**
 * The status pill, beside the NAME — not in the chip row under the bar.
 *
 * A burn and a paralysis change what the next turn is worth more than any
 * type badge does, and in the chip row they sat fourth in a wrapping line
 * that a long species name could push onto a second row entirely. Beside the
 * name they are always in the same place, always visible, and the colour
 * block makes them findable without reading: the three letters are the
 * identification, the block is the alarm.
 */
export function BxStatus({ status, long = false }: { status?: string | null; long?: boolean }) {
  const L = useBxLabels()
  if (!status) return null
  return (
    <span title={L.statusLong(status)} aria-label={L.statusLong(status)}
      className={cn("cut [--cut:2px] ", "inline-flex flex-none items-center gap-[3px] px-[0.3125rem] py-[3px] font-mono text-[0.53125rem] font-bold not-italic leading-none tracking-[0.08em]", STATUS_BG[status] || "bg-warn text-accent-ink")}>
      {/* Icon-free by design: a burn glyph and a poison glyph are two small
          silhouettes at this size, while two flat colour blocks are told
          apart in peripheral vision. */}
      <i aria-hidden className="h-[0.375rem] w-[0.375rem] flex-none border border-solid border-[color-mix(in_srgb,black_35%,transparent)]" style={{ background: STATUS_DOT[status] || "var(--warn)" }} />
      {long ? L.statusLong(status) : L.status(status)}
    </span>
  )
}

/* ── Volatiles ───────────────────────────────────────────────────────────── */
/**
 * Substitute, leech seed, confusion, taunt, encore, perish count, protect.
 *
 * `BSXMon.protect` used to be the whole of this — one boolean for a table
 * that decides whether your attack even connects. Rendered as chips rather
 * than as a sentence because they are read at a glance mid-turn and because
 * they wrap: a mon under three of them is exactly the mon whose plate must
 * still fit.
 */
export function BxVolatiles({ ids, perish = null }: { ids: string[]; perish?: number | null }) {
  const t = useToolT(BATTLESIM_NS)
  if (!ids.length && perish == null) return null
  const chip = "flex-none border border-dashed border-[color-mix(in_srgb,var(--tyc)_55%,transparent)] px-1 py-[2px] font-mono text-[0.53125rem] font-bold not-italic uppercase leading-none tracking-[0.06em] text-[var(--tyc)]"
  return (
    <>
      {ids.map((id) => (
        <i key={id} style={tyc(volatileTone(id))} className={chip}
          title={id === "protect" ? t("battle.labels.protect") : t(`battle.labels.volatile.${id}`)}>
          {id === "protect" ? t("battle.labels.protect") : t(`battle.labels.volatile.${id}`)}
        </i>
      ))}
      {perish != null && (
        <i style={tyc("var(--bad)")} className={chip} title={t("battle.labels.volatile.perish", { n: perish })}>
          {t("battle.labels.volatile.perish", { n: perish })}
        </i>
      )}
    </>
  )
}

/* ── Item / ability / tera meta line ─────────────────────────────────────── */
/** `lastItemEffect`/`itemEffect` → the one word the line prints beside the item. */
function itemStateKey(effect?: string): "lost" | "used" | "swapped" | null {
  switch (effect) {
    case "knocked off": case "stolen": case "incinerated": case "flung": case "popped": case "held up":
      return "lost"
    case "eaten": case "consumed": case "harvested":
      return "used"
    case "tricked": case "bestowed":
      return "swapped"
    default:
      return null
  }
}

/**
 * The compact meta line: item, ability, tera. One row, fixed shape.
 *
 * An item that has LEFT is information — a Choice Scarf that got knocked off
 * changes the speed maths for the rest of the game — so `lastItem` is drawn
 * struck through with the reason rather than simply vanishing, which is what
 * the plate did before and what left a player believing the scarf was still
 * on. Ability appears only once the battle has revealed it: a blank is honest
 * and an em dash is not a guess either, so the row simply shortens.
 */
export function BxMeta({ mon, compact = false }: { mon: BxMon; compact?: boolean }) {
  const t = useToolT(BATTLESIM_NS)
  const L = useBxLabels()
  const held = mon.item ? (Dex.items.get(mon.item)?.name ?? mon.item) : null
  const gone = !held && mon.lastItem ? (Dex.items.get(mon.lastItem)?.name ?? mon.lastItem) : null
  const goneKey = itemStateKey(mon.lastItemEffect) ?? (gone ? "lost" : null)
  const heldKey = itemStateKey(mon.itemEffect)
  const ability = mon.ability ? (Dex.abilities.get(mon.ability)?.name ?? mon.ability) : null
  if (!held && !gone && !ability && !(mon.tera && mon.teraType)) return null
  const size = compact ? "text-[0.53125rem]" : "text-[0.5625rem]"
  return (
    <span className={cn("flex min-w-0 items-center gap-[0.375rem] font-mono font-medium not-italic leading-none tracking-[0.04em] text-txt-dim", size)}>
      {held && (
        <span className="inline-flex min-w-0 items-center gap-[0.25rem]" title={t("battle.mon.item") + ": " + held}>
          <i aria-hidden className="h-[0.3125rem] w-[0.3125rem] flex-none rotate-45 bg-txt-dim" />
          <span className="min-w-0 truncate text-txt-muted">{held}</span>
          {heldKey && <b className="flex-none text-warn">{t(`battle.mon.itemState.${heldKey}`)}</b>}
        </span>
      )}
      {gone && (
        <span className="inline-flex min-w-0 items-center gap-[0.25rem]" title={t("battle.mon.item") + ": " + gone}>
          <i aria-hidden className="h-[0.3125rem] w-[0.3125rem] flex-none rotate-45 bg-line-2" />
          <s className="min-w-0 truncate decoration-bad/70">{gone}</s>
          {goneKey && <b className="flex-none text-bad">{t(`battle.mon.itemState.${goneKey}`)}</b>}
        </span>
      )}
      {ability && (
        <span className="min-w-0 truncate" title={t("battle.mon.ability") + ": " + ability}>{ability}</span>
      )}
      {mon.tera && mon.teraType && (
        <span className="ml-auto inline-flex flex-none items-center gap-[0.25rem] uppercase" style={tyc(tyColor(mon.teraType))}>
          <BxTera type={mon.teraType} size="0.85em" /><b className="text-[var(--tyc)]">{L.type(mon.teraType)}</b>
        </span>
      )}
    </span>
  )
}

export function BxBoost({ stat, value }: { stat: string; value: number }) {
  const L = useBxLabels()
  return (
    <span className={cn("flex-none border border-solid px-[0.3125rem] py-[3px] font-mono text-[0.5625rem] font-bold leading-none tracking-[0.04em]",
      value > 0 ? "border-[color-mix(in_srgb,var(--ok)_45%,transparent)] bg-ok-soft text-ok" : "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad")}>
      {(value > 0 ? "+" : "") + value} {L.boost(stat)}
    </span>
  )
}

export function BxTera({ type, size = "1em" }: { type: string; size?: string }) {
  const t = useToolT(BATTLESIM_NS)
  const L = useBxLabels()
  return <span style={{ ...tyc(tyColor(type)), fontSize: size }} title={t("bx.teraTypeTitle", { type: L.type(type) })}
    className="flex-none leading-none [color:var(--tyc)] [text-shadow:0_0_8px_color-mix(in_srgb,var(--tyc)_65%,transparent)]">◆</span>
}

/* ── HP bar (ledger segments + ghost damage preview) ─────────────────────── */
/**
 * Three layers over one track: what you have, what this turn took, what this
 * turn gave back.
 *
 * THE TRAIL IS GONE ON PURPOSE. It was a second bar that remembered the
 * component's own previous percentage and caught up 500 ms later, which meant
 * (a) a mon switching into the slot inherited its predecessor's number and
 * animated a 90-point "hit" that never happened — the memory was keyed on the
 * percentage, not on WHICH POKÉMON — and (b) how much damage the bar claimed
 * depended on when React re-rendered, so a two-hit move and a hit-plus-
 * residual were indistinguishable and a fast turn could swallow one of them
 * entirely. `TurnLedger` already records every damage and heal event with
 * absolute numbers, keyed by identity, so the band is READ rather than
 * inferred: it appears the instant the event lands and stays until the next
 * `|turn|` snapshot re-baselines the entry. No timer decides anything here.
 *
 * `monKey` is the second half of that fix: the bar remounts on an identity
 * change, so the fill's width transition never plays across two different
 * Pokémon.
 */
export function BxHp({ pct, ghost = null, ledger = null, monKey, ko = false }: {
  pct: number
  ghost?: { min: number; max: number } | null
  /** This turn's record for the mon this bar belongs to. */
  ledger?: LedgerEntry | null
  /** `searchid`-style identity. Changing it remounts the bar with no animation. */
  monKey?: string
  /** Fainted: the track goes flat and desaturated rather than merely empty. */
  ko?: boolean
}) {
  const seg = hpSegments(pct, ledger)
  const p = seg.pct
  const gMax = ghost ? Math.min(p, ghost.max) : 0
  const gMin = ghost ? Math.min(p, ghost.min) : 0
  return (
    // The SHAPE is the redesign. A slanted bar is what Champions draws and it
    // is also what this design system already speaks — `.cut` is literally a
    // parallelogram — so the modern read and the house style are the same move
    // rather than a compromise between them.
    //
    // A CSS `border` cannot survive a `clip-path`: the clip slices the vertical
    // borders off and leaves the diagonals unstroked, so an outlined shape
    // collapses into two loose horizontal rules. The stroke has to be geometry.
    // This is the nesting `.cut-frame` performs — an outer slab painted in the
    // line colour, an inner one inset and re-clipped — written out here because
    // the bars inside must be clipped to the inner shape too, and `.cut-frame`
    // paints its fill from a pseudo-element that children cannot live inside.
    <div key={monKey} data-bx-hp className={cn("cut relative h-[1.0625rem] w-full [--cut:7px]", ko ? "bg-[color-mix(in_srgb,var(--line-2)_60%,transparent)] saturate-[0.25]" : "bg-line-2")}>
      <div
        className="cut absolute overflow-hidden bg-[linear-gradient(180deg,var(--base)_0%,var(--panel-2)_100%)] [--cut:6px]"
        // Horizontal inset is wider than vertical on purpose: a 1px diagonal is
        // antialiased across ~1.4px and reads thinner than the 1px rules above
        // and below it, so an even inset makes the slanted edges look weaker
        // than the flat ones. Same reasoning as the design system's --cut-ix.
        style={{ inset: "1px 2px" }}
      >
        {/* Quarter marks, slanted to sit parallel with the bar's own edges. */}
        {[25, 50, 75].map((at) => (
          <i key={at} aria-hidden className="absolute bottom-0 top-0 z-[2] w-px -skew-x-[22deg] bg-[color-mix(in_srgb,var(--line-2)_70%,transparent)]" style={{ left: at + "%" }} />
        ))}

        {/* LOST THIS TURN — from where the bar stands now up to where it stood
            when the turn began. Hatched AND desaturated-red rather than solid:
            solid red beside the live fill reads as a second, larger health
            bar, and the hatch says "this is gone" in a way a flat colour at
            this size cannot. It fades to transparent towards its right edge so
            the band points back at the fill instead of ending in a hard wall.
            Cumulative by construction — a four-hit move draws ONE band. */}
        {seg.lostPct > 0 && (
          <i data-bx-hp-lost aria-hidden
            className="absolute bottom-0 top-0 z-[1] bg-[repeating-linear-gradient(115deg,color-mix(in_srgb,var(--bad)_58%,transparent)_0_3px,color-mix(in_srgb,var(--bad)_18%,transparent)_3px_7px)] [mask-image:linear-gradient(90deg,black_0%,black_58%,color-mix(in_srgb,black_35%,transparent)_100%)]"
            style={{ left: p + "%", width: seg.lostPct + "%" }} />
        )}

        {/* GAINED THIS TURN — soft green from where the turn began up to the
            live edge, i.e. the part of the fill that was not there a moment
            ago. Sits UNDER the fill's z-index and is tinted rather than
            hatched: a heal is good news and should not read as damage. */}
        {seg.gainedPct > 0 && (
          <i data-bx-hp-gained aria-hidden
            className="absolute bottom-0 top-0 z-[1] bg-[color-mix(in_srgb,var(--ok)_55%,transparent)] [mask-image:linear-gradient(90deg,color-mix(in_srgb,black_30%,transparent)_0%,black_100%)]"
            style={{ left: seg.startPct + "%", width: seg.gainedPct + "%" }} />
        )}

        {/* The live fill. */}
        <i
          className="absolute inset-0 right-auto z-[1] bg-[linear-gradient(180deg,var(--hp-top)_0%,var(--hp-main)_55%,var(--hp-bottom)_100%)] transition-[width] duration-[300ms] ease-out motion-reduce:transition-none"
          style={{
            width: p + "%",
            // `color-mix()` percentages are `<percentage [0,100]>`. A value over
            // 100 does not merely clamp — it fails to parse, and because these
            // are CUSTOM properties the failure is invisible until use: the var
            // holds the bad token happily, then the gradient that reads it goes
            // invalid at computed-value time and the background resolves to
            // nothing. A "110%" here left the bar with no fill at all, which no
            // type-check or lint can see. Mix the tint INTO the tone.
            "--hp-main": hpTone(p),
            "--hp-top": "color-mix(in srgb, white 30%, var(--hp-main))",
            "--hp-bottom": "color-mix(in srgb, black 18%, var(--hp-main))",
          } as React.CSSProperties}
        />

        {/* Gloss: a bright band over the top third of the FILL only, which is
            what makes it read as a lit surface rather than a coloured box. */}
        <i aria-hidden className="absolute inset-x-0 top-0 z-[2] h-[0.375rem] bg-[linear-gradient(180deg,color-mix(in_srgb,white_38%,transparent)_0%,transparent_100%)] transition-[width] duration-[300ms] ease-out motion-reduce:transition-none" style={{ width: p + "%" }} />

        {/* Leading edge: a slanted highlight where the fill ends, so the eye
            catches the value changing even on a small plate. */}
        {p > 0 && p < 100 && (
          <i aria-hidden className="absolute bottom-0 top-0 z-[3] -ml-[2px] w-[3px] -skew-x-[22deg] bg-[color-mix(in_srgb,white_70%,var(--hp-edge))] transition-[left] duration-[300ms] ease-out motion-reduce:transition-none" style={{ left: p + "%", "--hp-edge": hpTone(p) } as React.CSSProperties} />
        )}

        {/* Ghost damage preview: hatched band (the predicted range). */}
        {ghost && gMax > gMin && <i className="absolute bottom-0 top-0 z-[4] bg-[repeating-linear-gradient(45deg,color-mix(in_srgb,var(--warn)_65%,transparent)_0_4px,transparent_4px_8px)]" style={{ left: p - gMax + "%", width: gMax - gMin + "%" }} />}
        {/* Ghost damage preview: solid band (damage taken in every roll). */}
        {ghost && gMin > 0 && <i className="absolute bottom-0 top-0 z-[5] bg-[color-mix(in_srgb,var(--bad)_75%,transparent)]" style={{ left: Math.max(0, p - gMin) + "%", width: Math.min(gMin, p) + "%" }} />}
      </div>
    </div>
  )
}

/**
 * The per-event damage/heal labels and the multi-hit count, for the row
 * directly under the bar.
 *
 * Every label is keyed by its INDEX IN `ledger.events`, so what is on screen
 * is a function of the ledger and nothing else — no timer schedules them, no
 * timer removes them. They rise into place on mount (a CSS animation, which
 * cannot change what is rendered) and then stay until the next `|turn|`
 * clears the entry, which is the same moment the coloured band goes.
 *
 * Separate from {@link BxHp} because the bar is clipped to a chamfer and
 * these must not be: a label drawn inside it would be sliced by the same
 * `clip-path` that gives the bar its shape.
 */
export function BxHpDeltas({ ledger, compact = false }: { ledger?: LedgerEntry | null; compact?: boolean }) {
  const t = useToolT(BATTLESIM_NS)
  const seg = hpSegments(ledger?.maxhp ? (ledger.hp / ledger.maxhp) * 100 : 0, ledger)
  if (!seg.deltas.length && seg.hits < 2) return null
  return (
    <>
      {seg.hits > 1 && (
        <b title={t("battle.hp.hits", { n: seg.hits })}
          className="flex-none border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft px-[0.25rem] py-[2px] font-mono text-[0.53125rem] font-bold not-italic leading-none tracking-[0.04em] text-bad">
          ×{seg.hits}
        </b>
      )}
      {seg.deltas.map((d) => (
        <b key={d.i} style={{ animationDelay: `${Math.min(d.i, 6) * 70}ms` }}
          className={cn("flex-none animate-[bm-hprise_260ms_ease-out_both] font-mono font-bold not-italic leading-none tracking-[0.02em] motion-reduce:animate-none [font-variant-numeric:tabular-nums]",
            compact ? "text-[0.53125rem]" : "text-[0.59375rem]",
            d.kind === "damage" ? "text-bad" : "text-ok")}>
          {d.kind === "damage" ? "−" : "+"}{d.pct}%
        </b>
      ))}
    </>
  )
}

/* ── Field plate (combatant HUD) ─────────────────────────────────────────── */
export type BxGhost = { min: number; max: number; ko?: { t: string; cls: "sure" | "maybe" } | null } | null
export function BxPlate({ mon, slotTag, foe = false, ghost = null, ledger = null, active = false, targetable = false, aimed = false, hit = false, onClick, compact = false, exact, targetLabel, onDetails, detailsLabel }: {
  mon: BxMon | null; slotTag?: string; foe?: boolean; ghost?: BxGhost; active?: boolean; targetable?: boolean; aimed?: boolean; hit?: boolean; onClick?: () => void; compact?: boolean
  /**
   * This turn's ledger entry for `mon` — `session.ledger?.get(pokemon)`.
   *
   * Optional, and the plate is correct without it (it simply draws no "this
   * turn" bands). It is not optional for a live battle: it is the ONLY source
   * for what the turn took, and the bar will not guess in its absence.
   */
  ledger?: LedgerEntry | null
  /** Show `cur/max` instead of a percent. Defaults to "own side and known". */
  exact?: boolean
  /** Accessible name while targetable. */
  targetLabel?: string
  /** Opens the details popover (the plate body becomes a button when set). */
  onDetails?: () => void
  detailsLabel?: string
}) {
  const t = useToolT(BATTLESIM_NS)
  if (!mon) return null
  const pct = mon.fnt ? 0 : mon.hp
  const band = hpBand(pct)
  const showExact = exact ?? (!foe && mon.hpCur != null && mon.hpMax != null)
  const boosts = Object.entries((mon.boosts || {}) as Record<string, number>).filter(([, v]) => v)
  const types = mon.tera && mon.teraType ? [mon.teraType] : mon.types
  const clickable = targetable || !!onDetails
  const Tag = (clickable ? "button" : "div") as "button"
  // Identity, not slot: the plate component is keyed by POSITION on the field,
  // so the same instance survives a switch. Everything with memory below hangs
  // off this instead.
  const monKey = mon.searchid ?? mon.id
  const gender = GENDER_GLYPH[mon.gender ?? ""]
  const volatiles = shownVolatiles(mon.volatiles ?? (mon.protect ? ["protect"] : []))
  const perish = perishCount(mon.volatiles)
  // The readout, in one place: the numerals row uses it when there is room for
  // one, and the name row uses it in `compact`, where there is not.
  const readout = (
    <span aria-label={hpAriaLabel(t, mon, pct, showExact)}
      className={cn("inline-flex flex-none items-baseline justify-end gap-[3px] leading-none", showExact ? "min-w-[7ch]" : "min-w-[4.5ch]")}
      style={{ ...BX_PLATE_VOICE, color: mon.fnt ? "var(--muted)" : hpTone(pct) }}>
      {!mon.fnt && band !== "ok" && <i aria-hidden className="self-center not-italic text-[0.625rem]">▼</i>}
      {/* Current big, maximum small — the number that changes is the one
          worth reading at a glance, and it is how Champions sets it. */}
      <b style={{ fontSize: compact ? "15px" : "21px" }}>{mon.fnt ? t("battle.end.ko") : showExact ? mon.hpCur : pct}</b>
      {!mon.fnt && (
        <span className="opacity-70" style={{ fontSize: compact ? "10px" : "12px" }}>{showExact ? `/${mon.hpMax}` : "%"}</span>
      )}
    </span>
  )
  return (
    <Tag
      type={clickable ? "button" : undefined}
      onClick={clickable ? (targetable ? onClick : onDetails) : undefined}
      aria-label={clickable ? (targetable ? targetLabel ?? mon.name : detailsLabel ?? mon.name) : undefined}
      style={{ ...tyc(tyColor(mon.tera && mon.teraType ? mon.teraType : mon.types[0])) }}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,0.625rem)] [--cut-line:var(--line)]", "relative flex w-full min-w-0 items-center gap-[0.5625rem] border border-solid border-line border-l-[3px] border-l-[var(--tyc)] bg-[color-mix(in_srgb,var(--panel)_88%,transparent)] px-[0.625rem] py-[0.4375rem] pl-2 text-left text-txt backdrop-blur-[4px] transition-[border-color,background,transform] duration-[140ms]",
        compact ? "gap-[0.4375rem] px-2 py-[0.3125rem]" : "",
        mon.fnt && "opacity-55 saturate-[0.2]",
        active && "border-accent-line [--cut-line:var(--accent-line)]",
        (ghost || aimed) && "border-[color-mix(in_srgb,var(--warn)_55%,transparent)] [--cut-line:color-mix(in_srgb,var(--warn)_55%,transparent)]",
        aimed && !ghost && "bg-[color-mix(in_srgb,var(--warn)_10%,var(--panel))] animate-[bm-pulse_1.4s_ease-in-out_infinite] motion-reduce:animate-none",
        hit && "animate-[bm-hitflash_0.5s_ease] motion-reduce:animate-none",
        clickable && cn(BSIM_FOCUS_CUT, FOCUS_RING, PRESS),
        targetable && "cursor-crosshair border-warn [--cut-line:var(--warn)] hover:-translate-x-[2px] hover:bg-panel-2 motion-reduce:hover:translate-x-0",
        !targetable && onDetails && "cursor-help hover:border-line-2",
      )}>
      <span className="relative flex-none">
        <BxSprite mon={mon} size={compact ? 30 : 40} />
        {mon.fnt && <b className="absolute inset-0 grid place-items-center font-display text-[0.75rem] font-extrabold leading-none tracking-[0.06em] text-bad">{t("battle.end.ko")}</b>}
      </span>
      {/* The reading order is the reference's: WHO, then the bar, then the
          number, then everything else. The status pill rides the name row
          rather than the chip row so it is never pushed to a second line by a
          long species name — it is the fact that changes the turn.

          `compact` folds the numerals back onto the name row. That plate is an
          overlay on the field itself, where every row of height is board a
          player cannot see, and the number is legible there because it is the
          only thing competing with the name. */}
      <span className="grid min-w-0 flex-1 gap-[0.3125rem]">
        <span className="flex min-w-0 items-center gap-[0.375rem]">
          {slotTag && <b className={cn("flex-none border border-solid px-[0.3125rem] py-[2px] font-mono text-[0.5rem] font-bold not-italic leading-none tracking-[0.1em]", foe ? "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad" : "border-accent-line bg-accent-soft text-accent-bright")}>{slotTag}</b>}
          {mon.tera && mon.teraType && <BxTera type={mon.teraType} size=".78em" />}
          {/* The name carries the plate voice too — it is the half of the
              Champions nameplate the eye actually reads as "that game". */}
          <span className={cn("min-w-0 truncate leading-none", compact ? "text-[0.78125rem]" : "text-[0.90625rem]")} style={BX_PLATE_VOICE}>{mon.name}</span>
          {gender && <i aria-hidden title={mon.gender} className={cn("flex-none not-italic leading-none", compact ? "text-[0.65625rem]" : "text-[0.71875rem]", mon.gender === "F" ? "text-[#f95587]" : "text-[#6390f0]")}>{gender}</i>}
          {!compact && mon.level != null && (
            <span className="flex-none font-mono text-[0.5625rem] font-semibold not-italic leading-none tracking-[0.04em] text-txt-dim [font-variant-numeric:tabular-nums]">{t("battle.mon.level", { level: mon.level })}</span>
          )}
          <span className="ml-auto flex flex-none items-center gap-[0.375rem]">
            <BxStatus status={mon.status} />
            {compact && readout}
          </span>
        </span>

        <BxHp pct={pct} ghost={ghost} ledger={ledger} monKey={monKey} ko={!!mon.fnt} />

        {/* Numerals row. The deltas sit on the LEFT of it because they are read
            against the bar above them, and the running total sits on the right
            where it has never moved. Fixed minimum widths in `ch` on both ends:
            during a fast turn the numbers change every frame and a row that
            re-measured itself would make the whole plate twitch. */}
        {!compact && (
          <span className="flex min-h-[1.375rem] min-w-0 items-center gap-[0.3125rem]">
            {ghost ? (
              <span className="flex min-w-0 items-center gap-[0.375rem] font-mono text-[0.6875rem] font-bold leading-none text-warn">
                <Icon name="target" size={11} /><b>−{ghost.min}–{ghost.max}%</b>
                {ghost.ko && <i className={cn("px-[0.3125rem] py-[3px] font-mono text-[0.5625rem] font-bold not-italic uppercase leading-none tracking-[0.06em] text-accent-ink", ghost.ko.cls === "sure" ? "bg-bad" : "bg-warn")}>{ghost.ko.t}</i>}
              </span>
            ) : (
              <BxHpDeltas ledger={ledger} />
            )}
            {!mon.fnt && band === "critical" && (
              <b className="flex-none bg-bad px-[0.3125rem] py-[3px] font-mono text-[0.53125rem] font-bold uppercase leading-none tracking-[0.08em] text-accent-ink">{t("battle.hp.critical")}</b>
            )}
            <span className="ml-auto">{readout}</span>
          </span>
        )}

        {compact && ghost && (
          <span className="flex min-h-[1rem] items-center gap-[0.375rem] font-mono text-[0.6875rem] font-bold leading-none text-warn">
            <Icon name="target" size={11} /><b>−{ghost.min}–{ghost.max}%</b>
            {ghost.ko && <i className={cn("px-[0.3125rem] py-[3px] font-mono text-[0.5625rem] font-bold not-italic uppercase leading-none tracking-[0.06em] text-accent-ink", ghost.ko.cls === "sure" ? "bg-bad" : "bg-warn")}>{ghost.ko.t}</i>}
          </span>
        )}

        {!ghost && (
          <span className="flex min-h-[1rem] flex-wrap items-center gap-[0.3125rem]">
            {compact && <BxHpDeltas ledger={ledger} compact />}
            {compact && !mon.fnt && band === "critical" && <b className="bg-bad px-[0.3125rem] py-[3px] font-mono text-[0.53125rem] font-bold uppercase leading-none tracking-[0.08em] text-accent-ink">{t("battle.hp.critical")}</b>}
            <BxTypeRow types={types} small />
            <BxVolatiles ids={volatiles} perish={perish} />
            {boosts.map(([s, v]) => <BxBoost key={s} stat={s} value={v} />)}
          </span>
        )}

        {!compact && !ghost && <BxMeta mon={mon} />}
      </span>
    </Tag>
  )
}

/* ── Move key ────────────────────────────────────────────────────────────── */
export function BxKey({ move, hotkey, target = null, selected = false, disabled = false, tera = false, reason, onClick, onHover, onLeave }: {
  move: BxMove; hotkey?: string | number; target?: BxMon | null; selected?: boolean; disabled?: boolean; tera?: boolean
  /** Why the key is off ("Sin PP", "Bloqueado") — shown as a chip and as the title. */
  reason?: string
  onClick?: () => void; onHover?: () => void; onLeave?: () => void
}) {
  const t = useToolT(BATTLESIM_NS)
  const L = useBxLabels()
  const noPp = move.pp <= 0
  const off = disabled || noPp
  const why = reason ?? (noPp ? t("battle.dock.noPp") : disabled ? t("battle.dock.locked") : undefined)
  const eff = move.cat !== "status" && target ? effTag(effMult(move.type, target.tera && target.teraType ? [target.teraType] : target.types)) : null
  return (
    <button type="button" disabled={off} onClick={off ? undefined : onClick} title={why} aria-pressed={selected || undefined}
      onMouseEnter={onHover} onMouseLeave={onLeave} onFocus={onHover} onBlur={onLeave}
      style={{ ...tyc(tyColor(move.type)) }}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,0.625rem)] [--cut-line:var(--line)]", BSIM_FOCUS_CUT, FOCUS_RING, "relative flex min-h-[3.25rem] w-full min-w-0 items-center gap-[0.5625rem] border border-solid border-line border-l-[3px] border-l-[var(--tyc)] bg-panel px-[0.625rem] py-2 text-left text-txt transition-[background,border-color,transform] duration-[140ms]",
        "hover:-translate-y-px hover:border-[color-mix(in_srgb,var(--tyc)_55%,var(--line))] hover:bg-panel-2 motion-reduce:hover:translate-y-0 active:translate-y-px motion-reduce:active:translate-y-0",
        selected && "border-accent [--cut-line:var(--accent)] bg-accent-soft",
        off && "cursor-not-allowed opacity-50 hover:translate-y-0 hover:border-line hover:bg-panel",
      )}>
      {hotkey != null && <BxKbd>{hotkey}</BxKbd>}
      <span className="grid min-w-0 flex-1 gap-[0.3125rem]">
        <span className="flex items-center gap-[0.375rem] font-display text-[0.8125rem] font-bold uppercase leading-[1.05] tracking-[0.03em]">
          <span className="min-w-0 truncate">{move.name}</span>
          {tera && <b className="flex-none border border-solid border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-[3px] py-px font-mono text-[0.46875rem] not-italic tracking-[0.08em] text-accent-bright">TERA</b>}
        </span>
        <span className="flex flex-wrap items-center gap-[0.4375rem]">
          <BxType type={move.type} small /><BxCat cat={move.cat} />
          {move.spread && <i className="border border-dashed border-line-2 px-1 py-[2px] font-mono text-[0.53125rem] font-semibold not-italic leading-none tracking-[0.08em] text-txt-dim">{move.spread === "all" ? t("bx.spreadAllTag") : t("bx.spreadTag")}</i>}
          {(move.prio ?? 0) > 0 && <i className="border border-dashed border-[color-mix(in_srgb,var(--ok)_45%,transparent)] px-1 py-[2px] font-mono text-[0.53125rem] font-semibold not-italic leading-none tracking-[0.08em] text-ok">+{move.prio}</i>}
          {why && <i className="border border-solid border-[color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft px-1 py-[2px] font-mono text-[0.53125rem] font-bold not-italic uppercase leading-none tracking-[0.08em] text-bad">{why}</i>}
        </span>
      </span>
      <span className="grid flex-none justify-items-end gap-1">
        {eff && <b className={cn("px-[0.3125rem] py-[3px] font-mono text-[0.53125rem] font-bold uppercase leading-none tracking-[0.06em]",
          eff.cls === "super" ? "bg-ok text-accent-ink" : eff.cls === "immune" ? "bg-txt-dim text-accent-ink" : "border border-solid border-line-2 bg-panel-2 text-txt-muted")}>{L.eff(eff.key)}</b>}
        <span className="inline-flex items-center gap-[0.3125rem] font-mono text-[0.59375rem] font-semibold leading-none text-txt-dim">
          <i className="h-1 w-[1.875rem] overflow-hidden border border-solid border-line bg-base"><b className="block h-full bg-accent" style={{ width: (move.pp / Math.max(1, move.maxpp)) * 100 + "%" }} /></i>
          {move.pp}/{move.maxpp}
        </span>
      </span>
    </button>
  )
}

/* ── Bench chip ──────────────────────────────────────────────────────────── */
export function BxBench({ mon, hotkey, disabled = false, reserved = false, reason, onClick }: {
  mon: BxMon; hotkey?: string | number; disabled?: boolean; reserved?: boolean; reason?: string; onClick?: () => void
}) {
  const t = useToolT(BATTLESIM_NS)
  const pct = mon.fnt ? 0 : mon.hp
  const off = disabled || !!mon.fnt
  const why = reason ?? (mon.fnt ? t("battle.dock.fainted") : undefined)
  return (
    <button type="button" disabled={off} onClick={onClick} title={why} aria-pressed={reserved || undefined}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,0.625rem)] [--cut-line:var(--line)]", BSIM_FOCUS_CUT, FOCUS_RING, PRESS, "flex min-h-[3.25rem] w-full min-w-0 items-center gap-[0.5625rem] border border-solid border-line bg-panel px-[0.625rem] py-[0.4375rem] text-left text-txt transition-[background,border-color,transform] duration-[140ms]",
        "hover:border-accent-line hover:bg-panel-2 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:bg-panel",
        // KO and "currently on the field" are the two states a player scans
        // this row for, and neither was legible: a fainted card was merely
        // dimmer than a disabled one, and the active mon looked like any other
        // card you happen not to be allowed to pick.
        mon.fnt && "border-[color-mix(in_srgb,var(--bad)_40%,var(--line))] [--cut-line:color-mix(in_srgb,var(--bad)_40%,var(--line))] opacity-55 saturate-[0.2]",
        off && !mon.fnt && "opacity-60",
        mon.active && !mon.fnt && "border-accent [--cut-line:var(--accent)] [box-shadow:inset_0_0_0_1px_color-mix(in_srgb,var(--accent)_45%,transparent)]",
        reserved && "border-accent-line [--cut-line:var(--accent-line)] bg-accent-soft")}>
      {hotkey != null && <BxKbd>{hotkey}</BxKbd>}
      <span className="relative flex-none">
        <BxSprite mon={mon} size={34} />
        {mon.fnt && <b className="absolute inset-0 grid place-items-center font-display text-[0.6875rem] font-extrabold leading-none tracking-[0.06em] text-bad">{t("battle.end.ko")}</b>}
      </span>
      <span className="grid min-w-0 flex-1 gap-1">
        {/* THE HP READOUT SITS ON THE NAME ROW, NOT BESIDE THE BAR.
            These cards go six across a dock band, which leaves each one about
            90px of text column — and a bar sharing that row with "260/260" got
            roughly 45px of it, too short to read a fill against and too short
            to tell 100% from 60%. The number is a fixed width and the bar is
            the elastic part, so the number moves up to the row that already
            truncates and the bar takes the full width underneath. */}
        <span className="flex min-w-0 items-center gap-[0.375rem] font-display text-[0.78125rem] font-bold uppercase leading-none tracking-[0.03em]">
          <span className="min-w-0 truncate">{mon.name}</span><BxStatus status={mon.status} />
          {reserved && <i className="flex-none font-mono text-[0.5rem] font-bold not-italic leading-none tracking-[0.1em] text-accent-bright">{t("bx.chosen")}</i>}
          {why && !mon.fnt && <i className="flex-none border border-solid border-line-2 px-1 py-[2px] font-mono text-[0.5rem] font-semibold not-italic uppercase leading-none tracking-[0.08em] text-txt-dim">{why}</i>}
          <span aria-label={hpAriaLabel(t, mon, pct, true)} className="ml-auto flex-none leading-none" style={{ ...BX_PLATE_VOICE, color: mon.fnt ? "var(--muted)" : hpTone(pct), fontSize: "11px" }}>{mon.fnt ? t("battle.end.ko") : mon.hpCur != null && mon.hpMax != null ? `${mon.hpCur}/${mon.hpMax}` : pct + "%"}</span>
        </span>
        {/* `BxHp`, not a bar of its own. The hand-rolled one here carried the
            same `color-mix(… 110%, …)` that BxHp documents above: a percentage
            over 100 does not clamp, it fails to parse, and the whole
            `background` shorthand goes with it — so every bench bar rendered as
            an empty outline no matter the HP, at full health included. One bar
            implementation means that fix cannot be missed twice. */}
        <BxHp pct={pct} monKey={mon.searchid ?? mon.id} ko={!!mon.fnt} />
        <BxTypeRow types={mon.types} small />
      </span>
    </button>
  )
}

/* ── Mechanic buttons (tera + the others share one shape) ────────────────── */
const MECH_BTN = cn("cut cut-edge-slant [--cut-line:var(--line-2)] [--cut:4px]", BSIM_FOCUS_CUT, FOCUS_RING, PRESS, "inline-flex h-8 items-center gap-2 border border-solid border-line-2 bg-panel px-3 font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.06em] text-txt-muted transition-[border-color,color,background] duration-[140ms]",
  "hover:border-[color-mix(in_srgb,var(--tyc)_60%,transparent)] hover:text-txt disabled:cursor-not-allowed disabled:opacity-45")
const MECH_ARMED = "border-[var(--tyc)] [--cut-line:var(--tyc)] text-txt [background:color-mix(in_srgb,var(--tyc)_14%,var(--panel))]"

export function BxTeraBtn({ type, armed = false, used = false, onToggle, hotkey }: {
  type: string; armed?: boolean; used?: boolean; onToggle?: () => void; hotkey?: string | number
}) {
  const t = useToolT(BATTLESIM_NS)
  const L = useBxLabels()
  return (
    <button type="button" disabled={used} onClick={onToggle} style={{ ...tyc(tyColor(type)) }} aria-pressed={armed}
      title={used ? t("bx.teraUsedTitle") : t("bx.teraArmTitle")}
      className={cn(MECH_BTN, armed && MECH_ARMED)}>
      {hotkey != null && <BxKbd>{hotkey}</BxKbd>}
      <BxTera type={type} size="1.02em" />
      <span>{used ? t("bx.teraUsedLabel") : armed ? t("bx.teraArmedLabel", { type: L.type(type) }) : t("bx.teraLabel", { type: L.type(type) })}</span>
    </button>
  )
}

export function BxMechBtn({ glyph, tone, label, hint, armed = false, used = false, onToggle, hotkey }: {
  glyph: string; tone: string; label: string; hint: string; armed?: boolean; used?: boolean; onToggle?: () => void; hotkey?: string | number
}) {
  return (
    <button type="button" disabled={used} onClick={onToggle} style={{ ...tyc(tone) }} aria-pressed={armed} title={hint}
      className={cn(MECH_BTN, armed && MECH_ARMED)}>
      {hotkey != null && <BxKbd>{hotkey}</BxKbd>}
      <span aria-hidden className="[color:var(--tyc)]">{glyph}</span>
      <span>{label}{armed ? " ✓" : ""}</span>
    </button>
  )
}

/* ── Turn ring ───────────────────────────────────────────────────────────── */
export function BxRing({ sec, max = 45, size = 50, label }: { sec: number; max?: number; size?: number; label?: string }) {
  const t = useToolT(BATTLESIM_NS)
  const r = (size - 6) / 2, c = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, sec / max))
  const low = sec <= 10
  // Announce only at the thresholds: a polite region that changed every
  // second would be read every second.
  const announce = sec === 30 || sec === 10 || sec === 5 ? t("bx.timerAria", { sec }) : ""
  return (
    <span role="status" aria-label={label ?? t("bx.timerAria", { sec })} className="relative inline-grid flex-none place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={low ? "var(--bad)" : "var(--accent)"} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - frac)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="motion-reduce:[transition:none]" style={{ transition: "stroke-dashoffset 1s linear, stroke .3s" }} />
      </svg>
      <b aria-hidden className={cn("font-mono font-bold leading-none", size < 40 ? "text-[0.6875rem]" : "text-[0.8125rem]", low && "animate-[bm-blink_1s_steps(2)_infinite] text-bad motion-reduce:animate-none")}>{sec}</b>
      <span className="sr-only" aria-live="polite">{announce}</span>
    </span>
  )
}

/* ── Log tick + region ───────────────────────────────────────────────────── */
export function BxTick({ ev }: { ev: BxTickEv }) {
  const t = useToolT(BATTLESIM_NS)
  if (ev.turn != null) {
    return (
      <div className="flex items-center gap-[0.625rem] pb-1 pt-[0.625rem]">
        <span className="flex-none font-mono text-[0.6875rem] font-extrabold leading-none tracking-[0.14em] text-accent-bright">T{ev.turn}</span>
        <i className="h-px flex-1 bg-[linear-gradient(90deg,var(--accent-line),transparent)]" />
      </div>
    )
  }
  if (ev.kind === "sys") {
    return (
      <div className="border-l-2 border-solid border-line-2 py-[0.3125rem] pl-[0.625rem] pr-2">
        <span className="font-body text-[0.78125rem] italic leading-[1.45] text-txt-dim" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ev.txt || "") }} />
      </div>
    )
  }
  const c = ev.type ? tyColor(ev.type) : ev.kind === "boost" ? "var(--ok)" : "var(--accent)"
  return (
    <div style={tyc(c)} className={cn("relative flex min-w-0 items-baseline gap-2 border-l-2 border-solid border-l-[var(--tyc)] bg-[color-mix(in_srgb,var(--panel)_70%,transparent)] py-[0.3125rem] pl-[0.625rem] pr-2",
      ev.who === "foe" && "border-l-[color-mix(in_srgb,var(--tyc)_70%,var(--bad))]", ev.crit && "bg-[color-mix(in_srgb,var(--warn)_8%,var(--panel))]")}>
      <span className="min-w-0 font-body text-[0.78125rem] leading-[1.45] text-txt-muted [&_b]:font-semibold [&_b]:text-txt" dangerouslySetInnerHTML={{ __html: sanitizeHtml(ev.txt || "") }} />
      {(ev.dmg || ev.eff) && (
        <span className="ml-auto inline-flex flex-none gap-1">
          {ev.dmg && <b className="bg-bad-soft px-1 py-[3px] font-mono text-[0.625rem] font-bold leading-none text-bad">{ev.dmg}</b>}
          {ev.eff === "super" && <b className="font-mono text-[0.53125rem] font-bold leading-[1.2] tracking-[0.06em] text-ok">{t("bx.effective")}</b>}
          {ev.eff === "weak" && <b className="font-mono text-[0.53125rem] font-semibold leading-[1.2] text-txt-dim">{t("bx.resisted")}</b>}
        </span>
      )}
    </div>
  )
}

export type BxLogFilter = "all" | "damage" | "switches" | "field"
export const VISIBLE_TICK_LIMIT = 50
export const REPLAY_TICK_LIMIT = 200

function matchesFilter(ev: BxTickEv, filter: BxLogFilter): boolean {
  if (filter === "all") return true
  if (filter === "damage") return ev.kind === "ko" || !!ev.dmg || !!ev.eff || !!ev.crit
  if (filter === "switches") return ev.kind === "switch"
  if (filter === "field") return ev.kind === "field"
  return true
}
interface TurnGroup { turn: number; events: BxTickEv[] }
function groupByTurn(ticks: BxTickEv[]): TurnGroup[] {
  const groups: TurnGroup[] = []
  let current: TurnGroup = { turn: 0, events: [] }
  for (const ev of ticks) {
    if (ev.turn != null) {
      if (current.events.length > 0 || current.turn > 0) groups.push(current)
      current = { turn: ev.turn, events: [] }
    } else {
      current.events.push(ev)
    }
  }
  groups.push(current)
  return groups.filter((g) => g.events.length > 0 || g.turn > 0)
}
const stripHtml = (s: string) => s.replace(/<[^>]+>/g, "")

/**
 * The battle log: filters, collapsible turns, autoscroll pinned to the bottom
 * only while the reader is at the bottom, and a polite region that carries
 * the newest line alone (the whole log used to be `aria-live`, so changing
 * a filter re-read everything).
 */
export function BxLog({ log, className, filters = true, limit = VISIBLE_TICK_LIMIT, activeTurn, maxHeight }: {
  log: BxTickEv[]; className?: string; filters?: boolean; limit?: number
  /** Replay integration: highlights and scrolls to this turn group. */
  activeTurn?: number
  maxHeight?: number | string
}) {
  const t = useToolT(BATTLESIM_NS)
  const ref = React.useRef<HTMLDivElement>(null)
  const pinned = React.useRef(true)
  const [showAll, setShowAll] = React.useState(false)
  const [filter, setFilter] = React.useState<BxLogFilter>("all")
  const [collapsed, setCollapsed] = React.useState<Set<number>>(() => new Set())

  const groups = React.useMemo(() => {
    const windowed = showAll ? log : log.slice(-limit)
    const filtered = filter === "all" ? windowed : windowed.filter((ev) => ev.turn != null || matchesFilter(ev, filter))
    return groupByTurn(filtered)
  }, [log, showAll, limit, filter])
  const latestTurn = groups.length > 0 ? groups[groups.length - 1].turn : 0

  React.useEffect(() => {
    const el = ref.current
    if (el && pinned.current && activeTurn == null) el.scrollTop = el.scrollHeight
  }, [log.length, activeTurn, filter])
  React.useEffect(() => {
    if (activeTurn != null && ref.current) {
      const el = ref.current.querySelector<HTMLElement>(`[data-turn="${activeTurn}"]`)
      el?.scrollIntoView({ block: "start", behavior: "smooth" })
    }
  }, [activeTurn])
  const onScroll = () => {
    const el = ref.current
    if (el) pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 40
  }
  const toggleTurn = (turn: number) => setCollapsed((prev) => { const n = new Set(prev); if (n.has(turn)) n.delete(turn); else n.add(turn); return n })
  const collapsePrevious = () => setCollapsed(new Set(groups.filter((g) => g.turn !== latestTurn).map((g) => g.turn)))

  const last = log.length ? log[log.length - 1] : null
  const latestText = last?.txt ? stripHtml(last.txt) : ""

  return (
    <div className={cn("flex min-h-0 flex-col bg-panel", className)} style={maxHeight != null ? { maxHeight } : undefined}>
      {filters && (
        <div className="flex shrink-0 items-center gap-2 border-b border-solid border-line bg-base p-2">
          <DkSeg size="sm" value={filter} ariaLabel={t("log.label")} onChange={(v) => setFilter(v as BxLogFilter)}
            options={[
              { value: "all", label: t("log.filterAll") }, { value: "damage", label: t("log.filterDamage") },
              { value: "switches", label: t("log.filterSwitches") }, { value: "field", label: t("log.filterField") },
            ]} />
          {groups.length > 1 && (
            <button type="button" onClick={collapsePrevious} title={t("log.collapsePrevious")}
              className={cn(BSIM_FOCUS, "ml-auto h-8 border border-solid border-line-2 bg-panel px-2 font-mono text-[0.625rem] uppercase leading-none tracking-[0.06em] text-txt-dim transition-colors duration-[140ms] hover:text-txt")}>
              {t("log.collapsePrevious")}
            </button>
          )}
        </div>
      )}
      {log.length > limit && !showAll && (
        <button type="button" onClick={() => setShowAll(true)}
          className={cn(BSIM_FOCUS, "w-full shrink-0 border-b border-solid border-line bg-base py-[0.375rem] font-mono text-[0.65625rem] text-txt-muted transition-colors duration-[140ms] hover:text-txt")}>
          {t("log.showAll", { count: log.length })}
        </button>
      )}
      <div ref={ref} role="log" aria-label={t("bx.logAria")} onScroll={onScroll}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        {groups.map((group) => {
          const isCollapsed = collapsed.has(group.turn) && group.turn !== latestTurn && activeTurn !== group.turn
          const isActive = activeTurn === group.turn
          return (
            <div key={group.turn} data-turn={group.turn} className="flex flex-col gap-1">
              {group.turn > 0 && (
                <button type="button" onClick={() => toggleTurn(group.turn)} aria-expanded={!isCollapsed}
                  aria-label={isCollapsed ? t("battle.log.expand", { turn: group.turn }) : t("battle.log.collapse", { turn: group.turn })}
                  className={cn(BSIM_FOCUS, "sticky top-0 z-[1] flex min-h-8 w-full items-center gap-[0.625rem] bg-panel pb-[3px] pt-[0.4375rem] text-left font-mono text-[0.6875rem] font-extrabold leading-none tracking-[0.14em] focus-visible:outline-offset-[-3px]", isActive ? "text-txt" : "text-accent-bright")}>
                  <span aria-hidden>{isCollapsed ? "▸" : "▾"}</span>
                  <span>T{group.turn}</span>
                  {isCollapsed && <span className="font-normal text-txt-dim">{t("log.events", { count: group.events.length })}</span>}
                  <i className="h-px flex-1 bg-[linear-gradient(90deg,var(--accent-line),transparent)]" />
                </button>
              )}
              {!isCollapsed && group.events.map((ev, i) => <BxTick key={`${group.turn}-${i}`} ev={ev} />)}
            </div>
          )
        })}
        {groups.length === 0 && <p className="py-4 text-center font-mono text-[0.6875rem] text-txt-dim">{t("log.empty")}</p>}
      </div>
      <span className="sr-only" aria-live="polite" aria-label={t("battle.log.latest")}>{latestText}</span>
    </div>
  )
}

/* ── Scoreboard plate ────────────────────────────────────────────────────── */
export function BxScore({ name, handle, rating, av, team = [], right = false, tag, foe, compact = false }: {
  name: string; handle?: string; rating?: string | number; av: string; team?: BxTeamHP[]; right?: boolean; tag?: string
  /** Foe tone (defaults to `right`). */
  foe?: boolean
  /** One line: avatar, name, dots. */
  compact?: boolean
}) {
  const t = useToolT(BATTLESIM_NS)
  const isFoe = foe ?? right
  const alive = team.filter((m) => !m.fnt).length
  return (
    <div className={cn("flex min-w-0 items-center gap-[0.625rem]", right && "flex-row-reverse text-right", compact && "gap-2")}>
      <span
        className={cn("cut-tag cut-tag-edge [--cut-tag:8px] ", "grid flex-none place-items-center border border-solid font-display font-extrabold leading-none tracking-[0.04em]", compact ? "h-8 w-8 text-[0.75rem]" : "h-9 w-9 text-[0.8125rem]",
          isFoe ? "border-[color-mix(in_srgb,var(--bad)_45%,transparent)] [--cut-line:color-mix(in_srgb,var(--bad)_45%,transparent)] bg-bad-soft text-bad" : "border-accent-line [--cut-line:var(--accent-line)] bg-accent-soft text-accent-bright")}>{av}</span>
      <span className="grid min-w-0 gap-[2px]">
        <b className={cn("flex min-w-0 items-center gap-[0.375rem] font-display font-bold uppercase leading-none tracking-[0.04em]", compact ? "text-[0.78125rem]" : "text-[0.90625rem]", right && "flex-row-reverse")}>
          <span className="min-w-0 truncate">{name}</span>{tag && <i className={cn("flex-none px-[0.3125rem] py-[2px] font-mono text-[0.5rem] font-bold not-italic uppercase leading-none tracking-[0.12em]", isFoe ? "bg-bad text-accent-ink" : "bg-accent text-accent-ink")}>{tag}</i>}
        </b>
        {!compact && (handle || rating != null) && <small className="truncate font-mono text-[0.625rem] font-medium leading-[1.2] tracking-[0.04em] text-txt-dim">{handle ? handle + (rating != null ? " · " : "") : ""}{rating}</small>}
      </span>
      {team.length > 0 && (
        <span className={cn("flex flex-none gap-1", right ? "ml-0 mr-1" : "ml-1")} title={t("battle.score.alive", { alive, total: team.length })}>
          {team.map((m, i) => <i key={i} aria-hidden className={cn("h-2 w-2 [clip-path:polygon(50%_0,100%_50%,50%_100%,0_50%)]", m.fnt ? "bg-line-2" : (m.hp ?? 100) < 35 ? "bg-warn" : "bg-ok")} />)}
          <span className="sr-only">{t("battle.score.alive", { alive, total: team.length })}</span>
        </span>
      )}
    </div>
  )
}

/* ── Projected speed order rail ──────────────────────────────────────────── */
export function BxOrder({ slots }: { slots: OrderSlot[] }) {
  const t = useToolT(BATTLESIM_NS)
  const order = speedOrder(slots)
  if (!order.length) return null
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-[0.625rem] py-[0.4375rem]">
      <span className="inline-flex flex-none items-center gap-[0.3125rem] font-mono text-[0.59375rem] font-semibold uppercase leading-none tracking-[0.12em] text-txt-dim">
        <Icon name="trending" size={12} />{t("bx.orderProjected")}
      </span>
      <span className="flex min-w-0 flex-wrap gap-[0.375rem]">
        {order.map((s, i) => (
          <span key={s.side + s.idx}
            className={cn("cut cut-edge-slant [--cut:4px] ", "inline-flex items-center gap-[0.375rem] border border-solid bg-panel py-[3px] pl-1 pr-2", s.side === "foe" ? "border-[color-mix(in_srgb,var(--bad)_30%,var(--line))]" : "border-line")}>
            <b className={cn("font-mono text-[0.59375rem] font-extrabold leading-none", s.side === "foe" ? "text-bad" : "text-accent-bright")}>{i + 1}</b>
            <BxSprite mon={s.mon} size={22} />
            <span className="whitespace-nowrap font-body text-[0.65625rem] font-semibold leading-none text-txt-muted">{s.mon.name}</span>
            <span className="font-mono text-[0.59375rem] font-semibold leading-none text-txt-dim">{s.spe}</span>
          </span>
        ))}
      </span>
      <span className="ml-auto flex-none font-mono text-[0.59375rem] leading-none text-txt-dim">{t("bx.priorityNote")}</span>
    </div>
  )
}

/* ── Field condition chip ────────────────────────────────────────────────── */
export function BxField({ icon = "sun", name, turns, tone, side }: { icon?: Parameters<typeof Icon>[0]["name"]; name: string; turns?: number | string; tone?: string; side?: "ally" | "foe" }) {
  const t = useToolT(BATTLESIM_NS)
  return (
    <span style={tone ? tyc(tone) : undefined} title={side ? `${side === "foe" ? t("battle.foe") : t("battle.you")} · ${name}` : name}
      className="inline-flex max-w-full items-center gap-[0.3125rem] whitespace-nowrap border border-solid border-[color-mix(in_srgb,var(--tyc,var(--line-2))_45%,transparent)] bg-[color-mix(in_srgb,var(--tyc,var(--panel))_10%,var(--panel))] px-2 py-1 font-mono text-[0.59375rem] font-semibold uppercase leading-none tracking-[0.06em] text-[var(--tyc,var(--muted))]">
      {side && <i aria-hidden className="not-italic">{side === "foe" ? "▲" : "▼"}</i>}
      {side && <span className="sr-only">{side === "foe" ? t("battle.foe") : t("battle.you")}</span>}
      <Icon name={icon} size={13} /><span className="truncate">{name}</span>{turns != null && <b className="font-mono text-[0.5625rem] font-bold leading-none opacity-75">{turns}</b>}
    </span>
  )
}

/* ── Win-probability spark ───────────────────────────────────────────────── */
export function BxSpark({ data, w = 220, h = 40 }: { data: number[]; w?: number; h?: number }) {
  const pts = data.length > 1 ? data : [50, ...data]
  const step = w / (pts.length - 1)
  const path = pts.map((v, i) => `${i === 0 ? "M" : "L"}${(i * step).toFixed(1)},${(h - (v / 100) * h).toFixed(1)}`).join(" ")
  const last = pts[pts.length - 1]
  return (
    <span className="flex w-full min-w-0 items-center gap-2">
      <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="min-w-0 flex-1">
        <line x1="0" y1={h / 2} x2={w} y2={h / 2} stroke="var(--line)" strokeDasharray="3 4" />
        <path d={`${path} L${w},${h} L0,${h} Z`} fill="var(--accent-soft)" stroke="none" />
        <path d={path} fill="none" stroke="var(--accent)" strokeWidth="2" />
      </svg>
      <b className="flex-none font-mono text-[0.8125rem] font-bold leading-none" style={{ color: last >= 50 ? "var(--ok)" : "var(--bad)" }}>{last}%</b>
    </span>
  )
}

/* ── Keyboard hint chip ──────────────────────────────────────────────────── */
export function BxKbd({ children }: { children: React.ReactNode }) {
  return <kbd className="grid h-[1.125rem] min-w-[1.125rem] flex-none place-items-center border border-solid border-line-2 bg-base px-1 font-mono text-[0.625rem] font-semibold not-italic leading-none text-txt-muted">{children}</kbd>
}
export function BxKbdHint({ k, label }: { k: React.ReactNode; label: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-[0.3125rem] font-mono text-[0.59375rem] font-medium leading-none tracking-[0.04em] text-txt-dim">
      <BxKbd>{k}</BxKbd>{label}
    </span>
  )
}

/* ── Plan chip (queued order) ────────────────────────────────────────────── */
const SLOTTAG = "flex-none border border-solid border-accent-line bg-accent-soft px-[0.3125rem] py-[3px] font-mono text-[0.5625rem] font-bold not-italic leading-none tracking-[0.08em] text-accent-bright"
export type BxPlanAction =
  | { kind: "move"; move: { name: string; type?: string }; target?: { spread?: string } | null; targetName?: string; tera?: boolean; mech?: string }
  | { kind: "switch"; toName: string }
  | { kind: "pass" }
  | null
export function BxPlan({ tag, action, onClear, hint, active = false, onSelect, selectLabel }: {
  tag: string; action: BxPlanAction; onClear?: () => void; hint?: string
  /** This slot is the one being ordered now. */
  active?: boolean
  /** Click the chip body to (re)order this slot. */
  onSelect?: () => void
  selectLabel?: string
}) {
  const t = useToolT(BATTLESIM_NS)
  const Body = (onSelect ? "button" : "span") as "button"
  const bodyProps = onSelect ? { type: "button" as const, onClick: onSelect, "aria-label": selectLabel, "aria-current": active ? ("step" as const) : undefined } : {}
  if (!action) {
    return (
      <div className={cn("cut cut-edge-slant [--cut-line:var(--line-2)] [--cut:4px] inline-flex min-h-8 min-w-0 items-center gap-[0.4375rem] border border-dashed border-line-2 bg-panel px-[0.5625rem]", active && "border-accent-line [--cut-line:var(--accent-line)] bg-accent-soft")}>
        <b className={SLOTTAG}>{tag}</b>
        <Body {...bodyProps} className={cn("min-w-0 truncate border-0 bg-transparent py-[0.6875rem] pl-0 pr-0 text-left font-mono text-[0.625rem] font-medium leading-none tracking-[0.04em]", active ? "text-accent-bright" : "text-txt-dim", onSelect && cn(BSIM_FOCUS, "focus-visible:outline-offset-[-1px]"))}>{hint || t("bx.noOrder")}</Body>
      </div>
    )
  }
  const isMove = action.kind === "move"
  const tgt = !isMove ? null : action.target && action.target.spread ? (action.target.spread === "all" ? t("bx.targetAll") : t("bx.targetBoth")) : action.targetName || ""
  return (
    <div style={{ ...tyc(isMove ? tyColor(action.move.type) : "var(--accent)") }}
      className={cn("cut cut-edge-slant [--cut:4px] inline-flex min-h-8 min-w-0 items-center gap-[0.4375rem] border border-solid border-[color-mix(in_srgb,var(--tyc)_45%,var(--line))] [--cut-line:color-mix(in_srgb,var(--tyc)_45%,var(--line))] bg-panel px-[0.5625rem]", active && "bg-accent-soft")}>
      <b className={SLOTTAG}>{tag}</b>
      <Body {...bodyProps} className={cn("min-w-0 truncate border-0 bg-transparent py-[0.5rem] pl-0 pr-0 text-left font-body text-[0.71875rem] leading-[1.2] text-txt-muted [&_b]:font-semibold [&_b]:text-txt", onSelect && cn(BSIM_FOCUS, "focus-visible:outline-offset-[-1px]"))}>
        {isMove ? (
          <>{(action.tera || action.mech) && <i className="mr-1 border border-solid border-[color-mix(in_srgb,var(--accent)_50%,transparent)] px-[3px] py-px font-mono text-[0.46875rem] not-italic uppercase tracking-[0.08em] text-accent-bright">{action.mech ?? "TERA"}</i>}<b>{action.move.name}</b>{tgt ? " → " + tgt : ""}</>
        ) : action.kind === "switch" ? (
          <>{t("bx.switchTo", { name: action.toName })}</>
        ) : (
          <>{t("battle.dock.pass")}</>
        )}
      </Body>
      {onClear && (
        <button type="button" onClick={onClear} aria-label={t("bx.clearOrderAria")} className={cn(BSIM_FOCUS, "grid h-6 w-6 flex-none place-items-center border-0 bg-transparent p-0 text-txt-dim transition-colors duration-[140ms] hover:text-bad")}>
          <Icon name="x" size={12} />
        </button>
      )}
    </div>
  )
}

/* ── Unrevealed slot ─────────────────────────────────────────────────────── */
/**
 * A team slot the viewer has no information about: the foe's unrevealed
 * Pokémon in team preview and on the end screen. Rendered rather than omitted
 * so both sides always show the same number of slots — "four unknowns" is
 * information, an empty column is not.
 */
export function BxUnknownSlot({ small = false }: { small?: boolean }) {
  const t = useToolT(BATTLESIM_NS)
  return (
    <span aria-label={t("battle.mon.unrevealed")}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,0.625rem)] [--cut-line:var(--line)]", "flex w-full min-w-0 items-center border border-dashed border-line bg-panel text-left opacity-60",
        small ? "gap-[0.4375rem] px-2 py-[0.375rem]" : "gap-[0.625rem] px-[0.625rem] py-2")}>
      <span aria-hidden className={cn("grid flex-none place-items-center border border-solid border-line-2 bg-base font-mono font-bold leading-none text-txt-dim", small ? "h-7 w-7 text-[0.75rem]" : "h-10 w-10 text-[0.9375rem]")}>?</span>
      <span className={cn("min-w-0 flex-1 truncate font-mono font-semibold uppercase leading-none tracking-[0.08em] text-txt-dim", small ? "text-[0.625rem]" : "text-[0.65625rem]")}>{t("battle.mon.unrevealed")}</span>
    </span>
  )
}

/* ── Team-builder / preview slot ─────────────────────────────────────────── */
export type BxSlotMon = { name: string; types: string[]; item?: string; species?: string }
export function BxSlot({ mon, order, selected = false, dim = false, onClick, aside, disabled = false, small = false, label }: {
  mon: (BxMon & { item?: string }) | BxSlotMon | null; order?: number; selected?: boolean; dim?: boolean; onClick?: () => void; aside?: React.ReactNode
  disabled?: boolean
  /** Chip size for end-screen rows. */
  small?: boolean
  /** Accessible name override (e.g. "Garchomp, titular 1"). */
  label?: string
}) {
  const t = useToolT(BATTLESIM_NS)
  const Tag = (onClick ? "button" : "div") as "button"
  if (!mon) {
    return (
      <button type="button" onClick={onClick} disabled={disabled}
        className={cn("cut-tag cut-tag-edge hover:[--cut-line:var(--accent-line)] [--cut-tag:var(--cut,0.625rem)] [--cut-line:var(--line)]", BSIM_FOCUS_CUT, FOCUS_RING, PRESS, "flex min-h-[3.625rem] w-full items-center justify-center gap-2 border border-dashed border-line bg-panel px-[0.625rem] py-2 font-mono text-[0.65625rem] font-semibold uppercase leading-none tracking-[0.08em] text-txt-dim transition-[border-color,color] duration-[140ms] hover:border-accent-line hover:text-txt")}>
        <Icon name="plus" size={16} /><span>{t("bx.add")}</span>
      </button>
    )
  }
  return (
    <Tag type={onClick ? "button" : undefined} onClick={onClick} disabled={onClick ? disabled : undefined} aria-pressed={onClick ? selected : undefined} aria-label={label}
      className={cn("cut-tag cut-tag-edge [--cut-tag:var(--cut,0.625rem)] [--cut-line:var(--line)] ", "flex w-full min-w-0 items-center border border-solid border-line bg-panel text-left text-txt transition-[border-color,background] duration-[140ms]",
        small ? "gap-[0.4375rem] px-2 py-[0.375rem]" : "gap-[0.625rem] px-[0.625rem] py-2",
        onClick && cn(BSIM_FOCUS_CUT, FOCUS_RING, PRESS, "hover:border-accent-line hover:[--cut-line:var(--accent-line)] hover:bg-panel-2 disabled:cursor-not-allowed disabled:hover:border-line disabled:hover:bg-panel"),
        selected && "border-accent [--cut-line:var(--accent)] bg-accent-soft", dim && "opacity-55 saturate-[0.3]")}>
      {order != null && <b className={cn("grid flex-none place-items-center bg-accent font-mono font-extrabold leading-none text-accent-ink", small ? "h-4 min-w-4 px-1 text-[0.5625rem]" : "h-5 min-w-5 px-1 text-[0.6875rem]")}>{order}</b>}
      <BxSprite mon={mon as BxMon} size={small ? 28 : 40} />
      <span className="grid min-w-0 flex-1 gap-[3px]">
        <b className={cn("truncate font-display font-bold uppercase leading-none tracking-[0.03em]", small ? "text-[0.71875rem]" : "text-[0.8125rem]")}>{mon.name}</b>
        {!small && <BxTypeRow types={mon.types} small />}
        {!small && mon.item && <small className="font-mono text-[0.59375rem] leading-[1.2] text-txt-dim">{mon.item}</small>}
      </span>
      {aside}
    </Tag>
  )
}
