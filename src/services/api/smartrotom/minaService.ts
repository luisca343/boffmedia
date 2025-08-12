import { rotomGET, rotomPOST } from '@/services/boffAPI';
import type {
  PlayGameDto,
  ClaimRewardsDto,
  EndGameDto,
  MineReward,
  EnergyStatus,
  GameStartResponse,
  GameEndResponse,
  RewardsByType,
  DropRates,
  PlayerHistory,
  RankingEntry,
  UnclaimedItem,
  ClaimResponse,
  PlayerStatistics,
} from '@/generated/api';

export class MinaService {
  // ==================== ENERGY OPERATIONS ====================
  
  /**
   * Get energy status for a player
   */
  static getPlayerEnergy(uuid: string) {
    return rotomGET<EnergyStatus>(`/mine/energy/${uuid}`);
  }

  // ==================== GAME OPERATIONS ====================
  
  /**
   * Start a new mining game
   */
  static playGame(data: PlayGameDto) {
    return rotomPOST<GameStartResponse>('/mine/play', data);
  }
  
  /**
   * End a mining game and submit rewards
   */
  static endGame(data: EndGameDto) {
    return rotomPOST<GameEndResponse>('/mine/endgame', data);
  }

  // ==================== REWARD OPERATIONS ====================
  
  /**
   * Get all available rewards
   */
  static getAllRewards() {
    return rotomGET<MineReward[]>('/mine/rewards');
  }
  
  /**
   * Get rewards grouped by type
   */
  static getRewardsByType() {
    return rotomGET<RewardsByType>('/mine/rewardsbytype');
  }
  
  /**
   * Get reward drop rates
   */
  static getRewardDropRates() {
    return rotomGET<DropRates>('/mine/rewards/droprates');
  }

  // ==================== PLAYER OPERATIONS ====================
  
  /**
   * Get game history for a player
   */
  static getPlayerHistory(uuid: string) {
    return rotomGET<Record<string, PlayerHistory[]>>(`/mine/history/${uuid}`);
  }
  
  /**
   * Get player rankings
   */
  static getPlayerRanking() {
    return rotomGET<RankingEntry[]>('/mine/ranking');
  }
  
  /**
   * Get specific player rank
   */
  static getPlayerRank(uuid: string) {
    return rotomGET<{ rank: number; totalValue: number }>(`/mine/rank/${uuid}`);
  }
  
  /**
   * Get unclaimed rewards for a player
   */
  static getUnclaimedRewards(uuid: string) {
    return rotomGET<UnclaimedItem[]>(`/mine/unclaimed/${uuid}`);
  }
  
  /**
   * Claim all unclaimed rewards for a player
   */
  static claimRewards(data: ClaimRewardsDto) {
    return rotomPOST<ClaimResponse>('/mine/claim', data);
  }
  
  /**
   * Get player statistics
   */
  static getPlayerStatistics(uuid: string) {
    return rotomGET<PlayerStatistics>(`/mine/stats/${uuid}`);
  }

  // ==================== VALIDATION OPERATIONS ====================
  
  /**
   * Validate if player exists
   */
  static validatePlayer(uuid: string) {
    return rotomGET<{ exists: boolean }>(`/mine/validate/player/${uuid}`);
  }

  // ==================== CONVENIENCE METHODS ====================
  
  /**
   * Check if player has enough energy to play
   */
  static async canPlayerPlay(uuid: string): Promise<boolean> {
    try {
      const data = (await rotomGET<EnergyStatus>(`/mine/energy/${uuid}`)).data!;
      return data.energy > 0;
    } catch {
      return false;
    }
  }
  
  /**
   * Get player's current rank and check if they're in top rankings
   */
  static async isPlayerInTopRankings(uuid: string, topN: number = 10): Promise<boolean> {
    try {
      const data = (await rotomGET<{ rank: number; totalValue: number }>(`/mine/rank/${uuid}`)).data!;
      return data.rank <= topN;
    } catch {
      return false;
    }
  }
  
  /**
   * Complete game flow: play -> end -> get results
   */
  static async completeGameSession(playData: PlayGameDto, endData: EndGameDto) {
    const gameStart = await rotomPOST<GameStartResponse>('/mine/play', playData);
    const gameEnd = await rotomPOST<GameEndResponse>('/mine/endgame', endData);
    return { gameStart, gameEnd };
  }
  
  /**
   * Get comprehensive player data
   */
  static async getPlayerOverview(uuid: string) {
    const [energy, statistics, unclaimed, rank] = await Promise.allSettled([
      rotomGET<EnergyStatus>(`/mine/energy/${uuid}`),
      rotomGET<PlayerStatistics>(`/mine/stats/${uuid}`),
      rotomGET<UnclaimedItem[]>(`/mine/unclaimed/${uuid}`),
      rotomGET<{ rank: number; totalValue: number }>(`/mine/rank/${uuid}`)
    ]);

    return {
      energy: energy.status === 'fulfilled' ? energy.value : null,
      statistics: statistics.status === 'fulfilled' ? statistics.value : null,
      unclaimed: unclaimed.status === 'fulfilled' ? unclaimed.value : [],
      rank: rank.status === 'fulfilled' ? rank.value : null,
    };
  }
}