export type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

export type Item = {
  id: string;
  name: string;
  image: string;
  rarity: Rarity;
  source?: string;
  count?: number;
  description: string;
};

export type LootBox = {
  id: string;
  name: string;
  image: string;
  price: number;
  description: string;
  items: Item[];
  theme: string;
};