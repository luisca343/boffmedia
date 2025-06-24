import { ArcadeInventoryItem } from "@/generated/api";

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
        bgColor: "bg-gray-800/90",
        borderColor: "border-gray-400",
        textColor: "text-gray-400",
        glow: ""
      };
    case "uncommon":
      return {
        color: "green-900",
        bgColor: "bg-green-900/90",
        borderColor: "border-green-400", 
        textColor: "text-green-400",
        glow: "shadow-md shadow-green-500/30"
      };
    case "rare":
      return {
        color: "blue-900", 
        bgColor: "bg-blue-900/90", 
        borderColor: "border-blue-400", 
        textColor: "text-blue-400",
        glow: "shadow-lg shadow-blue-500/40"
      };
    case "epic":
      return {
        color: "purple-900", 
        bgColor: "bg-purple-900/90", 
        borderColor: "border-purple-400", 
        textColor: "text-purple-400",
        glow: "shadow-xl shadow-purple-500/50"
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