import { Item } from "../types";

/**
 * Calculate the percentage chance of getting each item in a loot box
 * based on the weights assigned to each item
 * @param items Array of loot box items with weights
 * @returns Array of items with added percentage field
 */
export function calculateLootBoxOdds(items: Item[]): (Item & { percentage: number })[] {
  // Calculate the total weight of all items
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  
  // Calculate percentage for each item based on its weight relative to total weight
  return items.map(item => ({
    ...item,
    percentage: (item.weight / totalWeight) * 100
  }));
}