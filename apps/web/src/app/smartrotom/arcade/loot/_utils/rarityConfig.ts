import { ArcadeInventoryItem } from "@boffmedia/shared";

export interface RarityStyleConfig {
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  glow: string;
}

export function getRarityConfig(rarity: ArcadeInventoryItem.rarity): RarityStyleConfig {
  switch (rarity) {
    case "common":
      return {
        color: "gray-800",
        bgColor: "bg-surface-800/90",
        borderColor: "border-surface-400",
        textColor: "text-surface-400",
        glow: ""
      };
    case "uncommon":
      return {
        color: "green-900",
        bgColor: "bg-highlight-900/90",
        borderColor: "border-highlight-400", 
        textColor: "text-highlight-400",
        glow: "shadow-md shadow-highlight-500/30"
      };
    case "rare":
      return {
        color: "blue-900", 
        bgColor: "bg-secondary-900/90", 
        borderColor: "border-secondary-400", 
        textColor: "text-secondary-400",
        glow: "shadow-lg shadow-secondary-500/40"
      };
    case "epic":
      return {
        color: "purple-900", 
        bgColor: "bg-accent-900/90", 
        borderColor: "border-accent-400", 
        textColor: "text-accent-400",
        glow: "shadow-xl shadow-accent-500/50"
      };
    case "legendary":
      return {
        color: "yellow-900",
        bgColor: "bg-yellow-900/90", 
        borderColor: "border-yellow-400", 
        textColor: "text-yellow-400",
        glow: "shadow-2xl shadow-yellow-500/60"
      };
    default:
      throw new Error(`Unknown rarity: ${rarity}`);
  }
}

export const rarityOrder: Record<ArcadeInventoryItem.rarity, number> = {
  legendary: 0,
  epic: 1,
  rare: 2,
  uncommon: 3,
  common: 4
};