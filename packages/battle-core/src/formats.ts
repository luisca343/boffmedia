/**
 * The one format table (D11).
 *
 * Both hosts, the worker, the teambuilder and the API read this list, and the
 * API also uses it as an allowlist — today `createBattle` takes whatever string
 * the client sends and hands it straight to the simulator.
 *
 * `kind` is the load-bearing field, and it is not cosmetic: a `"random"` format
 * has `team: "random"` in the simulator and `@pkmn/randoms` can generate a side
 * for it, while a `"team"` format has no generator at all and REQUIRES a packed
 * team from the caller. Picking the wrong one does not degrade — the battle
 * stream fails to start. `gen9nationaldex` sat in the old web list as though it
 * were playable against the AI for exactly this reason; it is a team format and
 * only becomes playable once the teambuilder can supply a side (D9).
 */

import { Dex as PkmnDex } from "@pkmn/dex";

import {
  CHAMPIONS_FIXED_IV,
  CHAMPIONS_FIXED_LEVEL,
  CHAMPIONS_SP_PER_STAT,
  CHAMPIONS_SP_TOTAL,
} from "./mods/champions/sp.js";

/**
 * Which stat budget a format uses.
 *
 * `"ev"` is the mainline 252-per-stat / 510-total EV spread with editable IVs.
 * `"sp"` is Pokémon Champions' Stat Points: level and IVs are fixed, and the
 * budget is 32 per stat / 66 total. SP is *stored in the same `evs` field* — see
 * `mods/champions/sp.ts` for why, and for the 1 SP = 8 EVs conversion.
 */
export type BsimStatSystem = "ev" | "sp";

/** How a side's team comes into being for this format. */
export type BsimFormatKind = "random" | "team";

export interface BsimFormat {
  /** Simulator format id, e.g. `gen9randombattle`. */
  id: string;
  /** English display name. The UI shows this verbatim — formats are proper
   *  nouns in the competitive scene and are not translated. */
  label: string;
  kind: BsimFormatKind;
  /** Generation, for grouping in pickers. */
  gen: number;
  /** Team size a builder must fill for a `"team"` format. */
  teamSize?: number;
  /** How many Pokémon each side brings to the field at once. */
  doubles?: boolean;
  /** Registered by `registerBattleMods()` rather than shipped by @pkmn/sim. */
  custom?: boolean;
  /** Which stat budget the format uses. Absent means `"ev"`. */
  statSystem?: BsimStatSystem;
}

export const BSIM_FORMATS: readonly BsimFormat[] = [
  // Random formats — playable offline against the AI with no team at all.
  { id: "gen9randombattle", label: "Gen 9 Random Battle", kind: "random", gen: 9 },
  { id: "gen9randomdoublesbattle", label: "Gen 9 Random Doubles", kind: "random", gen: 9, doubles: true },
  { id: "gen8randombattle", label: "Gen 8 Random Battle", kind: "random", gen: 8 },
  { id: "gen7randombattle", label: "Gen 7 Random Battle", kind: "random", gen: 7 },
  { id: "gen6randombattle", label: "Gen 6 Random Battle", kind: "random", gen: 6 },
  { id: "gen5randombattle", label: "Gen 5 Random Battle", kind: "random", gen: 5 },

  // Team formats — need a built or sample team on both sides (D11).
  { id: "gen9ou", label: "Gen 9 OU", kind: "team", gen: 9, teamSize: 6 },
  { id: "gen9ubers", label: "Gen 9 Ubers", kind: "team", gen: 9, teamSize: 6 },
  { id: "gen9monotype", label: "Gen 9 Monotype", kind: "team", gen: 9, teamSize: 6 },
  { id: "gen9doublesou", label: "Gen 9 Doubles OU", kind: "team", gen: 9, teamSize: 6, doubles: true },
  { id: "gen9vgc2025regi", label: "VGC 2025 Reg I", kind: "team", gen: 9, teamSize: 6, doubles: true },
  { id: "gen9nationaldex", label: "Gen 9 National Dex", kind: "team", gen: 9, teamSize: 6 },
  // Everything below is registered by `registerBattleMods()` rather than
  // shipped by @pkmn/sim, so these only resolve once that has run — which is
  // why the worker, the teambuilder and the API all call it before touching the
  // Dex. `custom: true` is the flag a caller can check before assuming a format
  // exists in a bare @pkmn/sim.
  { id: "gen9championsvgc2026regmb", label: "VGC 2026 Reg M-B (Champions)", kind: "team", gen: 9, teamSize: 6, doubles: true, custom: true, statSystem: "sp" },
  { id: "gen9championsvgc2026regma", label: "VGC 2026 Reg M-A (Champions)", kind: "team", gen: 9, teamSize: 6, doubles: true, custom: true, statSystem: "sp" },
  { id: "gen9teras", label: "Gen 9 Teras", kind: "team", gen: 9, teamSize: 6, custom: true },
] as const;

/** Formats this package registers itself — see `mods/register.ts`. */
export const BSIM_CUSTOM_FORMAT_IDS = ["gen9teras"] as const;

export function formatsFor(kind: BsimFormatKind): BsimFormat[] {
  return BSIM_FORMATS.filter((f) => f.kind === kind);
}

export function getFormat(id: string): BsimFormat | undefined {
  return BSIM_FORMATS.find((f) => f.id === id);
}

export function isRandomFormat(id: string): boolean {
  return getFormat(id)?.kind === "random";
}

/**
 * Whether the simulator may be handed this id at all.
 *
 * The gateway calls this before touching `BattleStream`: an unknown format is a
 * client error, not a crash in a room nobody can leave.
 */
export function isKnownFormat(id: string): boolean {
  return getFormat(id) !== undefined;
}

// ---------------------------------------------------------------------------
// Stat budgets (D-stat). The teambuilder drives its sliders, its IV/level
// controls and its "final stat" column off these two functions, so that a
// format's stat system is a property of the format table and not a branch
// duplicated in the UI.
// ---------------------------------------------------------------------------

/** Mainline EV budget. */
export const EV_PER_STAT = 252;
/** Mainline EV budget. */
export const EV_TOTAL = 510;

export interface BsimStatLimits {
  system: BsimStatSystem;
  /** ev: 252   sp: 32 */
  perStat: number;
  /** ev: 510   sp: 66 */
  total: number;
  /** Slider step. ev: 4   sp: 1 */
  step: number;
  /** Non-null means IVs are not editable. ev: null   sp: 31 */
  lockedIvs: number | null;
  /** Non-null means level is not editable. ev: null   sp: 50 */
  fixedLevel: number | null;
}

const EV_LIMITS: BsimStatLimits = {
  system: "ev",
  perStat: EV_PER_STAT,
  total: EV_TOTAL,
  step: 4,
  lockedIvs: null,
  fixedLevel: null,
};

const SP_LIMITS: BsimStatLimits = {
  system: "sp",
  perStat: CHAMPIONS_SP_PER_STAT,
  total: CHAMPIONS_SP_TOTAL,
  step: 1,
  lockedIvs: CHAMPIONS_FIXED_IV,
  fixedLevel: CHAMPIONS_FIXED_LEVEL,
};

/**
 * The stat budget for a format. Unknown ids fall back to the mainline EV
 * budget, which is the safe default: it is what every non-Champions format
 * uses, and a UI that guesses wrong there is merely showing 510 for a format
 * that does not exist.
 */
export function statLimitsFor(formatId: string): BsimStatLimits {
  return getFormat(formatId)?.statSystem === "sp" ? SP_LIMITS : EV_LIMITS;
}

export type BsimStatId = "hp" | "atk" | "def" | "spa" | "spd" | "spe";

/** The sim's own 16-bit truncation (`ModdedDex#trunc`). */
function trunc(num: number, bits = 0): number {
  return bits ? (num >>> 0) % 2 ** bits : num >>> 0;
}

/**
 * Final stat at the given level/nature, using the format's own stat system.
 *
 * For an `"ev"` format this is the mainline formula (including the Shedinja
 * `base === 1` HP special case). For an `"sp"` format `ev` is read as Stat
 * Points and `iv`/`level` are ignored — Champions Pokémon are always level 50
 * with 31 IVs — reproducing the mod's own `statModify`:
 *
 *   hp    = base + SP + 75
 *   other = nature x (base + SP + 20), the nature multiplier being the sim's
 *           16-bit-truncated x110/100 and x90/100.
 */
export function calcStat(
  formatId: string,
  stat: BsimStatId,
  base: number,
  iv: number,
  ev: number,
  level: number,
  nature: string,
): number {
  const limits = statLimitsFor(formatId);
  const n = PkmnDex.natures.get(nature);
  const plus = n?.exists ? n.plus : undefined;
  const minus = n?.exists ? n.minus : undefined;

  if (limits.system === "sp") {
    // Shedinja has no Wonder Guard equivalent here, but a 1-HP base species
    // would still be wrong to run through the additive formula.
    if (stat === "hp") return base === 1 ? 1 : base + ev + 75;
    let s = base + ev + 20;
    if (plus === stat) s = trunc(trunc(s * 110, 16) / 100);
    else if (minus === stat) s = trunc(trunc(s * 90, 16) / 100);
    return s;
  }

  if (stat === "hp" && base === 1) return 1; // Shedinja
  const core = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100);
  if (stat === "hp") return core + level + 10;
  const mult = plus === stat ? 1.1 : minus === stat ? 0.9 : 1;
  return Math.floor((core + 5) * mult);
}
