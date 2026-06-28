'use client';

interface PokemonTypeChipProps {
  type: string;
  onClick?: () => void;
  clickable?: boolean;
  small?: boolean;
}

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  normal: { bg: 'bg-layer-3', text: 'text-ink-dim' },
  fire: { bg: 'bg-red-500', text: 'text-white' },
  water: { bg: 'bg-secondary', text: 'text-white' },
  electric: { bg: 'bg-yellow-400', text: 'text-yellow-900' },
  grass: { bg: 'bg-warning', text: 'text-white' },
  ice: { bg: 'bg-cyan-300', text: 'text-cyan-900' },
  fighting: { bg: 'bg-red-700', text: 'text-white' },
  poison: { bg: 'bg-secondary-active', text: 'text-white' },
  ground: { bg: 'bg-amber-600', text: 'text-white' },
  flying: { bg: 'bg-indigo-400', text: 'text-white' },
  psychic: { bg: 'bg-pink-500', text: 'text-white' },
  bug: { bg: 'bg-lime-500', text: 'text-white' },
  rock: { bg: 'bg-yellow-700', text: 'text-white' },
  ghost: { bg: 'bg-secondary-soft', text: 'text-white' },
  dragon: { bg: 'bg-indigo-700', text: 'text-white' },
  dark: { bg: 'bg-layer-3', text: 'text-white' },
  steel: { bg: 'bg-layer-3', text: 'text-ink-dim' },
  fairy: { bg: 'bg-pink-300', text: 'text-pink-900' },
};

export default function PokemonTypeChip({ type, onClick, clickable, small }: PokemonTypeChipProps) {
  const typeKey = type.toLowerCase();
  const colors = TYPE_COLORS[typeKey] || { bg: 'bg-layer-3', text: 'text-white' };
  
  return (
    <span
      className={`${colors.bg} ${colors.text} uppercase font-medium ${
        clickable ? 'cursor-pointer hover:opacity-90 flex items-center gap-1' : ''
      } ${
        small ? 'text-[10px] px-1 py-0.5 rounded-sm' : 'text-xs px-2 py-1 rounded'
      }`}
      onClick={onClick}
    >
      {type}
      {clickable && <span className="text-white/80">×</span>}
    </span>
  );
}