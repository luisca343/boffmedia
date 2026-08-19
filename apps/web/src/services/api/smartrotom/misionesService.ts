import { rotomGET, rotomPOST, ApiResponse, rotomAuthedPOST } from "@/services/boffAPI";
import { SuccessResponse, UploadNpcImageDto } from '@boffmedia/shared';
import { QuestSystemData } from '@/types/misiones';

export class MisionesService {
  /**
   * Get all quests
   */
  static getAllQuests(force: number) {
    return rotomGET<QuestSystemData>(`/misiones?force=${force}`);
  }

  /**
   * Get quests for a specific user
   */
  static getQuestsForUser(uuid: string) {
    return rotomPOST<QuestSystemData>('/misiones/user', { uuid });
  }

  /**
   * Upload custom NPC image
   */
  static uploadCustomNpcImage(data: UploadNpcImageDto) {
    return rotomAuthedPOST<SuccessResponse>('/misiones/images/upload', data);
  }

  /**
   * Get custom NPC render
   */
  static getCustomNpcRender(npcName: string) {
    return rotomGET<SuccessResponse>(`/misiones/images/render/${npcName}`);
  }

  /**
   * Get custom NPC image
   */
  static getCustomNpcImage(npcName: string) {
    return rotomGET<SuccessResponse>(`/misiones/images/${npcName}`);
  }

  /**
   * Force refresh quest cache
   */
  static refreshCache() {
    return rotomAuthedPOST<SuccessResponse>('/misiones/cache/refresh', {});
  }

  /**
   * Get quest cache status
   */
  static getCacheStatus() {
    return rotomGET<SuccessResponse>('/misiones/cache/status');
  }

  /**
   * Check if custom NPC render exists
   */
  static checkCustomNPCRender(npcName: string) {
    return rotomGET<SuccessResponse>(`/misiones/images/render/${npcName}`);
  }

  /**
   * Validate if user exists in quest system
   */
  static validateUser(uuid: string) {
    return rotomGET<{ exists: boolean }>(`/misiones/validate/user/${uuid}`);
  }

  /**
   * Get comprehensive system health status
   */
  static getHealth() {
    return rotomGET<SuccessResponse>('/misiones/health');
  }
}
