import { apiGET } from '@/services/boffAPI';

export interface ChampionsRegulation {
  id: string;
  formatId: string;
  name: string;
  gameType: 'singles' | 'doubles';
  notes?: string;
}

export interface SpeedTierEntry {
  name: string;
  num: number;
  types: string[];
  baseSpeed: number;
  abilities: { [slot: string]: string };
  isRestricted: boolean;
  isMythical: boolean;
  requiredItem: string | null;
  speedTiers: {
    min: number;
    minPlus: number;
    max: number;
    maxPlus: number;
    scarf: number | null;
    scarfPlus: number | null;
  };
}

export interface VgcPokemon {
  name: string;
  num: number;
  types: string[];
  baseStats: { hp: number; atk: number; def: number; spa: number; spd: number; spe: number };
  abilities: { [slot: string]: string };
  weightkg: number;
  isRestricted: boolean;
  isMythical: boolean;
  requiredItem: string | null;
}

export class VgcService {
  static getChampionsRegulations() {
    return apiGET<ChampionsRegulation[]>('/tools/vgc/champions/regulations');
  }

  static getChampionsSpeedTiers(regulationId: string) {
    return apiGET<SpeedTierEntry[]>(`/tools/vgc/champions/${regulationId}/speed-tiers`);
  }

  static getChampionsLegalPokemon(regulationId: string) {
    return apiGET<VgcPokemon[]>(`/tools/vgc/champions/${regulationId}/pokemon`);
  }
}
