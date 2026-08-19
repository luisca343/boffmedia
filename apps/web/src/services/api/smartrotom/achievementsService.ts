import { rotomGET, rotomPOST, ApiResponse, rotomAuthedPOST } from '@/services/boffAPI';
import type { 
  UserAchievement,
  Replay,
  GetAchievementsDto,
  GetAchievementByIdDto,
  BattleAchievementDto,
  BattleAchievementResponse,
  AchievementStatusResponse
} from '@boffmedia/shared';

export class AchievementService {
  /**
   * Get all achievements for a player
   */
  static getAchievements(getAchievementsDto: GetAchievementsDto): Promise<ApiResponse<UserAchievement[]>> {
    return rotomPOST<UserAchievement[]>('/achievement/get-achievements', getAchievementsDto);
  }

  /**
   * Get a specific achievement for a player
   */
  static getAchievementById(uuid: string, achievementId: string): Promise<ApiResponse<UserAchievement>> {
    return rotomGET<UserAchievement>(`/achievement/${uuid}/${achievementId}`);
  }

  /**
   * Save a battle and register its achievement
   */
  static addBattleAchievement(battleAchievementDto: BattleAchievementDto): Promise<ApiResponse<BattleAchievementResponse>> {
    return rotomPOST<BattleAchievementResponse>('/achievement/battle', battleAchievementDto);
  }

  /**
   * Get replay for a player
   */
  static getReplay(uuid: string, replayId: number): Promise<ApiResponse<Replay>> {
    // The API exposes this as POST /achievement/get-replay (GetReplayDto body).
    return rotomPOST<Replay>('/achievement/get-replay', { uuid, replayId });
  }

  /**
   * Create a new replay (used by Showdown battles to persist replays client-side)
   */
  static createReplay(data: {
    side1: string;
    side2: string;
    team1: string;
    team2: string;
    replay: string;
    winner: string;
  }): Promise<ApiResponse<{ replayId: number }>> {
    return rotomAuthedPOST<{ replayId: number }>('/achievement/create-replay', data);
  }

  /**
   * Check if player has completed a specific achievement
   */
  static checkAchievementStatus(checkDto: GetAchievementByIdDto): Promise<ApiResponse<AchievementStatusResponse>> {
    return rotomPOST<AchievementStatusResponse>('/achievement/check', checkDto);
  }

  // ==================== CONVENIENCE METHODS ====================

  /**
   * Quick method to get achievements by UUID only
   */
  static getPlayerAchievements(uuid: string): Promise<ApiResponse<UserAchievement[]>> {
    return AchievementService.getAchievements({ uuid });
  }

  /**
   * Quick method to check achievement status
   */
  static hasAchievement(uuid: string, achievementId: string): Promise<ApiResponse<AchievementStatusResponse>> {
    return AchievementService.checkAchievementStatus({ uuid, achievementId });
  }

  /**
   * Submit battle result and achievement
   */
  static submitBattleResult(
    uuid: string,
    achievementId: string,
    playerName1: string,
    playerName2: string,
    team1: any,
    team2: any,
    replayData: string,
    playerWon: boolean
  ): Promise<ApiResponse<BattleAchievementResponse>> {
    return AchievementService.addBattleAchievement({
      uuid,
      logro: achievementId,
      name1: playerName1,
      name2: playerName2,
      team1,
      team2,
      replay: replayData,
      victoria: playerWon
    });
  }
}

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