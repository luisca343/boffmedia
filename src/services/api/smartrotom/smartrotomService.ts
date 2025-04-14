import { ApiResponse, rotomGET, rotomPOST } from "@/services/boffAPI"
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { TeleportPlayerDto } from "@/types/dto/teleport-player.dto"

export interface Performance {
  tps: string
  memory: number
  players: number
  uptime: string
}

export interface ArceuSpeak {
  name: string
  value: string
  format: string
}

export const smartrotomService = {
  getPerformance: () => rotomGET<Performance>("/performance"),
  getArceuSpeak: () => rotomGET<ArceuSpeak[]>("/arceuspeak"),
  postArceuSpeak: ({name, value, format}: ArceuSpeak) => rotomPOST<ApiResponse>('/arceuspeak', {name, value, format}),
  getTaxiStops: () => rotomGET<Record<string, TaxiStop>>("/taxi/stops"),
  teleportPlayer: (data: TeleportPlayerDto) => rotomPOST<ApiResponse>("/taxi/teleport", data),
}

