import { DefenseData, ElementData } from "../../../../../../../types/tools/mhwilds";

// Utility function for decoration slots
export const getSlotColorClass = (size: number): string => {
  switch(size) {
    case 4: return "bg-secondary-hover"; // Level 4 slots (purple)
    case 3: return "bg-secondary-hover";   // Level 3 slots (blue)
    case 2: return "bg-yellow-400"; // Level 2 slots (yellow)
    case 1: default: return "bg-layer-3"; // Level 1 slots (white/gray)
  }
};

// Utility function for element colors
export const getElementColor = (element: string | undefined): string => {
  if (!element) return "text-ink-muted";
  
  const colors: Record<string, string> = {
    fire: "text-red-400",
    water: "text-secondary-hover",
    thunder: "text-yellow-400",
    ice: "text-cyan-400",
    dragon: "text-secondary-hover"
  };
  
  return colors[element.toLowerCase()] || "text-ink-muted";
};

// Helper function to get defense value safely
export const getDefenseValue = (defense: number | DefenseData | undefined): number => {
  if (defense === undefined) return 0;
  if (typeof defense === 'number') return defense;
  return defense.base;
};