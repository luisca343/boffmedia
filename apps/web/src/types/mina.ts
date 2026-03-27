export type RankingEntry = {
    username: string;
    value: number;
}

export type RewardEntry = {
    id: number;
    name: string;
    type: string;
    value: number;

    
    width: number;
    height: number;
    itemId: string;
    url: string;
}

export type UnclaimedReward = {
    name: string;
    type: string;
    amount: number;
    itemId: string;
  };