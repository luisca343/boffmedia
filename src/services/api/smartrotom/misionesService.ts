import { INPC } from '@/app/smartrotom/misiones/_types/Quest';
import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { SuccessResponse } from '@/types';
import { NpcImageDto } from '@/types/dto/npc-image-dto';
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
    return rotomPOST<QuestSystemData>('/misiones', { uuid });
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
  static uploadCustomNpcImage(data: NpcImageDto) {
    return rotomPOST<SuccessResponse>('/misiones/img/customNPC', data);
  }

  /**
   * Get custom NPC render
   */
  static getCustomNpcRender(npcName: string) {
    return rotomGET<SuccessResponse>(`/misiones/img/customNPC/render/${npcName}`);
  }

  /**
   * Get custom NPC image
   */
  static getCustomNpcImage(npcName: string) {
    return rotomGET<SuccessResponse>(`/misiones/img/customNPC/${npcName}`);
  }
}
