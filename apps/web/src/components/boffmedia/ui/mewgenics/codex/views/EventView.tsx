"use client"

import * as React from "react"
import { Icon, type IconName } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { MewText, MewPanel, MewNote } from "../../MewAtoms"
import { mewPortraitSrc } from "../../mew-art"
import { mewHuman, type MewEventOption, type MewEventReward } from "../../mew-util"
import { MewEffectVal, MewFlag, MewRef, type NavFn } from "../MewRefs"
import { select } from "../../mew-store"
import { MewDesc, MewDetail, MewHero, MewHeroMedia, MewSections, type ViewProps } from "./scaffold"
import { MewOptionChance, MewChanceReset, mewOptionOdds, mewTierPct, MEW_DEFAULT_STATS, type MewCatStats, type MewOptionOdds } from "./EventChance"
import { mewRewardLine, mewCounterShort, MEW_REWARD_HIDDEN, type MewRewardTone } from "./event-reward"

const MEW_STAT_ABBR_KEY: Record<string, string> = { str: "stat.str", dex: "stat.dex", con: "stat.con", int: "stat.int", spd: "stat.spd", cha: "stat.cha", lck: "stat.lck" }
function mewStatLabel(stat: string, t: (k: string) => string) { return MEW_STAT_ABBR_KEY[stat] ? t(MEW_STAT_ABBR_KEY[stat]) : mewHuman(stat) }

type Tx = (k: string, p?: Record<string, string | number>) => string

/** Requirement keys the game gates an option behind, rendered as plain prose. */
function mewReqText(k: string, v: unknown, t: Tx): string {
  const arr = Array.isArray(v) ? v : null
  if (k === "counter_maximum" && arr) return t("event.req.counterMax", { n: String(arr[1]) })
  if (k === "counter_minimum" && arr) return t("event.req.counterMin", { n: String(arr[1]) })
  if (k === "counter_range" && arr) return t("event.req.counterRange", { a: String(arr[1]), b: String(arr[2]) })
  if (k === "cat_has_item_slot_equipped") return t("event.req.slotEquipped", { slot: mewHuman(String(v)) })
  return mewHuman(k) + (v != null && typeof v !== "boolean" ? ": " + (arr ? arr.join(", ") : String(v)) : "")
}

const TONE_ICON: Record<MewRewardTone, IconName> = {
  gain: "plus", lose: "minus", hurt: "skull", heal: "heart", state: "sparkles", meta: "bookmark",
}
const TONE_CLS: Record<MewRewardTone, string> = {
  gain: "text-[color:var(--mwp-good)]",
  lose: "text-[color:var(--mwp-warn)]",
  hurt: "text-[color:var(--mwp-bad)]",
  heal: "text-[color:var(--mwp-good)]",
  state: "text-[color:var(--mwp-red-deep)]",
  meta: "text-[color:var(--mwp-ink-soft)]",
}

/** One effect as a sentence with its referenced ids as navigable chips. */
function MewEffectLine({ k, v, onNav, t }: { k: string; v: unknown; onNav: NavFn; t: Tx }) {
  const line = mewRewardLine(k, v)
  const isCounter = k === "increment_legacy_counter" || k === "decrement_legacy_counter"
  const text = line.key ? t(line.key, line.params) : null
  // A structured value the sentence did not absorb (a status map, a nested
  // effect) must still render, or the line ends on a dangling "…with" — but a
  // value the sentence DID state must not be echoed after it ("Gain 10–15
  // coins +10 +15").
  const showRaw = !line.consumed && !line.refs.length && !!v && typeof v === "object"
  return (
    <li className="flex items-baseline gap-2">
      <Icon name={TONE_ICON[line.tone]} size={10} className={cn("relative top-[2px] flex-none", TONE_CLS[line.tone])} />
      <span className="min-w-0 text-[12.5px]/[1.45] text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]">
        {text ?? <span className="text-[color:var(--mwp-ink-soft)]">{String(line.params.label)}</span>}
        {isCounter && line.refs[0] ? (
          <span className="ml-1.5 font-mono text-[10.5px] text-[color:var(--mwp-ink-soft)]">{mewCounterShort(line.refs[0])}</span>
        ) : line.refs.length ? (
          <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
            {line.refs.slice(0, 4).map((id) => {
              const cat = select.catOf(id)
              if (cat) return <MewRef key={id} id={id} cat={cat} onNav={onNav} />
              // `injury: str` names the stat the wound drops, not an entity.
              const stat = MEW_STAT_ABBR_KEY[id] ? t(MEW_STAT_ABBR_KEY[id]) : null
              return <span key={id} className="font-mono text-[11px] font-bold text-[color:var(--mwp-red-deep)]">{stat ?? mewHuman(id)}</span>
            })}
          </span>
        ) : showRaw || !text ? (
          <span className="ml-1.5 font-mono text-[11px] text-[color:var(--mwp-ink)]"><MewEffectVal v={v} onNav={onNav} /></span>
        ) : null}
      </span>
    </li>
  )
}

function MewReward({ entry, onNav, t, tierPct }: { entry: MewEventReward; onNav: NavFn; t: Tx; tierPct?: (tier: string) => string | null }) {
  const effects = Object.entries(entry).filter(([k]) => !MEW_REWARD_HIDDEN.has(k))
  const prompt = typeof entry.prompt === "string" ? entry.prompt : ""
  if (!prompt && !effects.length) return null
  const tier = typeof entry.tier === "string" ? entry.tier : null
  const weight = typeof entry.weight === "number" ? entry.weight : null
  return (
    <div className="flex flex-col gap-1.5 border-t-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] pt-2.5 first:border-t-0 first:pt-0">
      {(tier || weight != null) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {tier && (
            <span className={cn(
              "inline-flex items-center gap-1 border-[1.5px] border-solid px-[7px] pb-[2px] pt-[3px] text-[9.5px]/none uppercase tracking-[0.07em] [font-family:var(--mwf-disp)] [border-radius:4px]",
              tier === "rare"
                ? "border-[color:var(--mwp-red)] bg-[color-mix(in_srgb,var(--mwp-red)_12%,transparent)] text-[color:var(--mwp-red-deep)]"
                : "border-[color:var(--mwp-ink-line)] text-[color:var(--mwp-ink-soft)]",
            )}>
              {tier === "rare" && <Icon name="sparkles" size={9} />}
              {t(tier === "rare" ? "event.tier.rare" : "event.tier.common")}
              {tierPct?.(tier) && <b className="font-mono text-[10px] tracking-normal">{tierPct(tier)}</b>}
            </span>
          )}
          {weight != null && <span className="font-mono text-[10px]/none text-[color:var(--mwp-ink-soft)]">{t("event.tier.weight")} {weight}</span>}
        </div>
      )}
      {prompt ? <MewText muted>{prompt}</MewText> : null}
      {effects.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {effects.map(([k, v]) => <MewEffectLine key={k} k={k} v={v} onNav={onNav} t={t} />)}
        </ul>
      )}
    </div>
  )
}

function MewOutcome({ outcome, tone, tag, icon, pct, onNav, t, tierPct }: { outcome?: MewEventOption["good"]; tone?: "good" | "bad"; tag: string; icon: IconName; pct?: string; onNav: NavFn; t: Tx; tierPct?: (tier: string) => string | null }) {
  if (!outcome || !outcome.entries.length) return null
  const toneCls = tone === "good"
    ? "bg-[color:var(--mwp-paper-good-light)] [&_.otag]:text-[color:var(--mwp-good)]"
    : tone === "bad"
      ? "bg-[color:var(--mwp-paper-bad-light)] [&_.otag]:text-[color:var(--mwp-bad)]"
      : "bg-[color:var(--mwp-paper-2)]"
  return (
    <div className={"flex flex-col gap-2.5 px-4 py-3 " + toneCls}>
      <span className="otag flex items-center justify-between gap-2 text-[10.5px]/none uppercase tracking-[0.08em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)] [&_svg]:text-current">
        <span className="inline-flex items-center gap-1.5"><Icon name={icon} size={12} />{tag}</span>
        {pct && <span className="font-mono text-[11px] font-bold">{pct}</span>}
      </span>
      {outcome.entries.map((e, i) => <MewReward key={i} entry={e} onNav={onNav} t={t} tierPct={tierPct} />)}
    </div>
  )
}

export function EventView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics") as Tx
  const options = rec.options || []
  const subjectPortrait = React.useMemo(() => rec.subject ? mewPortraitSrc(rec.subject) : null, [rec.subject])
  // One stat line for the whole event; each option shows only its own slice.
  const [stats, setStats] = React.useState<MewCatStats>(MEW_DEFAULT_STATS)
  const introVariants = Array.isArray(rec.introVariants) ? (rec.introVariants as { prompt: string; when?: string }[]) : []

  return (
    <MewDetail id={rec.id}>
      <MewHero
        cat="events"
        rec={rec}
        badges={rec.subject ? <MewFlag icon="eye">{mewHuman(rec.subject)}</MewFlag> : undefined}
        media={subjectPortrait ? <MewHeroMedia src={subjectPortrait} alt={rec.subject || rec.name} max={240} /> : undefined}
      />
      {introVariants.length === 0 && <MewDesc>{rec.prompt}</MewDesc>}
      <MewSections>
        {introVariants.length > 0 && (
          <MewPanel title={t("event.intro.title")} icon="book" count={introVariants.length} span="full">
            <div className="flex flex-col gap-2.5">
              {introVariants.map((v, i) => (
                <div className="flex flex-col gap-1 border-b-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] pb-2.5 last:border-b-0 last:pb-0" key={i}>
                  {v.when && (
                    <span className="w-fit border-[1.5px] border-solid border-[color:var(--mwp-ink-line)] bg-[color:var(--mwp-paper-2)] px-2 pb-[2px] pt-[3px] font-mono text-[10px]/none font-bold text-[color:var(--mwp-ink-soft)] [border-radius:4px]">
                      {t("event.intro.counter")} {v.when}
                    </span>
                  )}
                  <MewText muted>{v.prompt}</MewText>
                </div>
              ))}
            </div>
          </MewPanel>
        )}

        <MewPanel
          title={t("panel.choices")}
          icon="compass"
          count={options.length}
          span="full"
          aside={<span className="flex justify-end"><MewChanceReset stats={stats} onChange={setStats} /></span>}
        >
          <div className="flex flex-col gap-4">
            {options.map((o) => {
              const hasTiers = !!(o.good?.entries.some((e) => e.tier) || o.bad?.entries.some((e) => e.tier))
              const odds = mewOptionOdds(stats, { stat: o.stat, fixedChance: o.fixedChance, hasBad: !!o.bad, hasTiers })
              const isCheck = odds?.roll.kind === "stat"
              const cost = o.statMin != null && (o.stat === "coins" || o.stat === "quest") ? o.statMin : null
              const reqs = o.reqs ? Object.entries(o.reqs) : []
              return (
                // One border, one steady radius. The old card wrapped a wobbly
                // 18/165px radius around a 1300px box, which read as a lopsided
                // blob, and stacked three nested boxes before any content.
                <article className="overflow-hidden border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper)] [border-radius:10px] [box-shadow:0_3px_0_var(--mwp-shadow-md)]" key={o.id}>
                  <header className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 bg-[color:var(--mwp-paper-2)] px-4 pb-2 pt-[11px]">
                    <h3 className="m-0 text-[15px]/none text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)]">{o.label}</h3>
                    <span className="flex flex-wrap items-center gap-2 text-[11.5px]/none font-semibold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">
                      {cost != null && (
                        <span className="inline-flex items-center gap-1 text-[color:var(--mwp-warn)]">
                          <Icon name="gift" size={10} />{t("event.cost", { n: cost, what: mewHuman(o.stat || "") })}
                        </span>
                      )}
                      {isCheck
                        ? <span>{t("label.check")} <b className="text-[color:var(--mwp-red-deep)]">{mewStatLabel(o.stat!, t)}</b></span>
                        : odds?.roll.kind === "fixed"
                          ? <span>{t("event.calc.fixed")} <b className="text-[color:var(--mwp-red-deep)]">{Math.round((o.fixedChance ?? 0) * 100)}%</b></span>
                          : odds
                            ? <span>{t("event.calc.luckOnly")}</span>
                            : <span>{t("event.calc.noRoll")}</span>}
                    </span>
                  </header>

                  {reqs.length > 0 && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] px-4 py-2">
                      <span className="text-[10px]/none uppercase tracking-[0.07em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)]">{t("event.req.title")}</span>
                      {reqs.map(([k, v]) => (
                        <span key={k} className="inline-flex items-center gap-1 text-[11px]/[1.3] font-semibold text-[color:var(--mwp-ink)] [font-family:var(--mwf-hand)]">
                          <Icon name="lock" size={9} className="text-[color:var(--mwp-ink-soft)]" />{mewReqText(k, v, t)}
                        </span>
                      ))}
                    </div>
                  )}

                  {odds && (
                    <div className="border-t-[1.5px] border-dashed border-[color:var(--mwp-ink-line)] px-4 py-3">
                      <MewOptionChance odds={odds} stats={stats} onChange={setStats} idPrefix={`${rec.id}-${o.id}`} />
                    </div>
                  )}

                  <div className="grid border-t-2 border-solid border-[color:var(--mwp-ink)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))] [&>*+*]:border-l-[1.5px] [&>*+*]:border-dashed [&>*+*]:border-[color:var(--mwp-ink-line)] max-[720px]:[&>*+*]:border-l-0 max-[720px]:[&>*+*]:border-t-[1.5px]">
                    <MewOutcome
                      outcome={o.good} tone="good" tag={t("label.success")} icon="check"
                      pct={odds && odds.roll.kind !== "tier" ? Math.round(odds.chance.success * 100) + "%" : undefined}
                      tierPct={odds ? (tier) => mewTierPct(odds as MewOptionOdds, "good", tier) : undefined}
                      onNav={onNav} t={t}
                    />
                    <MewOutcome
                      outcome={o.bad} tone="bad" tag={t("label.failure")} icon="x"
                      pct={odds && odds.roll.kind !== "tier" ? Math.round((1 - odds.chance.success) * 100) + "%" : undefined}
                      tierPct={odds ? (tier) => mewTierPct(odds as MewOptionOdds, "bad", tier) : undefined}
                      onNav={onNav} t={t}
                    />
                    <MewOutcome outcome={o.flat} tag={t("label.result")} icon="arrow" onNav={onNav} t={t} />
                  </div>
                </article>
              )
            })}
          </div>
          {options.length === 0 && <MewNote>{t("label.noData")}</MewNote>}
        </MewPanel>
      </MewSections>
    </MewDetail>
  )
}
