
import { rotomGET } from "@/services/boffAPI"
import { EvolutionTree, PokedexData, PokemonMove, Registry } from "@/types/pokedex";
import { NextPrev, Pokemon, SpeciesMoveEntry } from "@/types/Pokemon";

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

export const pokemonService = {
  getAllPokemon: () => rotomGET("/pokemon"),
  getPokemonByDex: (dex: number) => rotomGET<Pokemon>(`/pokemon/dex/${dex}`),
  getAllMoves: () => rotomGET<MoveCount[]>("/pokemon/moves"),
  getMoves: (id: number, form: number) => rotomGET<PokemonMove[]>(`/pokemon/moves/${id}/${form}`),
  getPokemonNames: () => rotomGET("/pokemon/names"),
  getSpawnByPokemon: (name: string) => rotomGET(`/pokemon/spawns/${name}`),
  getMove: (name: string) => rotomGET<Move>(`/pokemon/move/${name}`),
  getPokemonByMove: (name: string) => rotomGET<SpeciesMoveEntry[]>(`/pokemon/move/${name}/pokemon`),
  getBiomes: () => rotomGET("/pokemon/biomes"),
  getPokemonByBiome: (name: string) => rotomGET(`/pokemon/biome/${name}`),
  getImage: (params: { pokemonId: number; formName: string; paletteName: string; uuid: string; hide: number }) =>
    rotomGET<ImageResult>(
      `/pokemon/image/${params.pokemonId}/${params.formName}/${params.paletteName}/${params.uuid}/${params.hide}`,
    ),
  getSprite: (params: { pokemonId: number; formName: string; paletteName: string; uuid: string; hide: number }) =>
    rotomGET<ImageResult>(
      `/pokemon/sprite/${params.pokemonId}/${params.formName}/${params.paletteName}/${params.uuid}/${params.hide}`,
    ),
  getItemSprite: (name: string) => rotomGET<ItemSpriteResult>(`/pokemon/item/sprite/${name}`),
  getNextPrev: (id: number) => rotomGET<{next: NextPrev, prev: NextPrev}>(`/pokemon/nextprev/${id}`),
  getEvoTree: (id: number) => rotomGET<EvolutionTree>(`/pokemon/evotree/${id}`),
  searchPokemonByName: (name: string) => rotomGET(`/pokemon/search/species/${name}`),
  getRegistries: (uuid: string) => rotomGET<Registry[]>(`/pokemon/registries/${uuid}`),
  getPokedexStatus:  (uuid: string) => rotomGET<PokedexData>(`/pokemon/pokedex-status/${uuid}`),
  getAllAbilities: () => rotomGET<AbilityCount[]>("/pokemon/abilities"),
  getAbility: (name: string) => rotomGET<Ability>(`/pokemon/ability/${name}`),
  getPokemonByAbility: (name: string) => rotomGET<SpeciesMoveEntry[]>(`/pokemon/ability/${name}/pokemon`),
  
  
}

