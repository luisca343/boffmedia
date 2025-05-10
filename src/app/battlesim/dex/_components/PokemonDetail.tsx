'use client';

import { useState } from 'react';
import { useDexContext } from '../_context/DexContext';
import PokemonTypeChip from './PokemonTypeChip';
import PokemonStats from './PokemonStats';
import TierBadge from './TierBadge';

interface PokemonDetailProps {
  pokemonId: string;
}

export default function PokemonDetail({ pokemonId }: PokemonDetailProps) {
  const { pokemon, setSelectedPokemon, addFilter } = useDexContext();
  const [activeTab, setActiveTab] = useState('stats');
  
  // Find the Pokémon data
  const pokemonData = pokemon.find(p => p.id === pokemonId);
  
  if (!pokemonData) {
    return (
      <div className="bg-surface-800 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-surface-100">Pokémon not found</h2>
          <button
            onClick={() => setSelectedPokemon(null)}
            className="text-surface-400 hover:text-surface-200 text-sm"
          >
            Back to list
          </button>
        </div>
      </div>
    );
  }
  
  const spriteUrl = getPokemonSpriteUrl(pokemonData);
  const abilities = Object.values(pokemonData.abilities || {});
  
  return (
    <div className="bg-surface-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-surface-100">{pokemonData.name}</h2>
        <button
          onClick={() => setSelectedPokemon(null)}
          className="text-surface-400 hover:text-surface-200 text-sm"
        >
          Back to list
        </button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Left Column - Sprite and basic info */}
        <div className="w-full md:w-1/3">
          <div className="bg-surface-700 p-4 rounded-lg flex items-center justify-center h-48">
            {spriteUrl ? (
              <img 
                src={spriteUrl} 
                alt={pokemonData.name} 
                className="h-auto w-auto max-h-full max-w-full object-contain"
              />
            ) : (
              <div className="text-surface-500">No Image Available</div>
            )}
          </div>
          
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 mb-3">
              {pokemonData.types.map((type: string) => (
                <PokemonTypeChip 
                  key={type} 
                  type={type} 
                  clickable
                  onClick={() => addFilter('types', type)}
                />
              ))}
              {pokemonData.tier && <TierBadge tier={pokemonData.tier} />}
            </div>
            
            <div className="mb-4">
              <h3 className="text-sm font-medium text-surface-300 mb-1">Abilities</h3>
              <div className="flex flex-col gap-1">
                {abilities.map((ability, index) => (
                  <button
                    key={index}
                    className="text-sm bg-surface-700 p-2 rounded text-left hover:bg-surface-600"
                    onClick={() => addFilter('abilities', ability as string)}
                  >
                    {ability as string}
                  </button>
                ))}
              </div>
            </div>
            
            {pokemonData.eggGroups && (
              <div>
                <h3 className="text-sm font-medium text-surface-300 mb-1">Egg Groups</h3>
                <div className="flex flex-wrap gap-1">
                  {pokemonData.eggGroups.map((group: string) => (
                    <span
                      key={group}
                      className="text-xs bg-green-900 text-green-100 px-2 py-1 rounded cursor-pointer"
                      onClick={() => addFilter('eggGroups', group)}
                    >
                      {group}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Right Column - Tabs with data */}
        <div className="w-full md:w-2/3">
          <div className="border-b border-surface-700 mb-4">
            <div className="flex">
              <button
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'stats' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-surface-400'
                }`}
                onClick={() => setActiveTab('stats')}
              >
                Stats
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'moves' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-surface-400'
                }`}
                onClick={() => setActiveTab('moves')}
              >
                Moves
              </button>
              <button
                className={`py-2 px-4 text-sm font-medium ${
                  activeTab === 'evolution' ? 'border-b-2 border-primary-500 text-primary-400' : 'text-surface-400'
                }`}
                onClick={() => setActiveTab('evolution')}
              >
                Evolution
              </button>
            </div>
          </div>
          
          {activeTab === 'stats' && (
            <PokemonStats baseStats={pokemonData.baseStats} />
          )}
          
          {activeTab === 'moves' && (
            <div>
              <h3 className="text-sm font-medium text-surface-300 mb-2">Learnable Moves</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Replace with actual moves data */}
                {['Move 1', 'Move 2', 'Move 3', 'Move 4', 'Move 5'].map((move, index) => (
                  <div 
                    key={index}
                    className="bg-surface-700 p-2 rounded cursor-pointer hover:bg-surface-600"
                    onClick={() => addFilter('moves', move)}
                  >
                    {move}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'evolution' && (
            <div>
              <h3 className="text-sm font-medium text-surface-300 mb-2">Evolution Chain</h3>
              <div className="bg-surface-700 p-3 rounded">
                Evolution data not available
              </div>
            </div>
          )}
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