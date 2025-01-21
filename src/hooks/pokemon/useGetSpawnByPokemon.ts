import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetSpawnByPokemon(name: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getSpawnByPokemon, name)

  return {
    spawns: data,
    error,
    isLoading,
    refetch,
    setSpawns: setData,
  }
}

