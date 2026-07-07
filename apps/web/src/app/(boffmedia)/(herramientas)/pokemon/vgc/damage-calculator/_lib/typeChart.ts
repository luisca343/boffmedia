// Gen 9 type chart — only non-neutral (≠1) entries; everything else is 1×.
export const TYPE_EFF: Record<string, Record<string, number>> = {
  Normal:   { Ghost: 0, Rock: 0.5, Steel: 0.5 },
  Fire:     { Fire: 0.5, Water: 0.5, Rock: 0.5, Dragon: 0.5, Grass: 2, Ice: 2, Bug: 2, Steel: 2 },
  Water:    { Water: 0.5, Grass: 0.5, Dragon: 0.5, Fire: 2, Ground: 2, Rock: 2 },
  Electric: { Ground: 0, Electric: 0.5, Grass: 0.5, Dragon: 0.5, Water: 2, Flying: 2 },
  Grass:    { Fire: 0.5, Grass: 0.5, Poison: 0.5, Flying: 0.5, Bug: 0.5, Dragon: 0.5, Steel: 0.5, Water: 2, Ground: 2, Rock: 2 },
  Ice:      { Fire: 0.5, Water: 0.5, Ice: 0.5, Steel: 0.5, Grass: 2, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: { Ghost: 0, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Fairy: 0.5, Normal: 2, Ice: 2, Rock: 2, Dark: 2, Steel: 2 },
  Poison:   { Steel: 0, Poison: 0.5, Ground: 0.5, Rock: 0.5, Ghost: 0.5, Grass: 2, Fairy: 2 },
  Ground:   { Flying: 0, Grass: 0.5, Bug: 0.5, Fire: 2, Electric: 2, Poison: 2, Rock: 2, Steel: 2 },
  Flying:   { Electric: 0.5, Rock: 0.5, Steel: 0.5, Grass: 2, Fighting: 2, Bug: 2 },
  Psychic:  { Dark: 0, Psychic: 0.5, Steel: 0.5, Fighting: 2, Poison: 2 },
  Bug:      { Fire: 0.5, Fighting: 0.5, Flying: 0.5, Ghost: 0.5, Steel: 0.5, Fairy: 0.5, Grass: 2, Psychic: 2, Dark: 2 },
  Rock:     { Fighting: 0.5, Ground: 0.5, Steel: 0.5, Fire: 2, Ice: 2, Flying: 2, Bug: 2 },
  Ghost:    { Normal: 0, Dark: 0.5, Ghost: 2, Psychic: 2 },
  Dragon:   { Fairy: 0, Steel: 0.5, Dragon: 2 },
  Dark:     { Fighting: 0.5, Dark: 0.5, Fairy: 0.5, Ghost: 2, Psychic: 2 },
  Steel:    { Fire: 0.5, Water: 0.5, Electric: 0.5, Steel: 0.5, Ice: 2, Rock: 2, Fairy: 2 },
  Fairy:    { Fire: 0.5, Poison: 0.5, Steel: 0.5, Fighting: 2, Dragon: 2, Dark: 2 },
}

export const ALL_TYPES = [
  "Normal", "Fire", "Water", "Electric", "Grass", "Ice",
  "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug",
  "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy",
]

export function getTypeEff(atkType: string, defTypes: string[]): number {
  let mult = 1
  for (const dt of defTypes) mult *= TYPE_EFF[atkType]?.[dt] ?? 1
  return mult
}

// Best effectiveness `pokemonTypes` can achieve against one defenderType via STAB.
export function getBestOffenseEff(pokemonTypes: string[], defenderType: string): number {
  return Math.max(...pokemonTypes.map((pt) => getTypeEff(pt, [defenderType])))
}
