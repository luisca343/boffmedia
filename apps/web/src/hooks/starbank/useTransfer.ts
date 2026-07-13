import { useState } from "react";
import { StarbankService } from "@/services/api/smartrotom/starbankService";
import { CreateTransferDto, SuccessResponse } from "@boffmedia/shared";

export function useTransfer() {
  const [data, setData] = useState<SuccessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const transfer = async (transferData: CreateTransferDto) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // boffAPI resolves `{ success: false }` on an HTTP error and only throws on a
      // network error, so a business failure (insufficient funds, bad account, 5xx)
      // reaches here as a normal return value. Rejecting is what makes it reach the
      // caller's catch instead of the success screen.
      const result = await StarbankService.transfer(transferData);
      if (!result.success) {
        throw new Error(result.message || result.error || "No se pudo completar la transferencia");
      }
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