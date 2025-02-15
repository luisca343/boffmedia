import { useRotomRequest } from "@/hooks/useRotomRequest"
import { eventsService } from "@/services/api/smartrotom/eventsService"
import { CreateMedalDto } from "@/types/dto/create-medal.dto"

export function useCreateMedal(eventId: number) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(
    (createMedalDto) => eventsService.createMedal(eventId, createMedalDto),
    [eventId],
  )

  const createMedal = (createMedalDto: CreateMedalDto) => {
    return eventsService.createMedal(eventId, createMedalDto)
  }

  return {
    createdMedal: data,
    error,
    isLoading,
    refetch,
    createMedal,
    setCreatedMedal: setData,
  }
}

