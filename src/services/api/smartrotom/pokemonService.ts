import { Pokemon } from "@/app/smartrotom/pokedex/_types/pokemon";
import { rotomGET } from "@/services/boffAPI"
import { EvolutionTree, PokedexData, PokemonMove, Registry } from "@/types/pokedex";

type ImageResult = {
  url: string;
  type: string;
  status: number;
  showImg: boolean;
}

type ItemSpriteResult = {
  url: string;
}

export const pokemonService = {
  getAllPokemon: () => rotomGET("/pokemon"),
  getPokemonByDex: (dex: number) => rotomGET<Pokemon>(`/pokemon/dex/${dex}`),
  getAllMoves: () => rotomGET("/pokemon/moves"),
  getMoves: (id: number, form: number) => rotomGET<PokemonMove[]>(`/pokemon/moves/${id}/${form}`),
  getPokemonNames: () => rotomGET("/pokemon/names"),
  getSpawnByPokemon: (name: string) => rotomGET(`/pokemon/spawns/${name}`),
  getMove: (name: string) => rotomGET(`/pokemon/move/${name}`),
  getPokemonByMove: (name: string) => rotomGET(`/pokemon/move/${name}/pokemon`),
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
  getNextPrev: (id: number) => rotomGET<{next: Pokemon, prev: Pokemon}>(`/pokemon/nextprev/${id}`),
  getEvoTree: (id: number) => rotomGET<EvolutionTree>(`/pokemon/evotree/${id}`),
  searchPokemonByName: (name: string) => rotomGET(`/pokemon/search/species/${name}`),
  getRegistries: (uuid: string) => rotomGET<Registry[]>(`/pokemon/registries/${uuid}`),
  getPokedexStatus:  (uuid: string) => rotomGET<PokedexData>(`/pokemon/pokedex-status/${uuid}`),
}

