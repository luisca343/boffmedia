import { DefenseData, ElementData } from "./types";

// Utility function for decoration slots
export const getSlotColorClass = (size: number): string => {
  switch(size) {
    case 4: return "bg-purple-400"; // Level 4 slots (purple)
    case 3: return "bg-blue-400";   // Level 3 slots (blue)
    case 2: return "bg-yellow-400"; // Level 2 slots (yellow)
    case 1: default: return "bg-gray-400"; // Level 1 slots (white/gray)
  }
};

// Utility function for element colors
export const getElementColor = (element: string | undefined): string => {
  if (!element) return "text-surface-400";
  
  const colors: Record<string, string> = {
    fire: "text-red-400",
    water: "text-blue-400",
    thunder: "text-yellow-400",
    ice: "text-cyan-400",
    dragon: "text-purple-400"
  };
  
  return colors[element.toLowerCase()] || "text-gray-400";
};

// Helper function to get defense value safely
export const getDefenseValue = (defense: number | DefenseData | undefined): number => {
  if (defense === undefined) return 0;
  if (typeof defense === 'number') return defense;
  return defense.base;
};