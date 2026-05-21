import { ItemRarity } from '../entities/arcade-inventory.entity';
import { FileUtils } from '@/_utils/FileUtils';

export const rarityRanges = {
  common: { min: 50, max: 100 },
  uncommon: { min: 20, max: 49 },
  rare: { min: 10, max: 19 },
  epic: { min: 3, max: 9 },
  legendary: { min: 1, max: 2 },
};

// Helper function to determine rarity from weight
export function getRarityFromWeight(weight: number): ItemRarity {
  for (const [rarity, range] of Object.entries(rarityRanges)) {
    if (weight >= range.min && weight <= range.max) {
      return rarity as ItemRarity;
    }
  }
  return 'common';
}

export interface LootBoxItem {
  id: string;
  weight: number;
  type: string;
  data?: string;
}

export interface LootBox {
  id: string;
  name: string;
  image: string;
  description: string;
  items: LootBoxItem[];
  theme: string;
}

export interface LootBoxConfig {
  boxes: LootBox[];
}

export const lootboxConfig: LootBoxConfig = FileUtils.readJsonFile(
  '/public/smartrotom/data/lootboxConfig.json',
);
