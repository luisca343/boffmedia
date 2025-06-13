import { rotomGET, rotomPOST, ApiResponse } from '@/services/boffAPI';
import type { 
  UserAchievement,
  Replay,
  GetAchievementsDto,
  GetAchievementByIdDto,
  BattleAchievementDto,
  BattleAchievementResponse,
  AchievementStatusResponse
} from '@/generated/api';

export const achievementService = {
  /**
   * Get all achievements for a player
   */
  getAchievements: (getAchievementsDto: GetAchievementsDto): Promise<ApiResponse<UserAchievement[]>> => 
    rotomPOST<UserAchievement[]>('/achievements', getAchievementsDto),

  /**
   * Get a specific achievement for a player
   */
  getAchievementById: (uuid: string, achievementId: string): Promise<ApiResponse<UserAchievement>> => 
    rotomGET<UserAchievement>(`/achievements/${uuid}/${achievementId}`),

  /**
   * Save a battle and register its achievement
   */
  addBattleAchievement: (battleAchievementDto: BattleAchievementDto): Promise<ApiResponse<BattleAchievementResponse>> => 
    rotomPOST<BattleAchievementResponse>('/achievements/battle', battleAchievementDto),

  /**
   * Get replay for a player
   */
  getReplay: (uuid: string, replayId: number): Promise<ApiResponse<Replay>> => 
    rotomGET<Replay>(`/achievements/replays/${uuid}/${replayId}`),

  /**
   * Check if player has completed a specific achievement
   */
  checkAchievementStatus: (checkDto: GetAchievementByIdDto): Promise<ApiResponse<AchievementStatusResponse>> => 
    rotomPOST<AchievementStatusResponse>('/achievements/check', checkDto),

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Quick method to get achievements by UUID only
   */
  getPlayerAchievements: (uuid: string): Promise<ApiResponse<UserAchievement[]>> => 
    achievementService.getAchievements({ uuid }),

  /**
   * Quick method to check achievement status
   */
  hasAchievement: (uuid: string, achievementId: string): Promise<ApiResponse<AchievementStatusResponse>> => 
    achievementService.checkAchievementStatus({ uuid, achievementId }),

  /**
   * Submit battle result and achievement
   */
  submitBattleResult: (
    uuid: string,
    achievementId: string,
    playerName1: string,
    playerName2: string,
    team1: any,
    team2: any,
    replayData: string,
    playerWon: boolean
  ): Promise<ApiResponse<BattleAchievementResponse>> => 
    achievementService.addBattleAchievement({
      uuid,
      logro: achievementId,
      name1: playerName1,
      name2: playerName2,
      team1,
      team2,
      replay: replayData,
      victoria: playerWon
    }),
};

// Export types for convenience
export type { 
  UserAchievement,
  Replay,
  GetAchievementsDto,
  GetAchievementByIdDto,
  BattleAchievementDto,
  BattleAchievementResponse,
  AchievementStatusResponse,
  ApiResponse 
};