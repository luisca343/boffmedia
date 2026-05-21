import { Injectable } from '@nestjs/common';
import { StatSpread } from '@/_db/schema/Vgc';

/**
 * Nature multiplier map. Only boosted (Ã—1.1) and hindered (Ã—0.9) stats are listed;
 * neutral natures (Hardy, Docile, Serious, Bashful, Quirky) default to 1.0 for all.
 * NOTE: replace with @pkmn/sim native support once Champions formula is implemented there.
 */
const NATURE_MULTIPLIERS: Record<
  string,
  Partial<Record<keyof StatSpread, number>>
> = {
  Lonely: { atk: 1.1, def: 0.9 },
  Adamant: { atk: 1.1, spa: 0.9 },
  Naughty: { atk: 1.1, spd: 0.9 },
  Brave: { atk: 1.1, spe: 0.9 },
  Bold: { def: 1.1, atk: 0.9 },
  Impish: { def: 1.1, spa: 0.9 },
  Lax: { def: 1.1, spd: 0.9 },
  Relaxed: { def: 1.1, spe: 0.9 },
  Modest: { spa: 1.1, atk: 0.9 },
  Mild: { spa: 1.1, def: 0.9 },
  Rash: { spa: 1.1, spd: 0.9 },
  Quiet: { spa: 1.1, spe: 0.9 },
  Calm: { spd: 1.1, atk: 0.9 },
  Gentle: { spd: 1.1, def: 0.9 },
  Careful: { spd: 1.1, spa: 0.9 },
  Sassy: { spd: 1.1, spe: 0.9 },
  Timid: { spe: 1.1, atk: 0.9 },
  Hasty: { spe: 1.1, def: 0.9 },
  Jolly: { spe: 1.1, spa: 0.9 },
  Naive: { spe: 1.1, spd: 0.9 },
};

@Injectable()
export class StatCalcService {
  /**
   * Compute final Champions stats from base stats + SP allocation + nature.
   *
   *   HP  = Base + SP + 75
   *   Any = floor((Base + SP + 20) Ã— alignment)
   *
   * SP budget: 66 total, max 32 per stat.
   */
  computeChampionsStats(
    base: StatSpread,
    sps: StatSpread,
    nature: string,
  ): StatSpread {
    const mults = NATURE_MULTIPLIERS[nature] ?? {};
    const calc = (b: number, sp: number, key: keyof StatSpread): number =>
      key === 'hp'
        ? b + sp + 75
        : Math.floor((b + sp + 20) * (mults[key] ?? 1.0));

    return {
      hp: calc(base.hp, sps.hp, 'hp'),
      atk: calc(base.atk, sps.atk, 'atk'),
      def: calc(base.def, sps.def, 'def'),
      spa: calc(base.spa, sps.spa, 'spa'),
      spd: calc(base.spd, sps.spd, 'spd'),
      spe: calc(base.spe, sps.spe, 'spe'),
    };
  }

  /** Validate that a SP spread is within Champions rules (sum â‰¤ 66, each â‰¤ 32). */
  isValidChampionsSpread(sps: StatSpread): boolean {
    const values = Object.values(sps);
    return (
      values.every((v) => v >= 0 && v <= 32) &&
      values.reduce((a, b) => a + b, 0) <= 66
    );
  }
}
