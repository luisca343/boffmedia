import { rotomGET, rotomPOST, ApiResponse } from "@/services/boffAPI"
import { SuccessResponse } from "@/types"

export interface Repeticion {
  id: number
  team1: string
  team2: string
  replay: string
  winner: number
  side1: string
  side2: string
  date: string
}

export interface BattleConfig {
  // Define the structure of your battle config here
  // This is a placeholder, adjust according to your actual config structure
  [key: string]: any
}

export const battleService = {
  getRepeticiones: (uuid: string) => rotomGET<Repeticion[]>(`/battle/repetitions/${uuid}`),
  getBattleConfig: (npcConfigName: string) => rotomGET<BattleConfig>(`/battle/config/${npcConfigName}`),
}

