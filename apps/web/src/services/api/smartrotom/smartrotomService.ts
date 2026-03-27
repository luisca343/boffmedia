import { ApiResponse, rotomGET, rotomPOST } from "@/services/boffAPI"
import { TaxiStop } from "@/types/dto/taxi-stop.dto"
import { TeleportPlayerDto } from "@boffmedia/shared"

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

export class SmartrotomService {
  
  /**
   * Get ArceuSpeak messages
   */
  static getArceuSpeak() {
    return rotomGET<ArceuSpeak[]>("/arceuspeak");
  }

  /**
   * Post new ArceuSpeak message
   */
  static postArceuSpeak({name, value, format}: ArceuSpeak) {
    return rotomPOST<ApiResponse>('/arceuspeak', {name, value, format});
  }
}