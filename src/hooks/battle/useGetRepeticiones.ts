import { useRotomRequest } from "@/hooks/useRotomRequest"
import { battleService, type Repeticion } from "@/services/api/smartrotom/battleService"

export function useGetRepeticiones(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest<Repeticion[]>(
    battleService.getRepeticiones,
    uuid,
  )

  return {
    repeticiones: data,
    error,
    isLoading,
    refetch,
    setRepeticiones: setData,
  }
}

