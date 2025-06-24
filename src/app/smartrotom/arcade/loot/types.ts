import { ArcadeInventoryItem } from "@/generated/api";


export type Item = {
  id: string;
  weight: number;
  rarity: ArcadeInventoryItem.rarity;
  source?: string;
  count?: number;
};

export type LootBox = {
  id: string;
  name: string;
  image: string;
  description: string;
  items: Item[];
  theme: string;
};