'use client';

import PokemonTypeChip from './PokemonTypeChip';
import TierBadge from './TierBadge';

interface PokemonListItemProps {
  pokemon: any;
  onClick: () => void;
}

export default function PokemonListItem({ pokemon, onClick }: PokemonListItemProps) {
  const spriteUrl = getPokemonSpriteUrl(pokemon);
  
  return (
    <div 
      className="bg-surface-800 rounded-lg p-3 cursor-pointer hover:bg-surface-700/80 transition-colors flex items-center gap-3"
      onClick={onClick}
    >
      <div className="h-16 w-16 bg-surface-700 rounded-lg flex items-center justify-center">
        {spriteUrl ? (
          <img 
            src={spriteUrl} 
            alt={pokemon.name} 
            className="h-auto w-auto max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-surface-500 text-xs">No Image</div>
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-surface-100">{pokemon.name}</h3>
          {pokemon.tier && <TierBadge tier={pokemon.tier} />}
        </div>
        
        <div className="flex items-center gap-1 mt-1">
          {pokemon.types.map((type: string) => (
            <PokemonTypeChip key={type} type={type} />
          ))}
        </div>
        
        <div className="flex items-center gap-2 mt-1.5 text-xs text-surface-400">
          <span>HP: {pokemon.baseStats.hp}</span>
          <span>Atk: {pokemon.baseStats.atk}</span>
          <span>Def: {pokemon.baseStats.def}</span>
        </div>
      </div>
    </div>
  );
}

function getPokemonSpriteUrl(pokemon: any) {
  // Try to get sprite from @pkmn/img or another source
  try {
    // This is a placeholder, you'll need to implement proper sprite fetching
    return `https://play.pokemonshowdown.com/sprites/ani/${pokemon.id}.gif`;
  } catch (error) {
    return null;
  }
}