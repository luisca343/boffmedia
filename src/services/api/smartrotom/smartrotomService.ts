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

export class SmartrotomService {
  /**
   * Get server performance metrics
   */
  static getPerformance() {
    return rotomGET<Performance>("/performance");
  }

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

  /**
   * Get taxi stops
   */
  static getTaxiStops() {
    return rotomGET<Record<string, TaxiStop>>("/taxi/stops");
  }

  /**
   * Teleport a player
   */
  static teleportPlayer(data: TeleportPlayerDto) {
    return rotomPOST<ApiResponse>("/taxi/teleport", data);
  }
}