import { mewCleanName, mewHuman, type MewEventOption, type MewEventOutcome, type MewEventReward, type MewRec } from "./mew-util"
import { T, type Raw } from "./mew-store-state"

// Per-category normalizers: raw wiki_data dump → the view record shape the detail
// fiches read. Display fields are localized here via `T`. Pure functions — the
// only side-effect (art wiring) lives in the load orchestrator.

const ITEM_MODS = ["str", "dex", "con", "int", "spd", "cha", "lck", "max_health", "durability"]

export function normItems(raw: Raw[]): MewRec[] {
  return raw.map((r) => {
    const rec: MewRec = {
      id: r._id,
      name: mewCleanName(T(r.name_key, r.name_en)) || mewHuman(r._id),
      desc: T(r.desc_key, r.desc_en),
      kind: r.kind,
      rarity: r.rarity,
      icon: r.icon || null,
      set: r.set ?? r.Set,
      shield: r.shield,
      durability: r.durability,
      passives: r.passives,
      ability: r.ability,
      attack: r.attack,
      global_tags: r.global_tags,
      consumable: !!r.consumable,
      cursed: !!r.cursed,
      parasite: !!r.parasite,
      quest_item: !!r.quest_item,
      indestructible: !!r.indestructible,
      divine_shield: !!r.divine_shield,
    }
    rec.nk = r.name_key
    rec.dk = r.desc_key
    ITEM_MODS.forEach((k) => { if (r[k] != null) rec[k] = r[k] })
    return rec
  })
}

export function normCharacters(raw: Raw[], spriteMap: Record<string, string>): MewRec[] {
  return raw.map((r) => {
    const p = r.properties || {}
    const rec: MewRec = {
      id: r._id,
      name: mewCleanName(T(r.name_key, r.name_en)) || mewHuman(r._id),
      faction: p.faction,
      hp: p.health,
      type: p.type,
      tip: T(r.tooltip_key, r.tooltip_en),
      move: p.movement,
      champ: p.can_be_champion,
      stats: r.stats,
      atk: r.abilities?.attack,
      spells: r.abilities?.spells,
      passives: r.passives,
      equipment: r.equipment,
      variant_of: r.variant_of,
      // characters carry a direct sprite path (covers ~477/689, incl. variants
      // that reuse another entity's sheet); fall back to the id-keyed sprite_map
      sprite: r.sprite || spriteMap[r._id] || null,
      hasSprite: !!(r.sprite || spriteMap[r._id]),
    }
    rec.nk = r.name_key
    rec.tk = r.tooltip_key
    return rec
  })
}

export function normPassives(raw: Raw[]): MewRec[] {
  return raw.map((r) => {
    const rankKeys = Object.keys(r).filter((k) => /^\d+$/.test(k)).sort((a, b) => Number(a) - Number(b))
    const rec: MewRec = {
      id: r._id,
      name: mewCleanName(T(r.name_key, r.name_en)) || mewHuman(r._id),
      desc: T(r.desc_key, r.desc_en),
      cls: r.class || undefined,
      icon: r.icon || null,
      base: r["1"]?.passives,
      shield: r.shield,
      ranks: rankKeys.map((k) => ({
        r: Number(k),
        desc: r[k].desc ? T(r[k].desc, r[k].desc_en) : undefined,
        passives: r[k].passives,
      })),
    }
    rec.nk = r.name_key
    rec.dk = r.desc_key
    return rec
  })
}

export function normKeywords(raw: Raw[]): MewRec[] {
  return raw.map((r) => {
    const rec: MewRec = {
      id: r._id,
      name: mewCleanName(T(r.name_key, r.name_en)) || mewHuman(r._id),
      tip: T(r.tooltip_key, r.tooltip_en),
    }
    rec.nk = r.name_key
    rec.tk = r.tooltip_key
    return rec
  })
}

// keys that are cosmetic / structural, not player-facing rewards
const EV_DROP = new Set([
  "label", "stat", "animation", "animation_fail", "animation_success", "stat_min", "stat_max",
  "set_frame", "cat_choice", "good", "bad", "flat", "reward", "random_pool", "random_pool_consider_luck",
  "weight", "play_animation", "play_result_animation", "clear_result_animation", "spin", "cutscene",
  "cutscene_on_exit", "override_end_option_prompt", "subject_frame", "subject_clip", "event_clip",
])
function cleanReward(e: Raw): MewEventReward {
  const out: MewEventReward = {}
  Object.entries(e).forEach(([k, v]) => {
    if (EV_DROP.has(k)) return
    if (k === "prompt") out.prompt = T(v as string, "")
    else out[k] = v
  })
  return out
}
// flatten a raw branch (good/bad/flat) into a uniform list of reward entries,
// covering the reward-map, random_pool and direct-effects shapes
function normBranch(b: Raw | undefined): MewEventOutcome | undefined {
  if (!b || typeof b !== "object") return undefined
  let rawEntries: Raw[]
  if (b.reward && typeof b.reward === "object") rawEntries = Object.values(b.reward)
  else if (Array.isArray(b.random_pool)) rawEntries = b.random_pool
  else rawEntries = [b]
  const entries = rawEntries.map(cleanReward).filter((e) => e.prompt || Object.keys(e).some((k) => k !== "prompt"))
  return entries.length ? { entries } : undefined
}
export function normEvents(raw: Raw[]): MewRec[] {
  return raw
    .map((r) => {
      const main = r.main || {}
      const options: MewEventOption[] = (Object.entries(main.options || {}) as [string, Raw][]).map(([oid, o]) => {
        const good = normBranch(o.good)
        const bad = normBranch(o.bad)
        // options with no good/bad carry their rewards directly → a single flat outcome
        const flat = good || bad ? normBranch(o.flat) : normBranch(o)
        return { id: oid, label: mewCleanName(T(o.label, o.label)), stat: o.stat, good, bad, flat }
      })
      const rec: MewRec = {
        id: r._id,
        name: mewCleanName(T(r.title_key, r.title_en)) || mewHuman(r._id),
        subject: r.intro?.subject_frame,
        prompt: T(main.prompt, ""),
        options,
      }
      rec.titlek = r.title_key
      return rec
    })
    .filter((r) => !/\b(test|debug|placeholder)\b/i.test(r.name + " " + r.id))
}

export function normClasses(raw: Raw[]): MewRec[] {
  return raw.map((r) => {
    const rec: MewRec = {
      id: r._id,
      name: mewCleanName(T(r.meta?.name, r.name_en)) || mewHuman(r._id),
      desc: T(r.meta?.description, ""),
      weapon: r.innate_items?.weapon,
      starters: r.starter_abilities,
      abilities: r.ability_pool,
      groups: r.ability_groups,
      passivePool: r.passive_pool,
      statMods: r.stat_mods,
    }
    return rec
  })
}

export function normMaps(raw: Raw[]): MewRec[] {
  return raw.map((r) => {
    const rec: MewRec = {
      id: r._id,
      name: mewCleanName(T(r.area_name_key, r.area_name_en)) || mewHuman(r._id),
      act: r.act,
      chapter: r.chapter,
      tileset: r.tileset,
      music: r.music,
      bosses: Object.keys(r.bosses || {}),
      minibosses: Object.keys(r.minibosses || {}),
      enemies: r.enemy_pools,
      items: r.item_pools,
    }
    return rec
  })
}

// abilities compaction (from the large raw abilities.json)
export function compactAbility(a: Raw): MewRec {
  const di = a.damage_instance || {}
  const rec: MewRec = {
    id: a._id,
    name: mewCleanName(T(a.name_key, a.name_en)) || mewHuman(a._id),
    desc: T(a.desc_key, a.desc_en),
    cls: a.class || undefined,
    cost: a.cost || undefined,
    target: a.target || undefined,
    tags: a.tags || undefined,
    template: a.template || undefined,
    variant_of: a.variant_of || undefined,
    chain: a.chain_ability || undefined,
    sub: a.sub_ability || undefined,
    // raw ability icon (may be shared via icon_owner) covers ~1842/2412, more
    // than the id-keyed icon_map (832) — both point to real files
    icon: a.icon || null,
  }
  rec.nk = a.name_key
  rec.dk = a.desc_key
  rec.named = !!(a.name_en && a.name_en !== "None")
  const d: Record<string, unknown> = {}
  if (di.type) d.type = di.type
  if (di.damage != null) d.damage = di.damage
  if (di.heal != null) d.heal = di.heal
  if (di.effects) d.effects = di.effects
  if (a.self_damage != null) d.self = a.self_damage
  if (a.splash_damage != null) d.splash = a.splash_damage
  if (Object.keys(d).length) rec.dmg = d as MewRec["dmg"]
  if (a.bonus_passives) rec.bonus = a.bonus_passives
  return rec
}
