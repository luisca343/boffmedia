
import { rotomGET, rotomAuthedPOST } from '@/services/boffAPI';
import { EvolutionTree, PokedexData, PokemonMove, Registry } from "@/types/pokedex";
import { NextPrev, Pokemon, SpeciesMoveEntry, SpriteManifest } from "@/types/Pokemon";
import type { AbilityCount, MoveCount } from "@boffmedia/shared";
export type { AbilityCount, MoveCount };

type ImageResult = {
  url: string;
  type: string;
  status: number;
  showImg: boolean;
}

type ItemSpriteResult = {
  url: string;
}

export type Move = {
    attackIndex: number,
    attackName: string,
    attackType: string,
    attackCategory: string,
    basePower: number,
    ppBase: number,
    ppMax: number,
    accuracy: number,
    makesContact: boolean,
    effects: MoveEffect[],
    targetingInfo: {
        hitsAll: boolean,
        hitsOppositeFoe: boolean,
        hitsAdjacentFoe: boolean,
        hitsExtendedFoe: boolean,
        hitsSelf: boolean,
        hitsAdjacentAlly: boolean,
        hitsExtendedAlly: boolean
    },
    z: {
        crystal: string,
        attackName: string,
        basePower: number,
        effects: any[],
        allowedPokemon: any[]
    }[]
}
export type MoveEffect = {
  type: string,
  amount: number,
  isUser: boolean,
  modifiers: any[],
  persists: boolean,
  effectTypeID: string,
  weather?: string,
  percentRecoil?: number,
  weatherRock?: string,
  priority?: number,

  minHits: number,
  maxHits: number,
  stages: number,

  maxLayers?: number,
  damage?: number,
}


export type Ability = {
  name: string;
  isHidden?: boolean;
};

export class PokemonService {
  // ==================== BASIC POKEMON OPERATIONS ====================

  /**
   * Get all Pokemon
   */
  static getPokemon() {
    return rotomGET<Pokemon[]>("/pokemon");
  }

  /**
   * Get Pokemon by Pokedex number
   */
  static getPokemonByDex(dex: number) {
    return rotomGET<Pokemon>(`/pokemon/dex/${dex}`);
  }

  /**
   * Get all Pokemon names
   */
  static getPokemonNames() {
    return rotomGET<string[]>("/pokemon/names");
  }

  /**
   * Get Pokemon by name
   */
  static getPokemonByName(name: string) {
    return rotomGET<Pokemon>(`/pokemon/search/species/${name}`);
  }

  /**
   * Search Pokemon by name
   */
  static searchPokemon(name: string, amount?: number) {
    const params = amount ? `?amount=${amount}` : '';
    return rotomGET(`/pokemon/search/${name}${params}`);
  }

  /**
   * Get next/previous Pokemon in Pokedex
   */
  static getNextPrev(id: number) {
    return rotomGET<{next: NextPrev, prev: NextPrev}>(`/pokemon/nextprev/${id}`);
  }

  /**
   * Get evolution tree for a Pokemon
   */
  static getEvoTree(id: number) {
    return rotomGET<EvolutionTree>(`/pokemon/evotree/${id}`);
  }

  // ==================== MOVE OPERATIONS ====================

  /**
   * Get all moves
   */
  static getAllMoves() {
    return rotomGET<MoveCount[]>("/pokemon/moves");
  }

  /**
   * Get moves for a specific Pokemon form
   */
  static getMoves(id: number, form: number) {
    return rotomGET<PokemonMove[]>(`/pokemon/moves/${id}/${form}`);
  }

  /**
   * Get move details by name
   */
  static getMove(name: string) {
    return rotomGET<Move>(`/pokemon/move/${name}`);
  }

  /**
   * Get Pokemon that can learn a specific move
   */
  static getPokemonByMove(name: string) {
    return rotomGET<SpeciesMoveEntry[]>(`/pokemon/move/${name}/pokemon`);
  }

  // ==================== ABILITY OPERATIONS ====================

  /**
   * Get all abilities
   */
  static getAllAbilities() {
    return rotomGET<AbilityCount[]>("/pokemon/abilities");
  }

  /**
   * Get ability details by name
   */
  static getAbility(name: string) {
    return rotomGET<Ability>(`/pokemon/ability/${name}`);
  }

  /**
   * Get Pokemon that have a specific ability
   */
  static getPokemonByAbility(name: string) {
    return rotomGET<SpeciesMoveEntry[]>(`/pokemon/ability/${name}/pokemon`);
  }

  // ==================== SPAWN OPERATIONS ====================

  /**
   * Get spawn data for a Pokemon
   */
  static getSpawns(name: string) {
    return rotomGET(`/pokemon/spawns/${name}`);
  }

  /**
   * Get all biomes
   */
  static getBiomes() {
    return rotomGET<{ name: string; count: number }[]>("/pokemon/biomes");
  }

  /**
   * Get Pokemon found in a specific biome
   */
  static getPokemonByBiome(name: string) {
    return rotomGET(`/pokemon/biome/${name}`);
  }

  /**
   * Get biomes by Pokemon name
   */
  static getBiomesByPokemon(name: string) {
    return rotomGET(`/pokemon/biomes/${name}`);
  }

  // ==================== IMAGE OPERATIONS ====================

  /**
   * Get Pokemon image
   */
  static getImage(params: { 
    pokemonId: number; 
    formName: string; 
    paletteName: string; 
    uuid: string; 
    type?: string;
    hide?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params.type) queryParams.append('type', params.type);
    if (params.hide !== undefined) queryParams.append('hide', params.hide.toString());
    
    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return rotomGET<ImageResult>(
      `/pokemon/image/${params.pokemonId}/${params.formName}/${params.paletteName}/${params.uuid}${query}`
    );
  }

  /**
   * Get item sprite
   */
  static getItemSprite(name: string) {
    return rotomGET<ItemSpriteResult>(`/pokemon/sprite/item/${name}`);
  }

  // ==================== POKEDEX OPERATIONS ====================

  /**
   * Register a Pokemon encounter
   */
  static registerPokemon(uuid: string, pokemonId: number, form: string, palette: string, status: string) {
    return rotomAuthedPOST(`/pokemon/register`, { uuid, pokemonId, form, palette, status });
  }

  /**
   * Bulk update Pokedex
   */
  static updateDex(uuid: string, SEEN: number[], CAUGHT: number[]) {
    return rotomAuthedPOST(`/pokemon/dex/update`, { uuid, SEEN, CAUGHT });
  }

  /**
   * Get Pokedex statistics for user
   */
  static getDexStats(uuid: string) {
    return rotomGET(`/pokemon/dex/stats/${uuid}`);
  }

  /**
   * Get detailed Pokedex status for user
   */
  static getDetailedPokedexStatus(uuid: string) {
    return rotomGET<PokedexData>(`/pokemon/dex/detailed/${uuid}`);
  }

  /**
   * Get Pokedex registries for user
   */
  static getPokedexRegistries(uuid: string) {
    return rotomGET<Registry[]>(`/pokemon/dex/registries/${uuid}`);
  }

  // ==================== INTEGRATION OPERATIONS ====================

  /**
   * Get Teras Pokemon Showdown data
   */
  static getTerasShowdownData() {
    return rotomGET("/pokemon/showdown/teras");
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Get Pokemon Wordle data
   */
  static getWordleData() {
    return rotomGET("/pokemon/wordle");
  }

  /**
   * Get sprite manifest
   */
  static getSpriteManifest() {
    return rotomGET<SpriteManifest>("/pokemon/sprites/manifest");
  }

  /**
   * Refresh sprite manifest
   */
  static refreshSpriteManifest() {
    return rotomAuthedPOST("/pokemon/sprites/refresh", {});
  }

  /**
   * Get PMD portrait by Pokemon name
   */
  static getPmdPortrait(name: string) {
    return rotomGET(`/pokemon/pmd/portrait/${name}`);
  }

  /**
   * Get total Pokemon count
   */
  static getPokemonCount() {
    return rotomGET<{ count: number }>("/pokemon/count");
  }
}

