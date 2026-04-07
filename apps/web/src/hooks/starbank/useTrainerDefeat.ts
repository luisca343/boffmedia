import { useRotomRequest } from "../useRotomRequest";
import { StarbankService } from "@/services/api/smartrotom/starbankService";
import { TrainerDefeatMoneyDto } from "@boffmedia/shared";

export function useTrainerDefeat() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(StarbankService.trainerDefeat)

  const trainerDefeat = (defeatData: TrainerDefeatMoneyDto) => {
    return StarbankService.trainerDefeat(defeatData);
  }

  return {
    defeatResult: data,
    error,
    isLoading,
    refetch,
    trainerDefeat,
    setDefeatResult: setData
  }
}

