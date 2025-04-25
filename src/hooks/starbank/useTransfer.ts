import { useState } from "react";
import { starbankService } from "@/services/api/smartrotom/starbankService";
import { CreateTransferDto } from "@/types/dto/create-transfer-dto";
import { SuccessResponse } from "@/types";

export function useTransfer() {
  const [data, setData] = useState<SuccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const transfer = async (transferData: CreateTransferDto) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await starbankService.transfer(transferData);
      setData(result.data ?? null);
      return result;
    } catch (err: any) {
      const errorMessage = err?.message || "Error al realizar la transferencia";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setData(null);
    setError(null);
    setIsLoading(false);
  };

  return {
    transferResult: data,
    error,
    isLoading,
    transfer,
    setTransferResult: setData,
    reset
  };
}