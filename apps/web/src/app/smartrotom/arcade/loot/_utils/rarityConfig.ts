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
        bgColor: "bg-layer-2/90",
        borderColor: "border-edge",
        textColor: "text-ink-muted",
        glow: ""
      };
    case "uncommon":
      return {
        color: "green-900",
        bgColor: "bg-warning-soft/90",
        borderColor: "border-warning-border", 
        textColor: "text-warning-hover",
        glow: "shadow-md shadow-warning/30"
      };
    case "rare":
      return {
        color: "blue-900", 
        bgColor: "bg-secondary-soft/90", 
        borderColor: "border-secondary", 
        textColor: "text-secondary-hover",
        glow: "shadow-lg shadow-secondary/40"
      };
    case "epic":
      return {
        color: "purple-900", 
        bgColor: "bg-secondary-soft/90", 
        borderColor: "border-secondary", 
        textColor: "text-secondary-hover",
        glow: "shadow-xl shadow-secondary/50"
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