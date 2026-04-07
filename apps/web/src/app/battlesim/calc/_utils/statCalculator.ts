import { GenerationNum } from "@pkmn/dex";
import { StatsTable, BoostsTable } from "../types";
import { NATURE_MODIFIERS } from "./pokemonData";
import { calcStat } from "@smogon/calc";

export class StatCalculator {
  /**
   * Calculate a Pokémon's actual stat using the @smogon/calc calcStat function
   */
  static calculateStat(base: number, ev: number, iv: number, level: number, nature: string, statId: keyof StatsTable, gen: GenerationNum = 9): number {
    return calcStat(gen, statId, base, iv, ev, level, nature);
  }
  

  /**
   * Apply stat boosts to a base stat value
   */
  static applyBoosts(stat: number, boost: number): number {
    const numerator = boost > 0 ? (2 + boost) : 2;
    const denominator = boost > 0 ? 2 : (2 - boost);
    return Math.floor(stat * (numerator / denominator));
  }

  /**
   * Get nature multipliers for stats calculation
   */
  static getNatureMultipliers(natureName: string): Record<string, number> {
    return NATURE_MODIFIERS[natureName] || {};
  }

  /**
   * Calculate all stats for a Pokémon using @smogon/calc calcStat
   */
  static calculateAllStats(
    baseStats: StatsTable, 
    evs: StatsTable, 
    ivs: StatsTable, 
    level: number, 
    nature: string,
    gen: GenerationNum = 9
  ): StatsTable {
    return {
      hp: this.calculateStat(baseStats.hp, evs.hp, ivs.hp, level, nature, 'hp', gen),
      atk: this.calculateStat(baseStats.atk, evs.atk, ivs.atk, level, nature, 'atk', gen),
      def: this.calculateStat(baseStats.def, evs.def, ivs.def, level, nature, 'def', gen),
      spa: this.calculateStat(baseStats.spa, evs.spa, ivs.spa, level, nature, 'spa', gen),
      spd: this.calculateStat(baseStats.spd, evs.spd, ivs.spd, level, nature, 'spd', gen),
      spe: this.calculateStat(baseStats.spe, evs.spe, ivs.spe, level, nature, 'spe', gen),
    };
  }
  
  /**
   * Apply boosts to all stats
   */
  static applyAllBoosts(stats: StatsTable, boosts: BoostsTable): StatsTable {
    return {
      hp: stats.hp,  // HP is never boosted
      atk: this.applyBoosts(stats.atk, boosts.atk),
      def: this.applyBoosts(stats.def, boosts.def),
      spa: this.applyBoosts(stats.spa, boosts.spa),
      spd: this.applyBoosts(stats.spd, boosts.spd),
      spe: this.applyBoosts(stats.spe, boosts.spe)
    };
  }
}