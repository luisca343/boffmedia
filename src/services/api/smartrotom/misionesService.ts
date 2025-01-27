import { INPC } from '@/app/smartrotom/misiones/_types/Quest';
import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { SuccessResponse } from '@/types';
import { NpcImageDto } from '@/types/dto/npc-image-dto';
import { QuestSystemData } from '@/types/misiones';

export const misionesService = {
  getAllQuests: (force: number) => rotomGET<QuestSystemData>(`/smartrotom/misiones?force=${force}`),
  getQuestsForUser: (uuid: string) => rotomPOST<QuestSystemData>('/smartrotom/misiones', { uuid }),
  updateNPCs: (npcs: INPC[]) => rotomPOST<SuccessResponse>('/smartrotom/misiones/npcs', { npcs }),
  uploadCustomNpcImage: (data: NpcImageDto) => rotomPOST<SuccessResponse>('/smartrotom/misiones/img/customNPC', data),
  getCustomNpcRender: (npcName: string) => rotomGET<SuccessResponse>(`/smartrotom/misiones/img/customNPC/render/${npcName}`),
  getCustomNpcImage: (npcName: string) => rotomGET<SuccessResponse>(`/smartrotom/misiones/img/customNPC/${npcName}`),
};
