import { useRotomRequest } from "../useRotomRequest"
import { PokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetSpawnByPokemon(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(PokemonService.getSpawnByPokemon, name)

  return {
    spawns: data,
    error,
    isLoading,
    refetch,
    setSpawns: setData,
  }
}

