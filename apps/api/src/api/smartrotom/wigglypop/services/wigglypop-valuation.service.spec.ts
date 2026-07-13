import { Test, TestingModule } from '@nestjs/testing';
import {
  IV_TOTAL_MAX,
  WigglypopValuationService,
} from './wigglypop-valuation.service';

// The valuation is a CONTRACT, not an implementation detail: the same Pokémon must always be
// worth the same, or two screens showing one mon disagree and the number stops meaning
// anything. These tests pin the exact formula, including its rounding.

const PERFECT: number[] = [31, 31, 31, 31, 31, 31];
const MID: number[] = [20, 20, 20, 20, 20, 20]; // 120/186 = 65% → comun
const HIGH: number[] = [28, 28, 28, 28, 28, 28]; // 168/186 = 90% → raro

describe('WigglypopValuationService', () => {
  let service: WigglypopValuationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WigglypopValuationService],
    }).compile();
    service = module.get(WigglypopValuationService);
  });

  describe('determinism', () => {
    it('values the same Pokémon identically every single time', () => {
      const mon = {
        level: 78,
        ivs: [13, 29, 4, 31, 22, 7],
        shiny: true,
        legendary: false,
        heldItem: 'pixelmon:leftovers',
      };

      const runs = Array.from({ length: 25 }, () => service.valuateMon(mon));
      const first = runs[0];

      for (const r of runs) {
        expect(r.value).toBe(first.value);
        expect(r.rarity).toBe(first.rarity);
      }
    });
  });

  describe('the formula', () => {
    // base = 1800 + ivPct*95 + (level/100)*2600, rounded to the nearest 50.
    it('prices a plain mid-IV mon off the base curve', () => {
      // ivPct = round(120/186*100) = 65 → 1800 + 6175 + 2600 = 10575 → 10600 (nearest 50)
      const { value } = service.valuateMon({ level: 100, ivs: MID });
      expect(value).toBe(Math.round((1800 + 65 * 95 + 2600) / 50) * 50);
      expect(value).toBe(10600);
    });

    it('multiplies a shiny by 4.3', () => {
      const plain = service.valuateMon({ level: 50, ivs: MID });
      const shiny = service.valuateMon({ level: 50, ivs: MID, shiny: true });

      // Compare against the unrounded base, since each result is rounded independently.
      const base = 1800 + 65 * 95 + (50 / 100) * 2600;
      expect(plain.value).toBe(Math.round(base / 50) * 50);
      expect(shiny.value).toBe(Math.round((base * 4.3) / 50) * 50);
    });

    it('multiplies a legendary by 3.7', () => {
      const base = 1800 + 65 * 95 + (50 / 100) * 2600;
      const { value } = service.valuateMon({
        level: 50,
        ivs: MID,
        legendary: true,
      });
      expect(value).toBe(Math.round((base * 3.7) / 50) * 50);
    });

    it('stacks shiny AND legendary multiplicatively', () => {
      const base = 1800 + 65 * 95 + (50 / 100) * 2600;
      const { value } = service.valuateMon({
        level: 50,
        ivs: MID,
        shiny: true,
        legendary: true,
      });
      expect(value).toBe(Math.round((base * 4.3 * 3.7) / 50) * 50);
    });

    it('applies the 1.6 flawless bonus only at a perfect 186', () => {
      const base100 = 1800 + 100 * 95 + 2600;
      const perfect = service.valuateMon({ level: 100, ivs: PERFECT });
      expect(perfect.value).toBe(Math.round((base100 * 1.6) / 50) * 50);

      // One point short of flawless gets the IV curve but NOT the bonus.
      const almost = service.valuateMon({
        level: 100,
        ivs: [31, 31, 31, 31, 31, 30],
      });
      const ivPct = Math.round((185 / IV_TOTAL_MAX) * 100); // 99
      expect(almost.value).toBe(
        Math.round((1800 + ivPct * 95 + 2600) / 50) * 50,
      );
      expect(almost.value).toBeLessThan(perfect.value);
    });

    it('adds a flat 400 for a held item, AFTER the multipliers', () => {
      const base = 1800 + 65 * 95 + 2600;
      const { value } = service.valuateMon({
        level: 100,
        ivs: MID,
        shiny: true,
        heldItem: 'pixelmon:choice_scarf',
      });
      expect(value).toBe(Math.round((base * 4.3 + 400) / 50) * 50);
    });

    it('treats Pixelmon’s empty-slot sentinels as NO held item', () => {
      const bare = service.valuateMon({ level: 50, ivs: MID });

      for (const empty of ['', 'none', 'air', 'minecraft:air', 'item.minecraft.air']) {
        expect(service.valuateMon({ level: 50, ivs: MID, heldItem: empty }).value).toBe(
          bare.value,
        );
      }
    });

    it('always rounds to the nearest 50', () => {
      for (let level = 1; level <= 100; level++) {
        const { value } = service.valuateMon({ level, ivs: HIGH });
        expect(value % 50).toBe(0);
      }
    });
  });

  describe('rarity', () => {
    it('calls anything legendary `legendario`, whatever its IVs', () => {
      // Even a terrible legendary is legendario — the flag wins over the IV bands.
      expect(
        service.valuateMon({ level: 5, ivs: [0, 0, 0, 0, 0, 0], legendary: true })
          .rarity,
      ).toBe('legendario');
    });

    it('bands a non-legendary by IV percentage', () => {
      // >= 92 → epico
      expect(service.valuateMon({ level: 50, ivs: PERFECT }).rarity).toBe('epico');
      // >= 74 → raro  (168/186 = 90%)
      expect(service.valuateMon({ level: 50, ivs: HIGH }).rarity).toBe('raro');
      // else → comun  (120/186 = 65%)
      expect(service.valuateMon({ level: 50, ivs: MID }).rarity).toBe('comun');
    });

    it('places the band boundaries exactly at 92 and 74', () => {
      // 171/186 = 91.9% → rounds to 92 → epico
      expect(service.ivPercent([31, 31, 31, 31, 31, 16])).toBe(92);
      expect(
        service.valuateMon({ level: 50, ivs: [31, 31, 31, 31, 31, 16] }).rarity,
      ).toBe('epico');

      // 138/186 = 74.2% → 74 → raro
      expect(service.ivPercent([23, 23, 23, 23, 23, 23])).toBe(74);
      expect(
        service.valuateMon({ level: 50, ivs: [23, 23, 23, 23, 23, 23] }).rarity,
      ).toBe('raro');
    });
  });

  describe('IV handling', () => {
    // The shared PokemonW once typed ivs as string[], which turned every `+` in the repo into
    // string concatenation. The service coerces, so a stringly-typed payload still SUMS.
    it('sums stringly-typed IVs numerically instead of concatenating them', () => {
      const asStrings = ['31', '31', '31', '31', '31', '31'] as unknown as number[];
      expect(service.ivPercent(asStrings)).toBe(100);
      expect(service.valuateMon({ level: 100, ivs: asStrings })).toEqual(
        service.valuateMon({ level: 100, ivs: PERFECT }),
      );
    });

    it('treats missing or empty IVs as 0%, not as a crash', () => {
      expect(service.ivPercent(null)).toBe(0);
      expect(service.ivPercent(undefined)).toBe(0);
      expect(service.ivPercent([])).toBe(0);
      expect(service.valuateMon({ level: 50, ivs: null }).rarity).toBe('comun');
    });
  });

  describe('items', () => {
    it('prices items at ref_price × qty and nothing else', () => {
      expect(
        service.valuateItems([
          { qty: 3, refPrice: 500 },
          { qty: 2, refPrice: 1250 },
        ]).value,
      ).toBe(3 * 500 + 2 * 1250);
    });

    it('values an empty lot at 0', () => {
      expect(service.valuateItems([]).value).toBe(0);
    });

    it('values an uncatalogued (0-price) item at 0 rather than guessing', () => {
      expect(service.valuateItems([{ qty: 10, refPrice: 0 }]).value).toBe(0);
    });
  });
});
