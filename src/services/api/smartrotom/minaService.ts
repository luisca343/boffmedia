import { rotomGET, rotomPOST } from '@/services/boffAPI';

export const minaService = {
  claim: (data: { uuid: string }) => rotomPOST('/mine/claim', data),
  endGame: (data: { uuid: string, rewards: { value: number, id: number }[] }) => rotomPOST('/mine/endgame', data),
  getEnergy: (uuid: string) => rotomGET(`/mine/energy/${uuid}`),
  getHistory: (uuid: string) => rotomGET(`/mine/history/${uuid}`),
  play: (data: { uuid: string }) => rotomPOST('/mine/play', data),
  getRanking: () => rotomGET('/mine/ranking'),
  getRewards: () => rotomGET('/mine/rewards'),
  getRewardsByType: () => rotomGET('/mine/rewardsbytype'),
  getUnclaimed: (uuid: string) => rotomGET(`/mine/unclaimed/${uuid}`)
};