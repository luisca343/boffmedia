import { INPC } from '@/app/smartrotom/misiones/_types/Quest';
import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { SuccessResponse, UploadNpcImageDto } from '@boffmedia/shared';
import { NPCCatalogResponse, QuestSystemData } from '@/types/misiones';

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
   * Update NPCs
   */
  static updateNPCs(npcs: INPC[]) {
    return rotomPOST<SuccessResponse>('/misiones/npcs', { npcs });
  }

  /**
   * Upload custom NPC image
   */
  static uploadCustomNpcImage(data: UploadNpcImageDto) {
    return rotomPOST<SuccessResponse>('/misiones/images/upload', data);
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
    return rotomPOST<SuccessResponse>('/misiones/cache/refresh', {});
  }

  /**
   * Get quest cache status
   */
  static getCacheStatus() {
    return rotomGET<SuccessResponse>('/misiones/cache/status');
  }

  /**
   * @deprecated Use getNpcCatalog() instead.
   */
  static getAllNPCs() {
    return rotomGET<INPC[]>('/misiones/npcs');
  }

  /**
   * Get specific NPC by ID
   */
  static getNPCById(id: number) {
    return rotomGET<INPC>(`/misiones/npcs/${id}`);
  }

  /**
   * Get NPCs by quest ID
   */
  static getNPCsByQuestId(questId: number) {
    return rotomGET<INPC[]>(`/misiones/npcs/quest/${questId}`);
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

  /**
   * Get NPC catalog with real-world coordinates and Minecraft UUIDs
   */
  static getNpcCatalog() {
    return rotomGET<NPCCatalogResponse>('/misiones/npcs/catalog');
  }
}
