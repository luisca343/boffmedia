import { GenderName, StatusName, TypeName } from "@smogon/calc/dist/data/interface";
import { GenerationId } from "./generations";

// Default for Gen 1-2 (RBY, GSC)
export const DEFAULT_ATTACKER_EARLY = {
  pokemonId: "alakazam",
  moveIds: ["Psychic", "Thunder Wave", "Recover", "Seismic Toss"],
  nature: "", // No natures in Gen 1-2
  evs: { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  ivs: { hp: 15, atk: 15, def: 15, spa: 15, spd: 15, spe: 15 },
  boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  level: 100,
  teraType: "Psychic" as TypeName, // Not used in early gens
  isTerastallized: false,
  gender: "Male" as GenderName, // Gen 2 introduced gender
  ability: "", // No abilities in Gen 1, limited in Gen 2
  item: "", // No items in Gen 1, limited in Gen 2
  status: "Healthy" as StatusName,
  currentHp: 255,
  currentHpPercent: 100
};

// Default for Gen 3+ (ADV onwards)
export const DEFAULT_ATTACKER_MODERN = {
  pokemonId: "wingull",
  moveIds: ["Water Pulse", "Wing Attack", "Fly", "Supersonic"], // Realistic Wingull moves
  nature: "Modest",
  evs: { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  level: 100,
  teraType: "Water" as TypeName,
  isTerastallized: false,
  gender: "Male" as GenderName,
  ability: "Keen Eye", // Default Wingull ability
  item: "", // No item by default
  status: "Healthy" as StatusName,
  currentHp: 383,
  currentHpPercent: 100
};

// Default for Gen 9 (SV)
export const DEFAULT_ATTACKER_SV = {
  pokemonId: "wingull",
  moveIds: ["Water Pulse", "Air Slash", "Roost", "Hurricane"], // Better moves for later gens
  nature: "Modest",
  evs: { hp: 4, atk: 0, def: 0, spa: 252, spd: 0, spe: 252 },
  ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
  boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
  level: 100,
  teraType: "Water" as TypeName,
  isTerastallized: false,
  gender: "Male" as GenderName,
  ability: "Drizzle", // Hidden ability for Pelipper evolution
  item: "Choice Specs",
  status: "Healthy" as StatusName,
  currentHp: 383,
  currentHpPercent: 100
};

// Default for Teras (modded Gen 9)
export const DEFAULT_ATTACKER_TERAS = DEFAULT_ATTACKER_SV;

/**
 * Get the appropriate default attacker for a given generation
 */
export function getDefaultAttacker(generation: GenerationId) {
  // Early generations (1-2)
  if (generation === 'rb' || generation === 'gs') {
    return DEFAULT_ATTACKER_EARLY;
  }
  
  // Modern generations (3-8)
  if (generation === 'adv' || generation === 'dpp' || 
      generation === 'bw' || generation === 'xy' || 
      generation === 'sm' || generation === 'ss') {
    return DEFAULT_ATTACKER_MODERN;
  }
  
  // Gen 9 (SV)
  if (generation === 'sv') {
    return DEFAULT_ATTACKER_SV;
  }
  
  // Teras (modded Gen 9)
  if (generation === 'teras') {
    return DEFAULT_ATTACKER_TERAS;
  }
  
  // Default fallback
  return DEFAULT_ATTACKER_SV;
}

// Keep the original DEFAULT_ATTACKER for backward compatibility
export const DEFAULT_ATTACKER = DEFAULT_ATTACKER_SV;