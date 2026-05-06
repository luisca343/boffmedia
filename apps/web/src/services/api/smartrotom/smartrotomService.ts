import { ApiResponse, rotomGET, rotomPOST } from "@/services/boffAPI"
import { ArceuSpeakEntity, TaxiStop, TeleportPlayerDto } from "@boffmedia/shared"

/** @deprecated use ArceuSpeakEntity from @boffmedia/shared */
export type ArceuSpeak = ArceuSpeakEntity;

export class SmartrotomService {
  
  /**
   * Get ArceuSpeak messages
   */
  static getArceuSpeak() {
    return rotomGET<ArceuSpeakEntity[]>("/arceuspeak");
  }

  /**
   * Post new ArceuSpeak message
   */
  static postArceuSpeak({name, value, format}: ArceuSpeakEntity) {
    return rotomPOST<ApiResponse>('/arceuspeak', {name, value, format});
  }
}