import { ArmorPiece, EquipmentType, Weapon } from "./types";
import { LucideIcon, Medal } from "lucide-react";
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
    'charm': Medal,
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
    'charm': "text-amber-400",
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
    legs: 'Piernas',
    charm: 'Amuleto' // Add charm display name
  };
  return typeNames[slotType] || slotType.charAt(0).toUpperCase() + slotType.slice(1);
};

export const getRarityFilterStyle = (rarity: number): string => {
  switch (true) {
    case rarity === 3:return 'grayscale(1) brightness(0.8) sepia(0.5) hue-rotate(80deg) saturate(5)';
    case rarity === 4:
      return 'grayscale(1) brightness(0.6) sepia(0.5) hue-rotate(100deg) saturate(5)'; 
    case rarity === 5:
      return 'grayscale(1) brightness(0.7) sepia(0.5) hue-rotate(165deg) saturate(6)';
    case rarity === 6:
      return 'grayscale(1) brightness(0.5) sepia(1) hue-rotate(195deg) saturate(8)'; 
    case rarity === 7:
      return 'grayscale(1) brightness(0.3) sepia(1) hue-rotate(240deg) saturate(6)';
    case rarity >= 8:
      return 'grayscale(1) brightness(0.5) sepia(1) hue-rotate(330deg) saturate(6)';
    default:
      return '';
  }
};

export const getRarityStyle = (rarity: number): string => {
  switch (true) {
    case rarity === 3:
      return "border-green-400 text-green-300";
    case rarity === 4:
      return "border-green-600 text-green-500";
    case rarity === 5:
      return "border-cyan-500 text-cyan-400";
    case rarity === 6:
      return "border-blue-500 text-blue-400";
    case rarity === 7:
      return "border-purple-500 text-purple-400";
    case rarity >= 8:
      return "border-orange-500 text-orange-400";
    default:
      return "border-surface-500 text-surface-400";
  }
};

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
  try {
    const { elements } = getAllWeaponElements(weapon);
    return elements.length > 0 ? elements[0] : null;
  } catch (err) {
    console.error("Error getting weapon element info:", err);
    return null;
  }
};

// Add helper function to get status info
export const getWeaponStatusInfo = (weapon: Weapon): { type: string, damage: number, hidden?: boolean } | null => {
  // Try to get all statuses and return the first one
  try {
    const { statuses } = getAllWeaponElements(weapon);
    return statuses.length > 0 ? statuses[0] : null;
  } catch (err) {
    console.error("Error getting weapon status info:", err);
    return null;
  }
};

export const getAllWeaponElements = (weapon: Weapon): { 
  elements: { type: string; damage: number; hidden?: boolean }[],
  statuses: { type: string; damage: number; hidden?: boolean }[]
} => {
  if (!weapon) return { elements: [], statuses: [] };
  
  const elements: { type: string; damage: number; hidden?: boolean }[] = [];
  const statuses: { type: string; damage: number; hidden?: boolean }[] = [];
  
  // Case 1: Direct element property
  if (weapon.element && typeof weapon.element === 'object') {
    elements.push({
      type: weapon.element.type,
      damage: weapon.element.damage,
      hidden: false
    });
  }
  
  // Case 2: Elements in specials array
  if (weapon.specials && Array.isArray(weapon.specials)) {
    
    weapon.specials.forEach((special, index) => {
      if (!special) return;
      
      try {
        const type = special.type || special.element || special.status;
        if (!type) return;
        
        let damage = 0;
        
        // Get damage from the complex damage object structure
        if (special.damage && typeof special.damage === 'object' && 'display' in special.damage) {
          damage = special.damage.display;
        } else if (special.damage && typeof special.damage === 'number') {
          damage = special.damage;
        } else if (special.value && typeof special.value === 'number') {
          damage = special.value;
        }
        
        // Determine if it's an element or status effect
        if ((special.kind === 'element' || special.element) && 
            ['fire', 'water', 'thunder', 'ice', 'dragon'].includes(type.toLowerCase())) {
          
          if (damage > 0) {
            elements.push({
              type,
              damage,
              hidden: !!special.hidden
            });
          }
        } 
        // Handle status effects
        else if (special.kind === 'status' || 
                special.status || 
                ['poison', 'sleep', 'paralysis', 'blast', 'stun'].includes(type.toLowerCase())) {
          
          if (damage > 0) {
            statuses.push({
              type,
              damage,
              hidden: !!special.hidden
            });
          }
        }
      } catch (err) {
        console.error("Error parsing weapon special:", err);
      }
    });
  }
  
  return { elements, statuses };
};


// Add a helper function to get status color
export function getStatusColor(statusType: string | undefined): string {
  if (!statusType) return 'text-surface-300';
  
  switch (statusType.toLowerCase()) {
    case 'poison':
      return 'text-purple-400';
    case 'paralysis':
      return 'text-yellow-300';
    case 'sleep':
      return 'text-blue-300';
    case 'blast':
      return 'text-orange-400';
    case 'stun':
      return 'text-amber-400';
    default:
      return 'text-surface-300';
  }
}

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
    'sword-shield': 'sword-shield',
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

export const getArmorImagePath = (armorType: EquipmentType): string => {
  // Map equipment types to their image filenames
  const imageMap: Record<EquipmentType, string> = {
    'head': 'helmet',
    'chest': 'chest',
    'arms': 'gauntlets',
    'waist': 'waist',
    'legs': 'greaves',
    'weapon': 'great-sword',
    'charm': 'charm',
  };
  
  // Return the path to the image
  return `/img/games/mhwilds/${imageMap[armorType] || 'helmet'}.webp`;
};