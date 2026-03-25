type HistoryEntry = {
    id: number;
    itemId: string;
    itemName: string;
    claimed: number;
    value: number;
    date: Date;
}

type RankingEntry = {
    username: string;
    value: number;
}

type RewardEntry = {
    id: number;
    name: string;
    type: string;
    value: number;
}