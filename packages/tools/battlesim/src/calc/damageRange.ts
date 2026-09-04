/**
 * Damage, with the uncertainty left in.
 *
 * A calculator on its own page is asked about two sets somebody typed out, so
 * one pair of numbers is the whole answer. A calculator inside a battle is
 * asked about a Pokémon whose EVs, IVs and nature nobody can see, and the
 * honest answer there is a RANGE — "121-192 (48.9-77.7%)" — not the number a
 * default spread happens to produce. A precise figure that is wrong half the
 * time is worse than no calculator, because a player will act on it.
 *
 * So every calculation runs at up to two corners:
 *
 *   floor  = the weakest plausible attacker into the bulkiest plausible target
 *   ceiling = the strongest plausible attacker into the frailest plausible one
 *
 * A side whose spread was recovered from the battle (`spreadKnown`) contributes
 * the SAME spread to both corners, so the range narrows to the 16 damage rolls
 * exactly as it should when both sides are known — the mechanism costs nothing
 * when there is nothing to be uncertain about.
 *
 * Nothing here writes to the battle. It takes the frozen snapshot from
 * `fromBattle` and plain records, and returns numbers.
 */
import {
  calcDamage,
  maxSpread,
  minSpread,
  type CalcField,
  type CalcMove,
  type CalcPokemon,
  type StatKey,
} from "@boffmedia/tools-pokemon";
import type { CalcMonSnapshot } from "./fromBattle";

export interface DamageRange {
  /** Least and most damage in HP across rolls AND plausible spreads. */
  minDamage: number;
  maxDamage: number;
  /** The same, as a share of the defender's MAX HP. */
  minPct: number;
  maxPct: number;
  /** True when at least one side's spread had to be guessed. */
  spreadUnknown: boolean;
  /**
   * Hits needed to knock the defender out FROM ITS CURRENT HP — best case for
   * the attacker first. `null` when the move cannot KO at all (0 damage).
   */
  hitsMin: number | null;
  hitsMax: number | null;
  /** @smogon/calc's own English sentence for the ceiling corner. */
  desc: string;
}

/** Which of the attacker's stats a move actually uses. */
const offenseStat = (move: CalcMove): StatKey => (move.category === "Special" ? "spa" : "atk");
/** And which of the defender's it is checked against. */
const defenceStat = (move: CalcMove): StatKey => (move.category === "Special" ? "spd" : "def");

/**
 * The Pokémon as one corner of the range sees it.
 *
 * A known spread is passed through untouched — including its EVs, IVs and
 * nature, which are the real ones. Only an unknown spread is replaced, and only
 * the spread: the item, ability, status, boosts and tera the battle DID reveal
 * are facts and survive both corners.
 */
function atCorner(mon: CalcMonSnapshot, poke: CalcPokemon, corner: "floor" | "ceiling", move: CalcMove, role: "attacker" | "defender"): CalcPokemon {
  if (mon.spreadKnown) return poke;
  const stat = role === "attacker" ? offenseStat(move) : defenceStat(move);
  const strong = role === "attacker" ? corner === "ceiling" : corner === "floor";
  const guess = strong ? maxSpread(stat, { withHp: role === "defender" }) : minSpread();
  return { ...poke, nature: guess.nature, evs: { ...guess.evs }, ivs: { ...guess.ivs } };
}

export interface RangeInput {
  attacker: CalcMonSnapshot;
  defender: CalcMonSnapshot;
  /** The effective sets — snapshot values with the player's overrides folded in. */
  attackerPoke: CalcPokemon;
  defenderPoke: CalcPokemon;
  move: CalcMove;
  field: CalcField;
}

/**
 * `null` when the move deals no damage the calculator will commit to: a status
 * move, or a variable-power one whose base power the player has not set. The
 * panel says so rather than printing a zero, because a zero reads as "this does
 * nothing" and Gyro Ball emphatically does something.
 */
export function damageRange(input: RangeInput): DamageRange | null {
  const { attacker, defender, attackerPoke, defenderPoke, move, field } = input;

  const ceiling = calcDamage(
    atCorner(attacker, attackerPoke, "ceiling", move, "attacker"),
    atCorner(defender, defenderPoke, "ceiling", move, "defender"),
    move,
    field,
  );
  if (!ceiling) return null;

  const bothKnown = attacker.spreadKnown && defender.spreadKnown;
  const floor = bothKnown
    ? ceiling
    : calcDamage(
        atCorner(attacker, attackerPoke, "floor", move, "attacker"),
        atCorner(defender, defenderPoke, "floor", move, "defender"),
        move,
        field,
      );
  if (!floor) return null;

  // Percentages come from each corner's OWN max HP: the bulky hypothesis has
  // more HP as well as more Defence, and dividing both corners by one of the
  // two totals would quietly overstate one end of the range.
  const minDamage = floor.min;
  const maxDamage = ceiling.max;
  const minPct = floor.minPct;
  const maxPct = ceiling.maxPct;

  // How much HP is actually left, per corner. A foe only ever published a
  // percentage, so its remaining HP is a share of that corner's max.
  const remaining = (defHP: number) =>
    defender.hpCur != null && defender.spreadKnown
      ? defender.hpCur
      : Math.max(1, Math.round((defender.hpPct / 100) * defHP));

  const hitsMin = maxDamage > 0 ? Math.ceil(remaining(ceiling.defHP) / maxDamage) : null;
  const hitsMax = minDamage > 0 ? Math.ceil(remaining(floor.defHP) / minDamage) : null;

  return {
    minDamage, maxDamage, minPct, maxPct,
    spreadUnknown: !bothKnown,
    hitsMin, hitsMax,
    desc: ceiling.desc,
  };
}

/**
 * The catalog key for "what does this do to them", stated as a range when the
 * two corners disagree.
 *
 * Deliberately NOT `getKOVerdict` from the standalone calculator: that one
 * reasons about percentages of max HP for two sets you typed, while a battle
 * asks how many more hits from HERE — and the answer often differs between the
 * corners, which is a fact the label has to carry rather than round away.
 */
export function koVerdictKey(range: DamageRange): { key: string; values: Record<string, number> } {
  const { hitsMin, hitsMax } = range;
  if (hitsMin == null || hitsMax == null) return { key: "calc.ko.none", values: {} };
  // OHKO / 2HKO / 3HKO stay in English in both locales: it is VGC jargon, and a
  // Spanish player reads "2HKO" faster than any translation of it.
  if (hitsMin === hitsMax) {
    return hitsMin === 1
      ? { key: "calc.ko.ohko", values: {} }
      : { key: "calc.ko.nhko", values: { hits: hitsMin } };
  }
  return { key: "calc.ko.range", values: { min: hitsMin, max: hitsMax } };
}
