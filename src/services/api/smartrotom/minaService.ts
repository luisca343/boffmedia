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

export const MinaService = {
  // ==================== ENERGY OPERATIONS ====================
  
  /**
   * Get energy status for a player
   */
  getPlayerEnergy: (uuid: string) => 
    rotomGET<EnergyStatus>(`/mine/energy/${uuid}`),

  // ==================== GAME OPERATIONS ====================
  
  /**
   * Start a new mining game
   */
  playGame: (data: PlayGameDto) => 
    rotomPOST<GameStartResponse>('/mine/play', data),
  
  /**
   * End a mining game and submit rewards
   */
  endGame: (data: EndGameDto) => 
    rotomPOST<GameEndResponse>('/mine/endgame', data),

  // ==================== REWARD OPERATIONS ====================
  
  /**
   * Get all available rewards
   */
  getAllRewards: () => 
    rotomGET<MineReward[]>('/mine/rewards'),
  
  /**
   * Get rewards grouped by type
   */
  getRewardsByType: () => 
    rotomGET<RewardsByType>('/mine/rewardsbytype'),
  
  /**
   * Get reward drop rates
   */
  getRewardDropRates: () => 
    rotomGET<DropRates>('/mine/rewards/droprates'),

  // ==================== PLAYER OPERATIONS ====================
  
  /**
   * Get game history for a player
   */
  getPlayerHistory: (uuid: string) => 
    rotomGET<Record<string, PlayerHistory[]>>(`/mine/history/${uuid}`),
  
  /**
   * Get player rankings
   */
  getPlayerRanking: () => 
    rotomGET<RankingEntry[]>('/mine/ranking'),
  
  /**
   * Get specific player rank
   */
  getPlayerRank: (uuid: string) => 
    rotomGET<{ rank: number; totalValue: number }>(`/mine/rank/${uuid}`),
  
  /**
   * Get unclaimed rewards for a player
   */
  getUnclaimedRewards: (uuid: string) => 
    rotomGET<UnclaimedItem[]>(`/mine/unclaimed/${uuid}`),
  
  /**
   * Claim all unclaimed rewards for a player
   */
  claimRewards: (data: ClaimRewardsDto) => 
    rotomPOST<ClaimResponse>('/mine/claim', data),
  
  /**
   * Get player statistics
   */
  getPlayerStatistics: (uuid: string) => 
    rotomGET<PlayerStatistics>(`/mine/stats/${uuid}`),

  // ==================== VALIDATION OPERATIONS ====================
  
  /**
   * Validate if player exists
   */
  validatePlayer: (uuid: string) => 
    rotomGET<{ exists: boolean }>(`/mine/validate/player/${uuid}`),

  // ==================== CONVENIENCE METHODS ====================
  
  /**
   * Check if player has enough energy to play
   */
  canPlayerPlay: async (uuid: string): Promise<boolean> => {
    try {
      const data = (await rotomGET<EnergyStatus>(`/mine/energy/${uuid}`)).data!;
      return data.energy > 0;
    } catch {
      return false;
    }
  },
  
  /**
   * Get player's current rank and check if they're in top rankings
   */
  isPlayerInTopRankings: async (uuid: string, topN: number = 10): Promise<boolean> => {
    try {
      const data = (await rotomGET<{ rank: number; totalValue: number }>(`/mine/rank/${uuid}`)).data!;
      return data.rank <= topN;
    } catch {
      return false;
    }
  },
  
  /**
   * Complete game flow: play -> end -> get results
   */
  completeGameSession: async (playData: PlayGameDto, endData: EndGameDto) => {
    const gameStart = await rotomPOST<GameStartResponse>('/mine/play', playData);
    const gameEnd = await rotomPOST<GameEndResponse>('/mine/endgame', endData);
    return { gameStart, gameEnd };
  },
  
  /**
   * Get comprehensive player data
   */
  getPlayerOverview: async (uuid: string) => {
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
  },
};