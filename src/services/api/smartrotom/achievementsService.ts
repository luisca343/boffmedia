import { rotomGET, rotomPOST, ApiResponse } from "@/services/boffAPI"
import type { SuccessResponse } from "@/types"
import { BattleAchievementDto } from "@/types/dto/battle-achievement-dto"

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    subcategory: string;
    target: number;
    progress: number;
    completed: boolean;
    completedAt: Date;
    uuid: string;
    team: string;
    replay: string;
}

export const achievementService = {
  getAchievementForPlayer: (uuid: string, achievementId: string) =>
    rotomGET<Achievement>(`/achievements/${uuid}/${achievementId}`),

  getAchievements: (uuid: string) => rotomPOST<Achievement[]>("/achievements", { uuid }),

  addBattleAchievement: (battleAchievement: BattleAchievementDto) =>
    rotomPOST<SuccessResponse>("/achievements/battle", battleAchievement),
}

