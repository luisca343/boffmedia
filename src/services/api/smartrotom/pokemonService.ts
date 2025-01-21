import { rotomGET } from "@/services/boffAPI"

export const pokemonService = {
  getAllPokemon: () => rotomGET("/smartrotom/pokemon"),
  getPokemonByDex: (dex: number) => rotomGET(`/smartrotom/pokemon/dex/${dex}`),
  getAllMoves: () => rotomGET("/smartrotom/pokemon/moves"),
  getMoves: (id: number, form: number) => rotomGET(`/smartrotom/pokemon/moves/${id}/${form}`),
  getPokemonNames: () => rotomGET("/smartrotom/pokemon/names"),
  getSpawnByPokemon: (name: string) => rotomGET(`/smartrotom/pokemon/spawns/${name}`),
  getMove: (name: string) => rotomGET(`/smartrotom/pokemon/move/${name}`),
  getPokemonByMove: (name: string) => rotomGET(`/smartrotom/pokemon/move/${name}/pokemon`),
  getBiomes: () => rotomGET("/smartrotom/pokemon/biomes"),
  getPokemonByBiome: (name: string) => rotomGET(`/smartrotom/pokemon/biome/${name}`),
  getImage: (params: { pokemonId: number; formName: string; paletteName: string; uuid: string; hide: number }) =>
    rotomGET(
      `/smartrotom/pokemon/image/${params.pokemonId}/${params.formName}/${params.paletteName}/${params.uuid}/${params.hide}`,
    ),
  getSprite: (params: { pokemonId: number; formName: string; paletteName: string; uuid: string; hide: number }) =>
    rotomGET(
      `/smartrotom/pokemon/sprite/${params.pokemonId}/${params.formName}/${params.paletteName}/${params.uuid}/${params.hide}`,
    ),
  getNextPrev: (id: number) => rotomGET(`/smartrotom/pokemon/nextprev/${id}`),
  getEvoTree: (id: number) => rotomGET(`/smartrotom/pokemon/evotree/${id}`),
  getItemSprite: (name: string) => rotomGET(`/smartrotom/pokemon/item/sprite/${name}`),
  searchPokemonByName: (name: string) => rotomGET(`/smartrotom/pokemon/search/species/${name}`),
  getRegistries: (uuid: string) => rotomGET(`/smartrotom/pokemon/registries/${uuid}`),
}

