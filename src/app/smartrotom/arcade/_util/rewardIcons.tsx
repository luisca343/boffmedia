import React from "react";
import { Star, Package, Award, Gift } from "lucide-react";
import { ItemImage } from "@/lib/ItemImage";
import { PokemonImage } from "@/lib/PokemonImage";

export type RewardIconProps = {
  type: string;
  description?: string;
  size?: number;
  className?: string;
};

/**
 * Returns the appropriate icon component for a reward based on its type
 * @param type The reward type (currency, box, crate, item, etc.)
 * @param description The reward description or item ID
 * @param size The size of the icon (used for both Lucide icons and ItemImage)
 * @param className Additional CSS classes for the icon
 */
export function getRewardIcon({ type, description = "", size = 24, className = "" }: RewardIconProps): React.ReactNode {
  const lowerType = type?.toLowerCase() || '';
  
  switch(lowerType) {
    case 'currency':
      return <Star className={`h-${size/4} w-${size/4} text-yellow-300 ${className}`} />;
    case 'box':
    case 'crate':
      // For boxes/crates, use ItemImage with the description as the itemId
      return <ItemImage type="box" itemId={description} size={size} />;
    case 'item':
      // For regular items, use Award icon or ItemImage depending on available data
      if (description && description.length > 0) {
        return <ItemImage type="item" itemId={description} size={size} />;
      }
      return <Award className={`h-${size/4} w-${size/4} text-blue-300 ${className}`} />;
    case 'pokemon':
      return <PokemonImage itemId={description} size={size} />;
    default:
      return <Gift className={`h-${size/4} w-${size/4} text-green-300 ${className}`} />;
  }
}

/**
 * Returns the appropriate styling for a reward based on its type
 */
export function getRewardVisuals(rewardType: string) {
  const lowerType = rewardType?.toLowerCase() || '';
  
  switch(lowerType) {
    case 'currency':
      return {
        bgGradient: "from-yellow-700/40 to-amber-800/40",
        border: "border-yellow-500/50",
        textColor: "text-yellow-300"
      };
    case 'box':
    case 'boxes':
    case 'crate':
    case 'crates':
      return {
        bgGradient: "from-violet-700/40 to-purple-800/40",
        border: "border-violet-500/50",
        textColor: "text-violet-300"
      };
    case 'item':
      return {
        bgGradient: "from-blue-700/40 to-indigo-800/40",
        border: "border-blue-500/50",
        textColor: "text-blue-300"
      };
    default:
      return {
        bgGradient: "from-green-700/40 to-emerald-800/40",
        border: "border-green-500/50",
        textColor: "text-green-300"
      };
  }
}

/**
 * Check if a reward type is a named item (ITEM, CRATE or BOX)
 */
export function isNamedReward(type: string): boolean {
  const lowerType = type?.toLowerCase() || '';
  return lowerType === 'item' || lowerType === 'crate' || lowerType === 'box';
}