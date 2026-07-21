import { Injectable } from '@nestjs/common';

// The "tasación" — what the market thinks a thing is worth. Shown next to the asking price;
// never used to charge anybody (that is always `price`, what the seller actually asked).
//
// PURE AND DETERMINISTIC BY CONTRACT. No randomness, no clock, no DB: the same mon must value
// the same every single time, or the number stops meaning anything and two screens showing the
// same Pokémon disagree. The spec is transcribed literally below — do not "improve" the curve
// without changing it everywhere at once.

export interface ValuatedMon {
  level?: number | null;
  ivs?: number[] | null;
  shiny?: boolean | null;
  legendary?: boolean | null;
  heldItem?: string | null;
}

export interface Valuation {
  value: number;
  rarity: string;
}

export const IV_TOTAL_MAX = 186; // 6 stats × 31

// Pixelmon reports an empty held-item slot as this, not as null/"".
const NO_ITEM = new Set([
  '',
  'none',
  'air',
  'minecraft:air',
  'item.minecraft.air',
]);

@Injectable()
export class WigglypopValuationService {
  /** Sum of the six IVs as a percentage of a perfect 186, rounded. */
  ivPercent(ivs?: number[] | null): number {
    if (!Array.isArray(ivs) || ivs.length === 0) return 0;
    // `Number(iv)` is deliberate: the shared PokemonW once typed `ivs` as string[], and a bare
    // `+` over that silently concatenates instead of summing.
    const sum = ivs.reduce<number>((acc, iv) => acc + Number(iv || 0), 0);
    return Math.round((sum / IV_TOTAL_MAX) * 100);
  }

  private ivSum(ivs?: number[] | null): number {
    if (!Array.isArray(ivs)) return 0;
    return ivs.reduce<number>((acc, iv) => acc + Number(iv || 0), 0);
  }

  private hasHeldItem(heldItem?: string | null): boolean {
    if (!heldItem) return false;
    return !NO_ITEM.has(heldItem.trim().toLowerCase());
  }

  rarityFor(ivPct: number, legendary?: boolean | null): string {
    if (legendary) return 'legendario';
    if (ivPct >= 92) return 'epico';
    if (ivPct >= 74) return 'raro';
    return 'comun';
  }

  valuateMon(mon: ValuatedMon): Valuation {
    const ivPct = this.ivPercent(mon.ivs);
    const level = Number(mon.level ?? 1);

    let base = 1800 + ivPct * 95 + (level / 100) * 2600;

    if (mon.shiny) base *= 4.3;
    if (mon.legendary) base *= 3.7;
    // A flawless 6IV is worth more than the IV curve alone pays out for it.
    if (this.ivSum(mon.ivs) === IV_TOTAL_MAX) base *= 1.6;
    if (this.hasHeldItem(mon.heldItem)) base += 400;

    return {
      value: Math.round(base / 50) * 50,
      rarity: this.rarityFor(ivPct, mon.legendary),
    };
  }

  /**
   * Items have no market model — they are worth their catalog reference price times how many
   * there are, and nothing else. An item missing from the catalog is worth 0 rather than a
   * guess.
   */
  valuateItems(lines: Array<{ qty: number; refPrice: number }>): Valuation {
    const value = lines.reduce(
      (acc, l) => acc + Number(l.refPrice || 0) * Number(l.qty || 0),
      0,
    );
    return { value: Math.round(value), rarity: 'comun' };
  }
}
