import { useRotomRequest } from "../useRotomRequest"
import { pokemonService } from "@/services/api/smartrotom/pokemonService"

export function useGetAllPokemon() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(pokemonService.getAllPokemon)

  return {
    pokemon: data,
    error,
    isLoading,
    refetch,
    setPokemon: setData,
  }
}

