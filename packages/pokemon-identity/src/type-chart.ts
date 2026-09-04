/**
 * Pokemon type effectiveness chart for Generation 9.
 *
 * Stores only non-neutral (≠1) entries. For any unlisted attacking type vs
 * defending type combination, the effectiveness is 1×.
 */

export type TypeName =
  | 'Normal'
  | 'Fire'
  | 'Water'
  | 'Electric'
  | 'Grass'
  | 'Ice'
  | 'Fighting'
  | 'Poison'
  | 'Ground'
  | 'Flying'
  | 'Psychic'
  | 'Bug'
  | 'Rock'
  | 'Ghost'
  | 'Dragon'
  | 'Dark'
  | 'Steel'
  | 'Fairy';

/**
 * A single chart entry: 0 (immune), 0.5 (resists), 2 (super-effective).
 * Neutral matchups are not stored, so 1 never appears in the chart itself.
 */
export type TypeMatchup = 0 | 0.5 | 2;

/**
 * A stacked multiplier over a defender's type(s). Dual types multiply, so the
 * quad cases (0.25 and 4) are reachable and are NOT collapsed to neutral —
 * consumers count quad-weaknesses and double-resistances off these values.
 */
export type TypeEffectiveness = 0 | 0.25 | 0.5 | 1 | 2 | 4;

/**
 * Type effectiveness chart. Maps attacking type → defending type → multiplier.
 * Only non-neutral entries are stored; unlisted combinations are 1×.
 */
export const TYPE_EFF: Record<TypeName, Record<string, TypeMatchup>> = {
  Normal: { Ghost: 0, Rock: 0.5, Steel: 0.5 },
  Fire: { Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5, Grass: 2, Ice: 2, Bug: 2, Steel: 2 },
  Water: { Water: 0.5, Grass: 0.5, Dragon: 0.5, Fire: 2, Ground: 2, Rock: 2 },
  Electric: { Ground: 0, Electric: 0.5, Grass: 0.5, Dragon: 0.5, Water: 2, Flying: 2 },
  Grass: {
    Fire: 0.5,
    Grass: 0.5,
    Poison: 0.5,
    Flying: 0.5,
    Bug: 0.5,
    Dragon: 0.5,
    Steel: 0.5,
    Water: 2,
    Ground: 2,
    Rock: 2,
  },
  Ice: { Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5, Grass: 2, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: {
    Ghost: 0,
    Poison: 0.5,
    Flying: 0.5,
    Psychic: 0.5,
    Bug: 0.5,
    Fairy: 0.5,
    Normal: 2,
    Ice: 2,
    Rock: 2,
    Dark: 2,
    Steel: 2,
  },
  Poison: { Steel: 0, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Grass: 2, Fairy: 2 },
  Ground: { Flying: 0, Grass: 0.5, Bug: 0.5, Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2 },
  Flying: { Electric: 0.5, Rock: 0.5, Steel: 0.5, Grass: 2, Fighting: 2, Bug: 2 },
  Psychic: { Dark: 0, Psychic: 0.5, Steel: 0.5, Fighting: 2, Poison: 2 },
  Bug: {
    Fire: 0.5,
    Fighting: 0.5,
    // Poison was MISSING from the VGC damage calculator's chart, which defaulted
    // it to 1x. Bug is not very effective against Poison from Gen 2 onward (it
    // was 2x in Gen 1 only). SmartRotom's Pokédex chart had it right; the
    // calculator did not. Verified against @pkmn/sim's `damageTaken`.
    Poison: 0.5,
    Flying: 0.5,
    Ghost: 0.5,
    Steel: 0.5,
    Fairy: 0.5,
    Grass: 2,
    Psychic: 2,
    Dark: 2,
  },
  Rock: { Fighting: 0.5, Ground: 0.5, Steel: 0.5, Fire: 2, Ice: 2, Flying: 2, Bug: 2 },
  Ghost: { Normal: 0, Dark: 0.5, Ghost: 2, Psychic: 2 },
  Dragon: { Fairy: 0, Steel: 0.5, Dragon: 2 },
  Dark: { Fighting: 0.5, Dark: 0.5, Fairy: 0.5, Ghost: 2, Psychic: 2 },
  Steel: { Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5, Ice: 2, Rock: 2, Fairy: 2 },
  Fairy: { Fire: 0.5, Poison: 0.5, Steel: 0.5, Fighting: 2, Dragon: 2, Dark: 2 },
};

/** All 18 types in Pokédex order. Useful for iteration and UI lists. */
export const ALL_TYPES: readonly TypeName[] = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
];

/**
 * Calculate type effectiveness when a Pokémon with `atkType` attacks a
 * Pokémon with `defTypes`.
 *
 * For dual-type defenders, multipliers stack multiplicatively.
 *
 * @param atkType - The attacking type.
 * @param defTypes - One or more defending types.
 * @returns The effectiveness multiplier (0, 0.5, 1, or 2).
 *
 * @example
 * effectiveness('Fire', ['Ice']) // 2 (Fire is super-effective vs Ice)
 * effectiveness('Fire', ['Water']) // 0.5 (Fire resists vs Water)
 * effectiveness('Fire', ['Water', 'Steel']) // 0.25 (both stack)
 * effectiveness('Water', ['Normal']) // 1 (neutral)
 */
export function effectiveness(
  atkType: string,
  defTypes: string[]
): TypeEffectiveness {
  let mult = 1;
  for (const dt of defTypes) {
    const val = TYPE_EFF[atkType as TypeName]?.[dt] ?? 1;
    mult *= val;
  }
  // The product is returned as-is. This function used to clamp anything that
  // was not exactly 0, 0.5 or 2 down to 1, which silently erased every quad
  // weakness and double resistance — the two cases a coverage grid exists to
  // show. Defined for a defender with one or two types, which is every real
  // Pokémon; a third type could only arise from bad data.
  return mult as TypeEffectiveness;
}

/**
 * Best effectiveness `pokemonTypes` can achieve against one defending type via
 * STAB (Same-Type Attack Bonus eligibility).
 *
 * Returns the maximum effectiveness among all of the attacker's types.
 *
 * @param pokemonTypes - The attacking Pokémon's types.
 * @param defenderType - The defending type.
 * @returns The best possible effectiveness multiplier.
 */
export function getBestOffenseEff(pokemonTypes: string[], defenderType: string): TypeEffectiveness {
  const effs = pokemonTypes.map((pt) => effectiveness(pt, [defenderType]));
  return Math.max(...effs) as TypeEffectiveness;
}
