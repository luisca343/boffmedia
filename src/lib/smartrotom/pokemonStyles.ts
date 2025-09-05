/**
 * CSS class utilities for Pokemon PC components
 */

/**
 * Get container classes based on Pokemon state and selection
 */
export function getPokemonSlotClasses(
  isSelected: boolean,
  pokemon: any,
  isFainted: boolean,
  isDragOver: boolean = false
): string {
  const baseClasses = "group relative h-20 backdrop-blur-sm border-2 rounded-2xl transition-all duration-200 cursor-pointer select-none overflow-hidden";
  
  if (isDragOver) {
    return `${baseClasses} border-green-400 bg-green-400/10`;
  }
  
  if (isSelected) {
    return `${baseClasses} border-blue-400 bg-blue-400/10`;
  }
  
  if (pokemon) {
    if (isFainted) {
      return `${baseClasses} border-red-400/60 bg-slate-800/40 hover:border-red-400/80`;
    }
    return `${baseClasses} border-slate-500/50 bg-slate-800/40 hover:border-slate-400/80`;
  }
  
  return `${baseClasses} border-slate-600/40 bg-slate-800/20 border-dashed hover:border-slate-500/60`;
}

/**
 * Get text classes based on Pokemon state
 */
export function getPokemonTextClasses(isFainted: boolean, variant: 'primary' | 'secondary' = 'primary'): string {
  if (isFainted) {
    return variant === 'primary' ? 'text-red-300' : 'text-red-200';
  }
  return variant === 'primary' ? 'text-white' : 'text-slate-300';
}

/**
 * Get level display classes
 */
export function getLevelClasses(isFainted: boolean): string {
  const baseClasses = "flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 border border-white/20";
  return `${baseClasses} ${isFainted ? 'text-red-300' : 'text-slate-200'}`;
}

/**
 * Get status indicator classes
 */
export function getStatusIndicatorClasses(status: string): string {
  const statusColors = {
    'poison': 'border-purple-400',
    'poisoned': 'border-purple-400',
    'burned': 'border-red-400',
    'paralyzed': 'border-yellow-400',
    'frozen': 'border-blue-400',
    'sleeping': 'border-indigo-400',
    'fainted': 'border-red-600',
    'healthy': 'border-green-400'
  };
  
  const colorClass = statusColors[status.toLowerCase() as keyof typeof statusColors] || 'border-green-400';
  return `flex items-center space-x-1 px-1.5 py-0.5 rounded-full bg-black/20 border ${colorClass} backdrop-blur-sm`;
}

/**
 * Get HP bar container classes
 */
export function getHPBarContainerClasses(): string {
  return "w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden backdrop-blur-sm";
}

/**
 * Common background pattern classes
 */
export const BACKGROUND_PATTERNS = {
  subtle: "absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5 pointer-events-none",
  box: "absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none",
  card: "absolute inset-0 bg-gradient-to-br from-purple-800/20 via-indigo-800/20 to-blue-800/20 backdrop-blur-sm rounded-2xl border border-purple-400/30 shadow-2xl"
} as const;
