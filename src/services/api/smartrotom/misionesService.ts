import { INPC } from '@/app/smartrotom/misiones/_types/Quest';
import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import { SuccessResponse } from '@/types';
import { QuestSystemData } from '@/types/misiones';


export const misionesService = {
  getAllQuests: (force: number) => rotomGET<QuestSystemData>(`/misiones?force=${force}`),
  getQuestsForUser: (uuid: string) => rotomPOST<QuestSystemData>('/misiones', { uuid }),
  updateNPCs: (npcs: INPC[]) => rotomPOST<SuccessResponse>('/misiones/npcs', { npcs }),
};

