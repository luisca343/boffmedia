export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type Item = {
  id: string;
  image: string;
  rarity: Rarity;
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