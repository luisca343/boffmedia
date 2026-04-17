export interface Modifiers {
  boost: number;     // stat stage: -6 to +6 (VGC typically -2 to +4)
  tailwind: boolean;
  scarf: boolean;
  paralysis: boolean;
}

export const DEFAULT_MODIFIERS: Modifiers = {
  boost: 0,
  tailwind: false,
  scarf: false,
  paralysis: false,
};

export function hasModifiers(m: Modifiers): boolean {
  return m.boost !== 0 || m.tailwind || m.scarf || m.paralysis;
}

/** Level 50 speed stat formula — 31 IVs assumed. */
export function calcSpeedStat(base: number, evs: number, nature: number): number {
  return Math.floor(
    (Math.floor(((2 * base + 31 + Math.floor(evs / 4)) * 50) / 100) + 5) * nature,
  );
}

/**
 * Apply speed modifiers in Gen 9 order:
 *   stat stage → item (Scarf) → field (Tailwind) → status (Paralysis)
 */
export function applyMods(stat: number, mods: Modifiers, canHoldScarf = true): number {
  let s = stat;
  if (mods.boost > 0) s = Math.floor((s * (2 + mods.boost)) / 2);
  else if (mods.boost < 0) s = Math.floor((s * 2) / (2 - mods.boost));
  if (mods.scarf && canHoldScarf) s = Math.floor(s * 1.5);
  if (mods.tailwind) s = Math.floor(s * 2);
  if (mods.paralysis) s = Math.floor(s * 0.5);
  return s;
}

export interface ComputedSpeeds {
  s0n: number;
  s0p: number;
  s252n: number;
  s252p: number;
  /** null when scarf modifier already active (double-apply) or Pokémon has a locked item */
  scarf: number | null;
  scarfPlus: number | null;
}

export function computeSpeeds(
  baseSpeed: number,
  requiredItem: string | null,
  mods: Modifiers,
): ComputedSpeeds {
  const canHold = !requiredItem;
  const calc = (evs: number, nat: number) =>
    applyMods(calcSpeedStat(baseSpeed, evs, nat), mods, canHold);

  const scarfMods: Modifiers = { ...mods, scarf: true };
  return {
    s0n: calc(0, 1.0),
    s0p: calc(0, 1.1),
    s252n: calc(252, 1.0),
    s252p: calc(252, 1.1),
    scarf: !mods.scarf && canHold
      ? applyMods(calcSpeedStat(baseSpeed, 252, 1.0), scarfMods, true)
      : null,
    scarfPlus: !mods.scarf && canHold
      ? applyMods(calcSpeedStat(baseSpeed, 252, 1.1), scarfMods, true)
      : null,
  };
}

export type Comparison = 'faster' | 'tie' | 'slower';

export function compareSpeed(a: number, b: number): Comparison {
  if (a > b) return 'faster';
  if (a === b) return 'tie';
  return 'slower';
}
