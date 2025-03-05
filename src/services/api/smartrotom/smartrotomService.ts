import { ApiResponse, rotomGET, rotomPOST } from "@/services/boffAPI"

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
}

