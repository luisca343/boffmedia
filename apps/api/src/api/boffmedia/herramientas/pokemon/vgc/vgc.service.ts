import { Injectable, NotFoundException } from '@nestjs/common';
import { Dex } from '@pkmn/sim';
import { CHAMPIONS_REGULATIONS, ChampionsRegulation } from './champions-data';
import { initChampionsMod } from './champions.mod';

export interface VgcPokemon {
  name: string;
  num: number;
  types: string[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  };
  abilities: { [slot: string]: string };
  weightkg: number;
  isRestricted: boolean;
  isMythical: boolean;
  /** Item the species is locked into (e.g. Mega Stones, Orbs). Null when free to hold any item. */
  requiredItem: string | null;
}

export interface SpeedTierEntry {
  name: string;
  num: number;
  types: string[];
  baseSpeed: number;
  abilities: { [slot: string]: string };
  isRestricted: boolean;
  isMythical: boolean;
  /** Null when the species is locked into a required item (Mega Stone, Orb, etc.) */
  requiredItem: string | null;
  speedTiers: {
    min: number;
    minPlus: number;
    max: number;
    maxPlus: number;
    /** Null when the species cannot hold a Choice Scarf (locked item). */
    scarf: number | null;
    /** Null when the species cannot hold a Choice Scarf (locked item). */
    scarfPlus: number | null;
  };
}

@Injectable()
export class VgcService {
  constructor() {
    // Register the Champions mod into @pkmn/sim so that Champions format IDs
    // (e.g. 'gen9championsvgc2026regma') are queryable via Dex.forFormat().
    initChampionsMod();
  }

  /**
   * Returns all legal Pokémon for a given format ID.
   * Works for both standard VGC formats (e.g. 'gen9vgc2025regj') and
   * Champions formats (e.g. 'gen9championsvgc2026regma') after mod init.
   */
  getLegalPokemon(formatId: string): VgcPokemon[] {
    const format = Dex.formats.get(formatId);
    if (!format.exists) {
      throw new NotFoundException(
        `Format "${formatId}" not found. ` +
        `Use GET /tools/vgc/formats for standard VGC formats or ` +
        `GET /tools/vgc/champions/regulations for Champions format IDs.`,
      );
    }

    const dex = Dex.forFormat(format);
    const restrictedTags = new Set(format.restricted ?? []);

    return dex.species
      .all()
      .filter((s) => {
        if (!s.exists) return false;
        if (s.isNonstandard) return false;
        // Alternate forms (e.g. Meloetta-Pirouette) may lack their own FormatsData
        // entry while their base form is banned. Inherit the base species ban.
        if (s.baseSpecies !== s.name) {
          const base = dex.species.get(s.baseSpecies);
          if (!base.exists || base.isNonstandard) return false;
        }
        return true;
      })
      .map((s) => ({
        name: s.name,
        num: s.num,
        types: s.types as string[],
        baseStats: {
          hp: s.baseStats.hp,
          atk: s.baseStats.atk,
          def: s.baseStats.def,
          spa: s.baseStats.spa,
          spd: s.baseStats.spd,
          spe: s.baseStats.spe,
        },
        abilities: s.abilities as unknown as { [slot: string]: string },
        weightkg: s.weightkg,
        isRestricted: s.tags ? s.tags.some((t) => restrictedTags.has(t) && t === 'Restricted Legendary') : false,
        isMythical: s.tags?.includes('Mythical') ?? false,
        requiredItem: s.requiredItem ?? null,
      }));
  }

  /**
   * Returns speed-tier data sorted by base Speed descending.
   * Works for any format ID (standard or Champions).
   */
  getSpeedTiers(formatId: string): SpeedTierEntry[] {
    return this.getLegalPokemon(formatId)
      .map((p) => ({
        name: p.name,
        num: p.num,
        types: p.types,
        baseSpeed: p.baseStats.spe,
        abilities: p.abilities,
        isRestricted: p.isRestricted,
        isMythical: p.isMythical,
        requiredItem: p.requiredItem,
        speedTiers: {
          min: this.calcSpeed(p.baseStats.spe, 0, 1.0),
          minPlus: this.calcSpeed(p.baseStats.spe, 0, 1.1),
          max: this.calcSpeed(p.baseStats.spe, 252, 1.0),
          maxPlus: this.calcSpeed(p.baseStats.spe, 252, 1.1),
          scarf: p.requiredItem ? null : Math.floor(this.calcSpeed(p.baseStats.spe, 252, 1.0) * 1.5),
          scarfPlus: p.requiredItem ? null : Math.floor(this.calcSpeed(p.baseStats.spe, 252, 1.1) * 1.5),
        },
      }))
      .sort((a, b) => b.baseSpeed - a.baseSpeed);
  }

  // ==================== CHAMPIONS MOD ====================

  /**
   * Returns the list of Champions regulations with their format IDs.
   */
  getChampionsRegulations(): ChampionsRegulation[] {
    return Object.values(CHAMPIONS_REGULATIONS);
  }

  // ==================== SHARED ====================

  /**
   * Speed stat formula at level 50:
   * floor((floor((2*base + iv + floor(ev/4)) * level/100) + 5) * nature)
   */
  private calcSpeed(base: number, evs: number, nature: number, iv = 31, level = 50): number {
    return Math.floor(
      (Math.floor(((2 * base + iv + Math.floor(evs / 4)) * level) / 100) + 5) * nature,
    );
  }
}
