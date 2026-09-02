import { mewHuman } from "../../mew-util"

// Event rewards as prose.
//
// The raw effects are engine calls (`increment_legacy_counter`,
// `party_damage`), and printing key/value across a wide row turned them into a
// data dump — "increment legacy counter … World Event Legacy Counter Crack In
// The Wall". The wiki writes the same effects as sentences, so each frequent
// verb gets a message with its value inline. Anything unmapped keeps the old
// humanised key/value pair, so nothing silently disappears when the game adds
// a verb.

export type MewRewardTone = "gain" | "lose" | "hurt" | "heal" | "state" | "meta"

export interface MewRewardLine {
  /** i18n key under `reward.line.*`, or null to fall back to key/value. */
  key: string | null
  /** Interpolation values for the message. */
  params: Record<string, string | number>
  tone: MewRewardTone
  /** Ids the line refers to, rendered as navigable chips after the sentence. */
  refs: string[]
  /**
   * The sentence already states the value (`Gain 10–15 coins`), so the raw
   * value must not be echoed after it. False for verbs whose message is a bare
   * label and whose value still has to be shown.
   */
  consumed: boolean
}

/** `5` → "5"; `[5, 10]` → "5–10"; `"50%"` → "50%". */
function amount(v: unknown): string {
  if (Array.isArray(v)) {
    const a = v.filter((x) => typeof x === "number" || typeof x === "string")
    if (a.length >= 2 && a[0] !== a[1]) return `${a[0]}–${a[1]}`
    return String(a[0] ?? "")
  }
  if (typeof v === "number" || typeof v === "string") return String(v)
  return ""
}

/** How many times a counter verb was applied — the value repeats the id per step. */
function repeatCount(v: unknown): number {
  return Array.isArray(v) ? v.length : 1
}

/** Ids inside a value, for the navigable chips. */
function refsOf(v: unknown): string[] {
  if (typeof v === "string") return [v]
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string")
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>
    const pool = o.pool ?? o.item ?? o.unit
    if (typeof pool === "string") return [pool]
    if (Array.isArray(pool)) return pool.filter((x): x is string => typeof x === "string")
  }
  return []
}

type Builder = (v: unknown) => Omit<MewRewardLine, "key"> & { key: string }

const B = (key: string, tone: MewRewardTone, params?: (v: unknown) => Record<string, string | number>): Builder =>
  (v) => ({ key, tone, params: params ? params(v) : {}, refs: refsOf(v), consumed: !!params })

/**
 * The frequent verbs, by descending use in events.json. Ordered so the reader
 * meets resources, then harm, then lasting state, then bookkeeping.
 */
const LINES: Record<string, Builder> = {
  gain_coins: B("reward.line.gainCoins", "gain", (v) => ({ n: amount(v) })),
  gain_food: B("reward.line.gainFood", "gain", (v) => ({ n: amount(v) })),
  gain_xp: B("reward.line.gainXp", "gain", (v) => ({ n: amount(v) })),
  lose_gold: B("reward.line.loseCoins", "lose", (v) => ({ n: amount(v) })),
  gain_gold: B("reward.line.gainCoins", "gain", (v) => ({ n: amount(v) })),

  get_item: B("reward.line.getItem", "gain"),
  get_item_from_pool: B("reward.line.getItemFromPool", "gain"),
  get_and_equip_item: B("reward.line.equipItem", "gain"),
  get_and_equip_item_from_pool: B("reward.line.equipItemFromPool", "gain"),
  get_parasite: B("reward.line.getParasite", "lose"),
  get_parasite_from_pool: B("reward.line.getParasiteFromPool", "lose"),
  lose_item: B("reward.line.loseItem", "lose"),
  lose_specific_item: B("reward.line.loseItem", "lose"),
  lose_item_from_inventory: B("reward.line.loseItem", "lose"),
  lose_all_equipped_items: B("reward.line.loseAllItems", "lose"),

  damage: B("reward.line.damage", "hurt", (v) => ({ n: amount(v) })),
  self_damage: B("reward.line.selfDamage", "hurt", (v) => ({ n: amount(v) })),
  party_damage: B("reward.line.partyDamage", "hurt", (v) => ({ n: amount(v) })),
  kill: B("reward.line.kill", "hurt"),
  heal: B("reward.line.heal", "heal", (v) => ({ n: amount(v) })),
  self_heal: B("reward.line.heal", "heal", (v) => ({ n: amount(v) })),
  party_heal: B("reward.line.partyHeal", "heal", (v) => ({ n: amount(v) })),
  full_heal: B("reward.line.fullHeal", "heal"),

  injury: B("reward.line.injury", "hurt"),
  gain_disorder: B("reward.line.gainDisorder", "state"),
  gain_disorder_from_pool: B("reward.line.gainDisorderFromPool", "state"),
  random_mutation: B("reward.line.randomMutation", "state"),
  random_mutation_from_set: B("reward.line.randomMutation", "state"),
  mutation: B("reward.line.mutation", "state"),
  permanent_stats: B("reward.line.permanentStats", "state"),
  self_status_next_fight: B("reward.line.selfStatusNextFight", "state"),
  party_status_next_fight: B("reward.line.partyStatusNextFight", "state"),
  gain_familiar: B("reward.line.gainFamiliar", "gain"),
  add_cat: B("reward.line.addCat", "gain"),
  remove_cat: B("reward.line.removeCat", "lose"),

  spawn_unit_next_fight: B("reward.line.spawnUnitNextFight", "hurt"),
  ally_ambush_next_fights: B("reward.line.allyAmbush", "gain"),
  ambush_next_basic_fights: B("reward.line.ambush", "hurt"),
  battle: B("reward.line.battle", "hurt"),
  shop_now: B("reward.line.shopNow", "meta"),
  event_now: B("reward.line.eventNow", "meta"),
  event_now_same_cat: B("reward.line.eventNowSameCat", "meta"),
  next_event_bonus: B("reward.line.nextEventBonus", "meta"),

  increment_legacy_counter: B("reward.line.counterUp", "meta", (v) => ({ n: repeatCount(v) })),
  decrement_legacy_counter: B("reward.line.counterDown", "meta", (v) => ({ n: repeatCount(v) })),
  set_legacy_token: B("reward.line.setToken", "meta"),
  set_adventure_token: B("reward.line.setToken", "meta"),
  set_flag: B("reward.line.setFlag", "meta"),
}

/** Effects that are staging directions, not outcomes — never shown. */
export const MEW_REWARD_HIDDEN = new Set([
  "set_frame", "play_animation", "play_sound", "play_result_animation",
  "clear_result_animation", "hide_cat", "set_subject", "spin", "cutscene",
  "cutscene_on_exit", "subject_frame", "subject_clip", "event_clip",
  "override_end_option_prompt", "tier", "weight", "prompt",
])

export function mewRewardLine(k: string, v: unknown): MewRewardLine {
  const build = LINES[k]
  if (build) return build(v)
  return { key: null, params: { label: mewHuman(k) }, tone: "meta", refs: refsOf(v), consumed: false }
}

/** Counter ids are long and repeat per event; the event name is already above. */
export function mewCounterShort(id: string): string {
  return mewHuman(String(id).replace(/^WorldEventLegacyCounter_/, "").replace(/^Counter_/, ""))
}
