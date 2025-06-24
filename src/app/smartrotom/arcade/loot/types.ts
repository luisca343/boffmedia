import { ArcadeInventoryItem, LootboxItemConfig } from "@/generated/api";



export type LootBox = {
  id: string;
  name: string;
  image: string;
  description: string;
  items: LootboxItemConfig[];
  theme: string;
};