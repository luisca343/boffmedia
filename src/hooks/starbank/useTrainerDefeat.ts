import { useRotomRequest } from "../useRotomRequest";
import { starbankService } from "@/services/api/smartrotom/starbankService";
import { TrainerDefeatMoneyDto } from "@/types/dto/trainer-defeat-money-dto";

export function useTrainerDefeat() {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(starbankService.trainerDefeat)

  const trainerDefeat = (defeatData: TrainerDefeatMoneyDto) => {
    return starbankService.trainerDefeat(defeatData);
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

