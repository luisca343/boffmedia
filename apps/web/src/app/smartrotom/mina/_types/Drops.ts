export type Drop = {
    id: number;
    value: number;
    name: string;
    type: string;
    itemId: string;
    width: number;
    height: number;
}

export type DropByType = {
    [key: string]: {
        items: Drop[];
        totalValue: number;
    }
}