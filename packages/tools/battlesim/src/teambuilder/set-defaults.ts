import type { BsimStatLimits } from "@boffmedia/battle-core";
import type { PokemonSet } from "@pkmn/sim";

const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"] as const;

/**
 * A complete, empty Pokémon set.
 *
 * Slots used to be `{}`, and every consumer paid for it: `SetEditor` maps over
 * `set.moves`, `set.evs` and `set.ivs` directly, so opening an unfilled slot
 * threw `Cannot read properties of undefined (reading '0')` before it rendered
 * anything. A partial set is not a useful representation of "empty" — the
 * editor wants six real sets it can edit in place.
 *
 * The defaults are the simulator's own: 0 EVs, 31 IVs, level 100, Serious (the
 * neutral nature). A set built from these and given a species is legal.
 */
export function emptySet(): PokemonSet {
  return {
    name: "",
    species: "",
    item: "",
    ability: "",
    moves: ["", "", "", ""],
    nature: "Serious",
    gender: "",
    evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: 100,
    shiny: false,
    happiness: 255,
    teraType: "",
  } as PokemonSet;
}

/** Fills in whatever a set is missing, without touching what it has. */
export function withSetDefaults(set: Partial<PokemonSet> | undefined | null): PokemonSet {
  const base = emptySet();
  if (!set) return base;
  return {
    ...base,
    ...set,
    // Spread alone is not enough for these three: a set that carries an
    // explicit `undefined`, or a short `moves` array, still has to come out
    // usable, and these are exactly the fields the editor indexes into.
    moves: [0, 1, 2, 3].map((i) => set.moves?.[i] ?? ""),
    evs: { ...base.evs, ...(set.evs ?? {}) },
    ivs: { ...base.ivs, ...(set.ivs ?? {}) },
  } as PokemonSet;
}

/** A slot the player has not filled in. Not packed, not validated. */
export function isEmptySet(set: Partial<PokemonSet> | undefined | null): boolean {
  return !set?.species;
}

/**
 * The parts of a set the FORMAT decides rather than the builder.
 *
 * Pokémon Champions (`statLimitsFor(...).system === "sp"`) is always level 50
 * with 31 IVs, and spends Stat Points instead of EVs — 32 per stat. Those are
 * not suggestions the editor can leave to the render pass: the packed team is
 * what gets validated and saved, so a level-100 set switched into a Champions
 * format has to become a level-50 set in the DRAFT, not merely look like one.
 *
 * Returns the same object when nothing changes, so the draft's memos and the
 * packed string stay stable for a set that is already conformant.
 */
export function applyFormatRules(set: PokemonSet, limits: BsimStatLimits): PokemonSet {
  const evs = set.evs as Record<string, number>;
  const ivs = set.ivs as Record<string, number>;
  const lockedIvs = limits.lockedIvs;
  const fixedLevel = limits.fixedLevel;

  const overCap = STAT_KEYS.some((k) => (evs[k] ?? 0) > limits.perStat);
  const wrongIvs = lockedIvs !== null && STAT_KEYS.some((k) => (ivs[k] ?? 31) !== lockedIvs);
  const wrongLevel = fixedLevel !== null && set.level !== fixedLevel;
  if (!overCap && !wrongIvs && !wrongLevel) return set;

  const next = { ...set } as PokemonSet;
  if (overCap) {
    const capped: Record<string, number> = { ...evs };
    for (const k of STAT_KEYS) capped[k] = Math.min(capped[k] ?? 0, limits.perStat);
    next.evs = capped as PokemonSet["evs"];
  }
  if (wrongIvs) {
    const locked: Record<string, number> = {};
    for (const k of STAT_KEYS) locked[k] = lockedIvs as number;
    next.ivs = locked as PokemonSet["ivs"];
  }
  if (wrongLevel) next.level = fixedLevel as number;
  return next;
}
