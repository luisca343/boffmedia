import { rotomGET } from "@/services/boffAPI"

export interface Performance {
  tps: string
  memory: number
  players: number
  uptime: string
}

export const smartrotomService = {
  getPerformance: () => rotomGET<Performance>("/performance"),
}

