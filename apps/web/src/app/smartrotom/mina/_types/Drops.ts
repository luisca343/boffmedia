import type { MineReward } from "@boffmedia/shared"

export type Drop = MineReward

export type DropByType = {
    [key: string]: {
        items: Drop[];
        totalValue: number;
    }
}