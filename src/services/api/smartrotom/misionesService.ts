import { INPC } from '@/app/smartrotom/misiones/_types/Quest';
import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { SuccessResponse } from '@/types';
import { NpcImageDto } from '@/types/dto/npc-image-dto';
import { QuestSystemData } from '@/types/misiones';

export const misionesService = {
  getAllQuests: (force: number) => rotomGET<QuestSystemData>(`/misiones?force=${force}`),
  getQuestsForUser: (uuid: string) => rotomPOST<QuestSystemData>('/misiones', { uuid }),
  updateNPCs: (npcs: INPC[]) => rotomPOST<SuccessResponse>('/misiones/npcs', { npcs }),
  uploadCustomNpcImage: (data: NpcImageDto) => rotomPOST<SuccessResponse>('/misiones/img/customNPC', data),
  getCustomNpcRender: (npcName: string) => rotomGET<SuccessResponse>(`/misiones/img/customNPC/render/${npcName}`),
  getCustomNpcImage: (npcName: string) => rotomGET<SuccessResponse>(`/misiones/img/customNPC/${npcName}`),
};
