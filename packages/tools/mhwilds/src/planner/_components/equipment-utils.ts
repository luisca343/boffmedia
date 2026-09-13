import { ArmorPiece, EquipmentType, Weapon } from "../../types";
import { assetUrl, hasToolHost } from "@boffmedia/tool-kit";
import { mhwildsItemIconAsset } from "../../bestiary/assets";
import { attributeKind, attributeColor } from "../../ui/mh-helpers";

const MHWILDS_ICON_PATH = "/boffmedia/img/games/mhwilds";

function mhWildsAsset(fileName: string): string {
  const rooted = `${MHWILDS_ICON_PATH}/${fileName}`;
  return hasToolHost() ? assetUrl(rooted) : rooted;
}

function clampIconIndex(value: number | undefined, max: number): number {
  return Math.max(1, Math.min(max, value || 1));
}

const DECORATION_ICON_COLORS = new Set([
  "blue",
  "brown",
  "dark-blue",
  "dark-green",
  "dark-purple",
  "dark-red",
  "deep-teal",
  "gold",
  "green",
  "grey",
  "light-brown",
  "light-green",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "white",
  "yellow",
]);

const DECORATION_ICON_COLOR_ALIASES: Record<string, string> = {
  gray: "grey",
  vermilion: "orange",
  ivory: "light-brown",
  rose: "pink",
  sky: "deep-teal",
  emerald: "teal",
  lemon: "gold",
  "sage-green": "light-green",
  "moss-green": "dark-green",
  ultramarine: "dark-blue",
  "blue-purple": "purple",
  none: "white",
};

const DECORATION_COLOR_BY_ID: Record<number, string> = {
  1: "white",
  2: "gray",
  3: "rose",
  4: "pink",
  5: "red",
  6: "vermilion",
  7: "orange",
  8: "brown",
  9: "ivory",
  10: "yellow",
  11: "lemon",
  12: "sage-green",
  13: "moss-green",
  14: "green",
  15: "emerald",
  16: "sky",
  17: "blue",
  18: "ultramarine",
  19: "blue-purple",
  20: "purple",
  21: "dark-purple",
};

function decorationIconColor(color?: string, colorId?: number): string | null {
  const name = color?.trim().toLowerCase();
  const source = name || (colorId == null ? undefined : DECORATION_COLOR_BY_ID[colorId]);
  if (!source) return null;
  const canonical = DECORATION_ICON_COLOR_ALIASES[source] || source;
  return DECORATION_ICON_COLORS.has(canonical) ? canonical : null;
}

/**
 * Resolve the exact coloured decoration glyph. The old implementation used
 * a grayscale/sepia CSS filter over a slot PNG; that loses the game's 19
 * colour variants and makes every jewel look muddy. Keep the slot PNG only
 * as a fallback for legacy callers without semantic icon metadata.
 */
export const getDecorationImagePath = (
  slot?: number,
  color?: string,
  colorId?: number,
): string => {
  const canonical = decorationIconColor(color, colorId);
  return (
    (canonical && mhwildsItemIconAsset("decoration", canonical)) ||
    mhWildsAsset(`decoration-${clampIconIndex(slot, 3)}.png`)
  );
};

export type DecorationSlotKind = "weapon" | "armor";

export const getDecorationSlotImagePath = (
  slot?: number,
  kind: DecorationSlotKind = "armor",
): string => mhWildsAsset(`decoration-slot-${kind}-${clampIconIndex(slot, 3)}.png`);

// Wilds decoration colors belong to the decoration icon family, not to the
// decoration rarity. The API exposes the game's color name and color id; keep
// both as inputs so a stale/localized payload can still resolve by id.
const DECORATION_COLOR_FILTERS: Record<string, string> = {
  white: "grayscale(1) brightness(1.35)",
  gray: "grayscale(1) brightness(0.72)",
  rose: "grayscale(1) sepia(1) hue-rotate(300deg) saturate(4)",
  pink: "grayscale(1) sepia(1) hue-rotate(320deg) saturate(5)",
  red: "grayscale(1) sepia(1) hue-rotate(345deg) saturate(6)",
  vermilion: "grayscale(1) sepia(1) hue-rotate(5deg) saturate(6)",
  orange: "grayscale(1) sepia(1) hue-rotate(20deg) saturate(6)",
  brown: "grayscale(1) sepia(1) hue-rotate(35deg) saturate(3.5)",
  ivory: "grayscale(1) sepia(0.65) hue-rotate(45deg) saturate(2.2) brightness(1.15)",
  yellow: "grayscale(1) sepia(1) hue-rotate(55deg) saturate(6)",
  lemon: "grayscale(1) sepia(1) hue-rotate(68deg) saturate(5)",
  "sage-green": "grayscale(1) sepia(1) hue-rotate(82deg) saturate(4)",
  "moss-green": "grayscale(1) sepia(1) hue-rotate(102deg) saturate(4)",
  green: "grayscale(1) sepia(1) hue-rotate(122deg) saturate(5)",
  emerald: "grayscale(1) sepia(1) hue-rotate(145deg) saturate(5)",
  sky: "grayscale(1) sepia(1) hue-rotate(175deg) saturate(5)",
  blue: "grayscale(1) sepia(1) hue-rotate(198deg) saturate(5)",
  ultramarine: "grayscale(1) sepia(1) hue-rotate(220deg) saturate(6)",
  "blue-purple": "grayscale(1) sepia(1) hue-rotate(242deg) saturate(5)",
  purple: "grayscale(1) sepia(1) hue-rotate(265deg) saturate(5)",
  "dark-purple": "grayscale(1) sepia(1) hue-rotate(285deg) saturate(5)",
};

export const getDecorationColorFilterStyle = (color?: string, colorId?: number): string => {
  const normalized = color?.trim().toLowerCase();
  const resolved = (normalized && DECORATION_COLOR_FILTERS[normalized] ? normalized : undefined)
    || (colorId != null ? DECORATION_COLOR_BY_ID[colorId] : undefined);
  return resolved ? DECORATION_COLOR_FILTERS[resolved] || "" : "";
};

export const getCharmImagePath = (rarity?: number): string =>
  mhWildsAsset(`talisman-${clampIconIndex(rarity, 8)}.png`);

export const getEquipmentDisplayName = (slotType: EquipmentType): string => {
  const typeNames: Record<EquipmentType, string> = {
    weapon: 'Arma',
    secondaryWeapon: 'Arma secundaria',
    head: 'Casco',
    chest: 'Pecho',
    arms: 'Brazos',
    waist: 'Cintura',
    legs: 'Piernas',
    charm: 'Amuleto'
  };
  return typeNames[slotType] || slotType.charAt(0).toUpperCase() + slotType.slice(1);
};

export const getRarityFilterStyle = (rarity: number): string => {
  switch (true) {
    case rarity === 3: 
      return 'grayscale(1) brightness(0.8) sepia(0.5) hue-rotate(80deg) saturate(5)';
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
      return "border-warning-border text-warning-hover";
    case rarity === 4:
      return "border-warning-border text-warning";
    case rarity === 5:
      return "border-cyan-500 text-cyan-400";
    case rarity === 6:
      return "border-signal text-signal";
    case rarity === 7:
      return "border-signal text-signal";
    case rarity >= 8:
      return "border-orange-500 text-orange-400";
    default:
      return "border-line text-txt-muted";
  }
};

// Compatibility helper for older callers. New MH UI should use the shared
// attribute component or attributeColor() so elements and ailments cannot
// drift into separate palettes.
export const getElementColor = (elementType: string): string => {
  return attributeColor(elementType);
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
    const direct = {
      type: weapon.element.type,
      damage: weapon.element.damage,
      hidden: false
    };
    (attributeKind(direct.type) === "ailment" ? statuses : elements).push(direct);
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
        const kind = attributeKind(type);
        if ((special.kind === 'element' || special.element || kind === 'element') && kind === 'element') {
          
          if (damage > 0) {
            elements.push({
              type,
              damage,
              hidden: !!special.hidden
            });
          }
        } 
        // Handle status effects
        else if (special.kind === 'status' || special.status || kind === 'ailment') {
          
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
  return attributeColor(statusType);
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
    'sword-and-shield': 'sword-shield',
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
  return mhWildsAsset(`${iconMap[normalizedType] || 'great-sword'}.webp`);
};

export const getArmorImagePath = (armorType: EquipmentType | string): string => {
  const imageMap: Record<string, string> = {
    'head': 'helmet',
    'chest': 'chest',
    'arms': 'gauntlets',
    'waist': 'waist',
    'legs': 'greaves',
    'weapon': 'great-sword',
    'secondaryWeapon': 'great-sword',
    'charm': 'charm',
  };

  // Return the path to the image
  return mhWildsAsset(`${imageMap[armorType] || 'helmet'}.webp`);
};
