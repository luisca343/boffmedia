import { StatsTable, BoostsTable } from "../types";
import { NATURE_MODIFIERS } from "./pokemonData";

export class StatCalculator {
  /**
   * Calculate a Pokémon's actual stat based on base stat, EVs, IVs, nature and level
   */
  static calculateStat(base: number, ev: number, iv: number, level: number, nature: number, isHP: boolean): number {
    if (isHP) {
      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    } else {
      return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
    }
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
   * Calculate all stats for a Pokémon
   */
  static calculateAllStats(
    baseStats: StatsTable, 
    evs: StatsTable, 
    ivs: StatsTable, 
    level: number, 
    nature: string
  ): StatsTable {
    const natureModifiers = this.getNatureMultipliers(nature);
    
    return {
      hp: this.calculateStat(baseStats.hp, evs.hp, ivs.hp, level, 1, true),
      atk: this.calculateStat(baseStats.atk, evs.atk, ivs.atk, level, natureModifiers.atk || 1, false),
      def: this.calculateStat(baseStats.def, evs.def, ivs.def, level, natureModifiers.def || 1, false),
      spa: this.calculateStat(baseStats.spa, evs.spa, ivs.spa, level, natureModifiers.spa || 1, false),
      spd: this.calculateStat(baseStats.spd, evs.spd, ivs.spd, level, natureModifiers.spd || 1, false),
      spe: this.calculateStat(baseStats.spe, evs.spe, ivs.spe, level, natureModifiers.spe || 1, false),
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