import { useEffect, useState } from "react";
import { useRotomRequest } from "../useRotomRequest";
import { MinaService } from "@/services/api/smartrotom/minaService";

export function useGetEnergy(uuid: string) {
  const { data, error, isLoading, refetch, setData } = useRotomRequest(MinaService.getPlayerEnergy, uuid)
  const [maxEnergy, setMaxEnergy] = useState<number>(0)
  const [energy, setEnergy] = useState<number>(0)
  const [ultimaRecarga, setUltimaRecarga] = useState<Date>(new Date())
  const [diff, setDiff] = useState(1)

  useEffect(() => {
    if(!data) return
    setMaxEnergy(data.maxEnergy)
    setEnergy(data.energy)
  
    let date = new Date(Date.parse(data.lastCharge))
    setUltimaRecarga(date)
  
    const diffTime = date?.getTime() - new Date().getTime() + 3600000;
    setDiff(diffTime)
  }, [data])

  return {
    energy,
    setEnergy,
    maxEnergy,
    ultimaRecarga,
    diff,
    error,
    isLoading,
    refetch,
  }
}

