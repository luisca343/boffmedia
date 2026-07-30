"use client"

import { Icon, type IconName } from "@boffmedia/ui"
import { useTranslations } from "next-intl"
import { MewText, MewPanel } from "../../MewAtoms"
import { mewHuman, type MewEventOption } from "../../mew-util"
import { MewEffectVal, MewFlag, type NavFn } from "../MewRefs"
import { MewCol, MewDesc, MewDetail, MewHero, type ViewProps } from "./scaffold"

const MEW_REWARD_KEY: Record<string, string> = {
  get_item_from_pool: "reward.getItemFromPool", get_item: "reward.getItem", get_parasite: "reward.getParasite",
  party_heal: "reward.partyHeal", gain_food: "reward.gainFood", gain_gold: "reward.gainGold", lose_gold: "reward.loseGold",
  self_status_next_fight: "reward.selfStatusNextFight", ally_ambush_next_fights: "reward.allyAmbushNextFights",
  spawn_unit_next_fight: "reward.spawnUnitNextFight", gain_disorder_from_pool: "reward.gainDisorderFromPool",
  random_pool: "reward.randomPool", set_flag: "reward.setFlag", heal: "reward.heal",
  gain_xp: "reward.gainXp", add_cat: "reward.addCat", remove_cat: "reward.removeCat",
}
function mewRewardLabel(k: string, t: (k: string) => string) { return MEW_REWARD_KEY[k] ? t(MEW_REWARD_KEY[k]) : mewHuman(k) }
const MEW_STAT_ABBR_KEY: Record<string, string> = { str: "stat.str", dex: "stat.dex", con: "stat.con", int: "stat.int", spd: "stat.spd", cha: "stat.cha", lck: "stat.lck" }

function MewReward({ entry, onNav, t }: { entry: Record<string, unknown>; onNav: NavFn; t: (k: string) => string }) {
  const effects = Object.entries(entry).filter(([k]) => k !== "prompt")
  const prompt = typeof entry.prompt === "string" ? entry.prompt : ""
  if (!prompt && !effects.length) return null
  return (
    <div className="flex flex-col gap-1 border-t border-dashed border-[color:var(--mwp-ink-line)] pt-1.5 first:border-t-0 first:pt-0">
      {prompt ? <div className="mb-[3px]"><MewText muted>{prompt}</MewText></div> : null}
      {effects.map(([k, v]) => (
        <div className="flex items-baseline justify-between gap-2.5" key={k}>
          <span className="text-[11.5px]/[1.3] font-medium text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{mewRewardLabel(k, t)}</span>
          <span className="flex flex-wrap justify-end gap-1 font-mono text-[12px]/[1.3] text-[color:var(--mwp-ink)]">
            {typeof v === "boolean" ? (v ? t("label.yes") : t("label.no")) : <MewEffectVal v={v} onNav={onNav} />}
          </span>
        </div>
      ))}
    </div>
  )
}

function MewOutcome({ outcome, tone, tag, icon, onNav, t }: { outcome?: MewEventOption["good"]; tone?: "good" | "bad"; tag: string; icon: IconName; onNav: NavFn; t: (k: string) => string }) {
  if (!outcome || !outcome.entries.length) return null
  const toneCls = tone === "good" ? "bg-[#e4eed6] [&_.otag]:text-[color:var(--mwp-good)]" : tone === "bad" ? "bg-[#f6d9d3] [&_.otag]:text-[color:var(--mwp-bad)]" : "bg-[color:var(--mwp-paper)]"
  return (
    <div className={"flex flex-col gap-2 border-l-2 border-dashed border-[color:var(--mwp-ink-line)] px-3.5 py-3 first:border-l-0 max-[900px]:border-l-0 max-[900px]:border-t-2 " + toneCls}>
      <span className="otag inline-flex items-center gap-1.5 text-[10.5px]/none uppercase tracking-[0.08em] text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-disp)] [&_svg]:text-current">
        <Icon name={icon} size={12} />{tag}
      </span>
      {outcome.entries.map((e, i) => <MewReward key={i} entry={e} onNav={onNav} t={t} />)}
    </div>
  )
}

export function EventView({ rec, onNav }: ViewProps) {
  const t = useTranslations("mewgenics")
  const options = rec.options || []
  return (
    <MewDetail>
      <MewHero cat="events" rec={rec} badges={rec.subject ? <MewFlag icon="eye">{mewHuman(rec.subject)}</MewFlag> : undefined} />
      <MewDesc>{rec.prompt}</MewDesc>
      <MewCol single>
        <MewPanel title={t("panel.choices")} icon="compass" count={options.length}>
          <div className="flex flex-col gap-3.5">
            {options.map((o) => (
              <div className="overflow-hidden border-2 border-solid border-[color:var(--mwp-ink)] bg-[color:var(--mwp-paper-2)] [border-radius:var(--wob-c)]" key={o.id}>
                <div className="flex items-center justify-between gap-2.5 border-b-2 border-dashed border-[color:var(--mwp-ink-line)] px-3.5 pb-2 pt-[11px]">
                  <span className="text-[16px]/none text-[color:var(--mwp-ink)] [font-family:var(--mwf-disp)]">{o.label}</span>
                  {o.stat && <span className="text-[11.5px]/none font-semibold text-[color:var(--mwp-ink-soft)] [font-family:var(--mwf-hand)]">{t("label.check")} <b className="text-[color:var(--mwp-red-deep)]">{MEW_STAT_ABBR_KEY[o.stat] ? t(MEW_STAT_ABBR_KEY[o.stat]) : mewHuman(o.stat)}</b></span>}
                </div>
                <div className="grid grid-cols-2 max-[900px]:grid-cols-1">
                  <MewOutcome outcome={o.good} tone="good" tag={t("label.success")} icon="check" onNav={onNav} t={t} />
                  <MewOutcome outcome={o.bad} tone="bad" tag={t("label.failure")} icon="x" onNav={onNav} t={t} />
                  <MewOutcome outcome={o.flat} tag={t("label.result")} icon="arrow" onNav={onNav} t={t} />
                </div>
              </div>
            ))}
          </div>
        </MewPanel>
      </MewCol>
    </MewDetail>
  )
}
