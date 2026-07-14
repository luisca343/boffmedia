import React from 'react';
import {
  Heart,
  Skull,
  Flame,
  Zap,
  Snowflake,
  Bed,
} from "lucide-react";
import { Mars, Venus, Neuter } from "./customIcons";

// Shared hand-drawn gender glyphs (lucide ships none). Sized "1em" so the
// existing text-sm/text-[8px] em-based sizing keeps working.
const MarsIcon = ({ className }: { className?: string }) => <Mars size="1em" className={className} />;
const VenusIcon = ({ className }: { className?: string }) => <Venus size="1em" className={className} />;
const NeuterIcon = ({ className }: { className?: string }) => <Neuter size="1em" className={className} />;

/**
 * Status icon utilities for Pokemon display components
 */

export interface StatusIconProps {
  status: string;
  className?: string;
  variant?: 'default' | 'card';
}

export function getStatusIcon(status: string, className: string = "text-xs"): React.ReactElement {
  switch (status.toLowerCase()) {
    case 'poison':
    case 'poisoned':
      return <Skull fill="currentColor" className={`${className} text-purple-400`} />;
    case 'burned':
      return <Flame className={`${className} text-red-400`} />;
    case 'paralyzed':
      return <Zap className={`${className} text-yellow-400`} />;
    case 'frozen':
      return <Snowflake className={`${className} text-blue-400`} />;
    case 'sleeping':
      return <Bed className={`${className} text-indigo-400`} />;
    case 'fainted':
      return <Skull className={`${className} text-red-500`} />;
    case 'healthy':
    default:
      return <Heart fill="currentColor" className={`${className} text-green-400`} />;
  }
}

/**
 * Gender icon utilities for Pokemon display components
 */

export interface GenderIconProps {
  gender?: string;
  variant?: 'default' | 'card';
  className?: string;
}

export function getGenderIcon(
  gender?: string, 
  variant: 'default' | 'card' = 'default',
  className?: string
): React.ReactElement | null {
  if (!gender) return null;
  
  const baseIconClass = className || (variant === 'card' ? "text-sm" : "text-xs w-4 h-4 flex items-center justify-center");
  
  switch (gender.toLowerCase()) {
    case 'male':
      if (variant === 'card') {
        return <MarsIcon className="text-blue-500 text-sm" />;
      }
      return (
        <div className={baseIconClass}>
          <MarsIcon className="text-blue-400 text-[8px]" />
        </div>
      );
    case 'female':
      if (variant === 'card') {
        return <VenusIcon className="text-pink-500 text-sm" />;
      }
      return (
        <div className={baseIconClass}>
          <VenusIcon className="text-pink-400 text-[8px]" />
        </div>
      );
    case 'genderless':
      if (variant === 'card') {
        return <NeuterIcon className="text-gray-500 text-sm" />;
      }
      return (
        <div className={baseIconClass}>
          <NeuterIcon className="text-gray-400 text-[8px]" />
        </div>
      );
    default:
      return null;
  }
}

/**
 * HP and status color utilities
 */

export function getHPBarColor(hpPercentage: number): string {
  if (hpPercentage > 50) return 'bg-gradient-to-r from-green-400 to-green-500';
  if (hpPercentage > 20) return 'bg-gradient-to-r from-yellow-400 to-orange-400';
  return 'bg-gradient-to-r from-red-500 to-red-600';
}

export function getHPBarColorSimple(hpPercentage: number): string {
  if (hpPercentage > 50) return 'bg-green-500';
  if (hpPercentage > 20) return 'bg-yellow-500';
  return 'bg-red-500';
}

export function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'poisoned':
    case 'poison':
      return 'text-purple-400';
    case 'burned':
      return 'text-red-400';
    case 'paralyzed':
      return 'text-yellow-400';
    case 'frozen':
      return 'text-blue-400';
    case 'sleeping':
      return 'text-gray-400';
    case 'fainted':
      return 'text-red-600';
    case 'healthy':
    default:
      return 'text-green-400';
  }
}

export function getStatusBorderColor(status: string): string {
  return getStatusColor(status).replace('text-', 'border-');
}

export function getStatusBackgroundColor(status: string): string {
  return getStatusColor(status).replace('text-', 'bg-');
}

/**
 * Pokemon state calculation utilities
 */

export interface PokemonHPInfo {
  currentHP: number;
  maxHP: number;
  hpPercentage: number;
  isFainted: boolean;
}

export function calculatePokemonHP(pokemon: any): PokemonHPInfo {
  const maxHP = pokemon?.stats?.[0] || 0;
  const currentHP = pokemon?.hp || 0;
  const hpPercentage = maxHP > 0 ? (currentHP / maxHP) * 100 : 0;
  const isFainted = pokemon?.status?.toLowerCase() === 'fainted' || currentHP === 0;
  
  return {
    currentHP,
    maxHP,
    hpPercentage,
    isFainted
  };
}

export function isPokemonShiny(pokemon: any): boolean {
  return pokemon?.palette === 'shiny';
}

export function getPokemonDisplayName(pokemon: any): string {
  if (!pokemon) return '';
  
  const baseName = pokemon.name || pokemon.species || '';
  const form = pokemon.form ? ` (${pokemon.form})` : '';
  
  return `${baseName}${form}`;
}

/**
 * Utility function to format Pokemon level display
 */
export function formatPokemonLevel(level: number): string {
  return `Nv. ${level}`;
}

/**
 * Utility function to check if Pokemon has a held item
 */
export function hasPokemonItem(pokemon: any): boolean {
  return pokemon?.item && pokemon.item !== 'item.minecraft.air' && pokemon.item !== 'none';
}
