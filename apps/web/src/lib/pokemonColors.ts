/**
 * Standardized color utilities for Pokemon stats and UI components
 */

export interface StatColorRange {
  min: number;
  max: number;
  color: string;
  label: string;
}

export interface TotalStatColorRange {
  min: number;
  max: number;
  color: string;
  label: string;
  description: string;
}

// Individual stat color ranges
export const STAT_COLOR_RANGES: StatColorRange[] = [
  { min: 0, max: 49, color: '#ff4d4d', label: 'Very Low' },
  { min: 50, max: 74, color: '#ff7c4d', label: 'Low' },
  { min: 75, max: 89, color: '#ffb14d', label: 'Below Average' },
  { min: 90, max: 109, color: '#ffea4d', label: 'Average' },
  { min: 110, max: 129, color: '#b1ff4d', label: 'Above Average' },
  { min: 130, max: 149, color: '#4dffa6', label: 'High' },
  { min: 150, max: 255, color: '#4d8aff', label: 'Very High' },
];

// Total stat color ranges
export const TOTAL_STAT_COLOR_RANGES: TotalStatColorRange[] = [
  { min: 0, max: 299, color: '#ff4d4d', label: 'Very Low', description: 'Base muy baja' },
  { min: 300, max: 399, color: '#ff7c4d', label: 'Low', description: 'Base baja' },
  { min: 400, max: 499, color: '#ffb14d', label: 'Below Average', description: 'Base media' },
  { min: 500, max: 539, color: '#ffea4d', label: 'Average', description: 'Base media' },
  { min: 540, max: 579, color: '#b1ff4d', label: 'Above Average', description: 'Base alta' },
  { min: 580, max: 619, color: '#4dffa6', label: 'High', description: 'Base muy alta' },
  { min: 620, max: 999, color: '#4d8aff', label: 'Very High', description: 'Base legendaria' },
];

// Pokemon stat progress bar colors (0-255 scale mapped to 0-100%)
export const POKEMON_STAT_COLORS = {
  hp: '#ff6b6b',        // Red
  attack: '#ff8c42',    // Orange  
  defense: '#ffd93d',   // Yellow
  specialAttack: '#6bcf7f', // Green
  specialDefense: '#4dabf7', // Blue
  speed: '#9775fa',     // Purple
} as const;

/**
 * Get color for an individual stat value (0-255 range)
 */
export function getStatColor(stat: number): string {
  const range = STAT_COLOR_RANGES.find(range => stat >= range.min && stat <= range.max);
  return range?.color || STAT_COLOR_RANGES[STAT_COLOR_RANGES.length - 1].color;
}

/**
 * Get color for total stats
 */
export function getTotalStatColor(total: number): string {
  const range = TOTAL_STAT_COLOR_RANGES.find(range => total >= range.min && total <= range.max);
  return range?.color || TOTAL_STAT_COLOR_RANGES[TOTAL_STAT_COLOR_RANGES.length - 1].color;
}

/**
 * Get color label for a stat value
 */
export function getStatColorLabel(stat: number): string {
  const range = STAT_COLOR_RANGES.find(range => stat >= range.min && stat <= range.max);
  return range?.label || 'Unknown';
}

/**
 * Get total stat description in Spanish
 */
export function getTotalStatDescription(total: number): string {
  const range = TOTAL_STAT_COLOR_RANGES.find(range => total >= range.min && total <= range.max);
  return range?.description || 'Desconocido';
}

/**
 * Get Pokemon stat color by stat name
 */
export function getPokemonStatColor(statName: string): string {
  const normalizedName = statName.toLowerCase().replace(/[^a-z]/g, '');
  
  switch (normalizedName) {
    case 'hp':
    case 'ps':
      return POKEMON_STAT_COLORS.hp;
    case 'attack':
    case 'ataque':
      return POKEMON_STAT_COLORS.attack;
    case 'defense':
    case 'defensa':
      return POKEMON_STAT_COLORS.defense;
    case 'specialattack':
    case 'atespecial':
      return POKEMON_STAT_COLORS.specialAttack;
    case 'specialdefense':
    case 'defespecial':
      return POKEMON_STAT_COLORS.specialDefense;
    case 'speed':
    case 'velocidad':
      return POKEMON_STAT_COLORS.speed;
    default:
      return '#6c757d'; // Gray fallback
  }
}

/**
 * Convert stat value to percentage for progress bars (255 max)
 */
export function statToPercentage(stat: number, max: number = 255): number {
  return Math.min((stat / max) * 100, 100);
}

/**
 * Get contrasting text color for a background color
 */
export function getContrastingTextColor(backgroundColor: string): string {
  // Remove # if present
  const hex = backgroundColor.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
