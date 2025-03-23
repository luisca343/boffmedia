import { ArmorPiece, EquipmentType, Weapon } from "./types";
import { LucideIcon } from "lucide-react";
import { 
  Sword, 
  Shield, 
  Shirt, 
  ArrowBigRight, 
  CircleDot, 
  Footprints,
  SwordIcon 
} from "lucide-react";
import { GiHelmet } from "react-icons/gi";

// Get the appropriate icon for the equipment type
export const getEquipmentIcon = (slotType: EquipmentType): LucideIcon | any => {
  const icons: Record<EquipmentType, LucideIcon | any> = {
    'weapon': SwordIcon,
    'head': GiHelmet,
    'chest': Shirt,
    'arms': ArrowBigRight,
    'waist': CircleDot,
    'legs': Footprints,
  };
  
  return icons[slotType] || Shield;
};

// Get color for equipment icon
export const getIconColor = (slotType: EquipmentType): string => {
  const colors: Record<EquipmentType, string> = {
    'weapon': "text-red-400",
    'head': "text-blue-400",
    'chest': "text-green-400",
    'arms': "text-yellow-400",
    'waist': "text-purple-400",
    'legs': "text-cyan-400",
  };
  
  return colors[slotType] || "text-surface-400";
};

// Get display name for equipment type
export const getEquipmentDisplayName = (slotType: EquipmentType): string => {
  const typeNames: Record<EquipmentType, string> = {
    weapon: 'Arma',
    head: 'Casco',
    chest: 'Pecho',
    arms: 'Brazos',
    waist: 'Cintura',
    legs: 'Piernas'
  };
  return typeNames[slotType] || slotType.charAt(0).toUpperCase() + slotType.slice(1);
};

// Get rarity style based on rarity level
export const getRarityStyle = (rarity: number): string => {
  if (rarity >= 7) {
    return "border-purple-500 text-purple-400 bg-purple-950/20";
  } else if (rarity >= 5) {
    return "border-amber-500 text-amber-400 bg-amber-950/20";
  } else if (rarity >= 3) {
    return "border-blue-500 text-blue-400 bg-blue-950/20";
  } else {
    return "border-green-500 text-green-400 bg-green-950/20";
  }
};

// Helper function to get element color


// Get element color class
export const getElementColor = (elementType: string): string => {
  if (!elementType) return "text-surface-400";
  
  const colors: Record<string, string> = {
    fire: "text-red-400",
    water: "text-blue-400",
    thunder: "text-yellow-400",
    ice: "text-cyan-400",
    dragon: "text-purple-400"
  };
  
  return colors[elementType.toLowerCase()] || "text-gray-400";
};

// Helper to get defense value regardless of format
export const getDefenseValue = (defense: number | { base: number, max?: number, augmented?: number }): number => {
  if (typeof defense === 'number') return defense;
  return defense.base;
};

export const getWeaponElementInfo = (weapon: Weapon): { type: string, damage: number, hidden?: boolean } | null => {
  // Try to get all elements and return the first one
  const elements = getAllWeaponElements(weapon);
  return elements.length > 0 ? elements[0] : null;
};

export const getAllWeaponElements = (weapon: Weapon): { type: string, damage: number, hidden?: boolean }[] => {
  if (!weapon) return [];
  
  console.log("Extracting elements from weapon:", weapon.id, weapon.name);
  
  const elements: { type: string, damage: number, hidden?: boolean }[] = [];
  
  // Case 1: Direct element property
  if (weapon.element && typeof weapon.element === 'object') {
    console.log("Found direct element property:", weapon.element);
    elements.push({
      type: weapon.element.type,
      damage: weapon.element.damage,
      hidden: false
    });
  }
  
  // Case 2: Elements in specials array
  if (weapon.specials && Array.isArray(weapon.specials)) {
    console.log("Found specials array with", weapon.specials.length, "items");
    
    weapon.specials.forEach((special, index) => {
      if (!special) return;
      console.log(`Processing special #${index}:`, special);
      
      try {
        // Most important case: special with kind="element"
        if (special.kind === 'element' && special.element) {
          console.log("Found element special with kind=element:", special);
          
          let damage = 0;
          
          // Get damage from the complex damage object structure
          if (special.damage && typeof special.damage === 'object' && 'display' in special.damage) {
            damage = special.damage.display;
            console.log("Got damage from damage.display:", damage);
          } else if (special.damage && typeof special.damage === 'number') {
            damage = special.damage;
            console.log("Got damage from direct number:", damage);
          }
          
          if (damage > 0) {
            const elementInfo = {
              type: special.element,
              damage: damage,
              hidden: !!special.hidden
            };
            console.log("Adding element:", elementInfo);
            elements.push(elementInfo);
          }
        }
        // Fallback for other element formats
        else if (special.type && ['fire', 'water', 'thunder', 'ice', 'dragon'].includes(special.type.toLowerCase())) {
          console.log("Found element special with element in type property:", special);
          
          let damage = 0;
          
          if (typeof special.damage === 'number') {
            damage = special.damage;
          } else if (special.damage && typeof special.damage === 'object') {
            damage = special.damage.display || special.damage.raw || 0;
          }
          
          if (damage > 0) {
            const elementInfo = {
              type: special.type,
              damage: damage,
              hidden: !!special.hidden
            };
            console.log("Adding element (fallback):", elementInfo);
            elements.push(elementInfo);
          }
        }
      } catch (err) {
        console.error("Error parsing weapon element special:", err);
      }
    });
  }
  
  console.log("Final extracted elements:", elements);
  return elements;
};

export const getWeaponTypeIcon = (weaponType: string): string => {
  // Convert weapon type to kebab case (for file naming)
  const kebabCase = (str: string) => 
    str.toLowerCase()
       .replace(/\s+/g, '-')
       .replace(/_/g, '-');
  
  const normalizedType = kebabCase(weaponType);
  
  // Map of weapon types to their icon filenames
  const iconMap: Record<string, string> = {
    'great-sword': 'great-sword',
    'long-sword': 'long-sword',
    'sword-and-shield': 'sword-and-shield',
    'dual-blades': 'dual-blades',
    'hammer': 'hammer',
    'hunting-horn': 'hunting-horn',
    'lance': 'lance',
    'gunlance': 'gunlance',
    'switch-axe': 'switch-axe',
    'charge-blade': 'charge-blade',
    'insect-glaive': 'insect-glaive',
    'light-bowgun': 'light-bowgun',
    'heavy-bowgun': 'heavy-bowgun',
    'bow': 'bow',
  };
  
  // Default to a generic weapon icon if not found
  return `/img/games/mhwilds/${iconMap[normalizedType] || 'great-sword'}.webp`;
};