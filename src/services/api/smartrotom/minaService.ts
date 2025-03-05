import { rotomPOST, rotomGET } from '@/services/boffAPI'
import { HistoryEntry, RankingEntry, RewardEntry, UnclaimedReward } from '@/types/mina';

export type PlayResponse = any;



export const minaService = {
  claim: (params: { uuid: string }) => rotomPOST<number[]>('/mine/claim', params), // Returns an array of claimed reward ids
  endGame: (params: { uuid: string, rewards: { value: number, id: number }[] }) => rotomPOST<{idPartida: number}>('/mine/endgame', params),
  getEnergy: (uuid: string) => rotomGET<{energy: number, maxEnergy: number, lastCharge: string}>(`/mine/energy/${uuid}`),
  getHistory: (uuid: string) => rotomGET<{[key: number]: HistoryEntry[]}>(`/mine/history/${uuid}`),
  play: (params: { uuid: string }) => rotomPOST<PlayResponse>('/mine/play', params), // TODO: Define response type
  getRanking: () => rotomGET<RankingEntry[]>('/mine/ranking'),
  getRewards: () => rotomGET<RewardEntry[]>('/mine/rewards'),
  getRewardsByType: () => rotomGET<{ drops: { [key: string]: { items: RewardEntry[], totalValue: number } }, totalValue: number }>('/mine/rewardsbytype'),
  getUnclaimed: (uuid: string) => rotomGET<UnclaimedReward[]>(`/mine/unclaimed/${uuid}`),
}

