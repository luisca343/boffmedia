
import { rotomGET } from "@/services/boffAPI"
import { EvolutionTree, PokedexData, PokemonMove, Registry } from "@/types/pokedex";
import { NextPrev, Pokemon, SpeciesMoveEntry, SpriteManifest } from "@/types/Pokemon";

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


export interface MoveCount {
    name: string;
    count: number;
}

export type AbilityCount = {
  name: string;
  count: number;
};

export type Ability = {
  name: string;
  isHidden?: boolean;
};

export class PokemonService {
  /**
   * Get all Pokemon
   */
  static getAllPokemon() {
    return rotomGET("/pokemon");
  }

  /**
   * Get Pokemon by Pokedex number
   */
  static getPokemonByDex(dex: number) {
    return rotomGET<Pokemon>(`/pokemon/dex/${dex}`);
  }

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
   * Get all Pokemon names
   */
  static getPokemonNames() {
    return rotomGET("/pokemon/names");
  }

  /**
   * Get spawn data for a Pokemon
   */
  static getSpawnByPokemon(name: string) {
    return rotomGET(`/pokemon/spawns/${name}`);
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

  /**
   * Get all biomes
   */
  static getBiomes() {
    return rotomGET("/pokemon/biomes");
  }

  /**
   * Get Pokemon found in a specific biome
   */
  static getPokemonByBiome(name: string) {
    return rotomGET(`/pokemon/biome/${name}`);
  }

  /**
   * Get Pokemon image
   */
  static getImage(params: { pokemonId: number; formName: string; paletteName: string; uuid: string; hide: number }) {
    return rotomGET<ImageResult>(
      `/pokemon/image/${params.pokemonId}/${params.formName}/${params.paletteName}/${params.uuid}/${params.hide}`,
    );
  }

  /**
   * Get Pokemon sprite
   */
  static getSprite(params: { pokemonId: number; formName: string; paletteName: string; uuid: string; hide: number }) {
    return rotomGET<ImageResult>(
      `/pokemon/sprite/${params.pokemonId}/${params.formName}/${params.paletteName}/${params.uuid}/${params.hide}`,
    );
  }

  /**
   * Get item sprite
   */
  static getItemSprite(name: string) {
    return rotomGET<ItemSpriteResult>(`/pokemon/item/sprite/${name}`);
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

  /**
   * Search Pokemon by name
   */
  static searchPokemonByName(name: string) {
    return rotomGET(`/pokemon/search/species/${name}`);
  }

  /**
   * Get registries for a user
   */
  static getRegistries(uuid: string) {
    return rotomGET<Registry[]>(`/pokemon/registries/${uuid}`);
  }

  /**
   * Get Pokedex status for a user
   */
  static getPokedexStatus(uuid: string) {
    return rotomGET<PokedexData>(`/pokemon/pokedex-status/${uuid}`);
  }

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
    return rotomGET<{ count: number }>("/pokemon/sprites/refresh");
  }
}

