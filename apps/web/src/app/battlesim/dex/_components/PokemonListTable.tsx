'use client';

import { useState } from 'react';
import PokemonTypeChip from './PokemonTypeChip';
import TierBadge from './TierBadge';
import { Sprites } from '@pkmn/img';

interface PokemonListTableProps {
  pokemon: any[];
  onPokemonClick: (id: string) => void;
  displayLimit: number;
  onLoadMore: () => void;
  currentGeneration: string;
  compact?: boolean;
}

export default function PokemonListTable({
  pokemon,
  onPokemonClick,
  displayLimit,
  onLoadMore,
  currentGeneration,
  compact = false
}: PokemonListTableProps) {
  // Get Pokemon sprite using @pkmn/img library
  const getPokemonSprite = (pokemon: any) => {
    try {
      // Map generations to @pkmn/img format
      const genMapping: Record<string, string> = {
        'rb': 'gen1',
        'gs': 'gen2',
        'rs': 'gen3rs',
        'dp': 'gen4dp',
        'bw': 'gen5',
        'xy': 'gen6',
        'sm': 'gen7',
        'ss': 'gen8',
        'sv': 'gen9'
      };
      
      const genOption = genMapping[currentGeneration] || 'gen8';
      const spriteInfo = Sprites.getPokemon(pokemon.id.toLowerCase(), {gen: genOption as any});
      
      return {
        url: spriteInfo.url,
        width: spriteInfo.w,
        height: spriteInfo.h,
        pixelated: spriteInfo.pixelated
      };
    } catch (error) {
      // Fallback to Showdown sprites if @pkmn/img fails
      return {
        url: `https://play.pokemonshowdown.com/sprites/ani/${pokemon.id.toLowerCase()}.gif`,
        width: 40,
        height: 40,
        pixelated: false
      };
    }
  };

  const pokemonToShow = pokemon.slice(0, displayLimit);

  return (
    <>
      <div className="mb-3 text-ink-muted text-sm">
        Showing {pokemonToShow.length} of {pokemon.length} Pokémon
      </div>
      
      <div className="bg-layer-2 rounded-lg p-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left text-ink-muted text-sm border-b border-edge">
              <th className={compact ? "p-1.5" : "p-2"}>Name</th>
              <th className={compact ? "p-1.5" : "p-2"}>Types</th>
              <th className={compact ? "p-1.5" : "p-2"}>Tier</th>
              {!compact && <th className="p-2">Abilities</th>}
              <th className={`${compact ? "p-1.5" : "p-2"} text-right`}>BST</th>
            </tr>
          </thead>
          <tbody>
            {pokemonToShow.map(pokemon => {
              const sprite = getPokemonSprite(pokemon);
              const bst = Object.values(pokemon.baseStats).reduce((a: number, b: unknown) => a + (Number(b) || 0), 0);
              
              return (
                <tr 
                  key={pokemon.id} 
                  className="border-b border-edge/50 hover:bg-layer-3/30 cursor-pointer"
                  onClick={() => onPokemonClick(pokemon.id)}
                >
                  <td className={compact ? "p-1.5" : "p-2"}>
                    <div className="flex items-center gap-2">
                      <div className={`${compact ? "w-8 h-8" : "w-10 h-10"} bg-layer-3 rounded flex items-center justify-center overflow-hidden`}>
                        <img 
                          src={sprite.url}
                          alt={pokemon.name}
                          width={sprite.width}
                          height={sprite.height}
                          className="max-h-full max-w-full"
                          style={{ 
                            imageRendering: sprite.pixelated ? 'pixelated' : 'auto'
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 
                              `https://play.pokemonshowdown.com/sprites/ani/${pokemon.id.toLowerCase()}.gif`;
                          }}
                        />
                      </div>
                      <span className={`font-medium ${compact ? "text-sm" : ""} text-ink`}>{pokemon.name}</span>
                    </div>
                  </td>
                  <td className={compact ? "p-1.5" : "p-2"}>
                    <div className="flex gap-1">
                      {pokemon.types.map((type: string) => (
                        <PokemonTypeChip key={type} type={type} small />
                      ))}
                    </div>
                  </td>
                  <td className={compact ? "p-1.5" : "p-2"}>
                    {pokemon.tier && <TierBadge tier={pokemon.tier} />}
                  </td>
                  {!compact && (
                    <td className="p-2 text-xs text-ink">
                      <div className="flex flex-wrap gap-1">
                        {Object.values(pokemon.abilities).map((ability, idx: number) => (
                          <span 
                            key={`${pokemon.id}-ability-${idx}`}
                            className="bg-layer-3 px-1.5 py-0.5 rounded"
                          >
                            {String(ability)}
                          </span>
                        ))}
                      </div>
                    </td>
                  )}
                  <td className={`${compact ? "p-1.5" : "p-2"} text-right text-xs text-ink`}>
                    {bst}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {pokemon.length > displayLimit && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-layer-3 text-ink rounded-md hover:bg-layer-3 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </>
  );
}