'use client';

import { useState, useEffect } from 'react';
import MoveSelector from './MoveSelector';
import StatDisplay from './StatDisplay';

interface PokemonPanelProps {
  title: string;
  pokemon: any[];
  moves: any[];
  pokemonState: {
    pokemonId: string;
    moveIds: string[];
    nature: string;
    evs: { hp: number, atk: number, def: number, spa: number, spd: number, spe: number };
    ivs: { hp: number, atk: number, def: number, spa: number, spd: number, spe: number };
    level: number;
  };
  setPokemonState: (state: any) => void;
  side: 'attacker' | 'defender';
}

export default function PokemonPanel({
  title,
  pokemon,
  moves,
  pokemonState,
  setPokemonState,
  side
}: PokemonPanelProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);
  const natures = [
    'Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 
    'Careful', 'Docile', 'Gentle', 'Hardy', 'Hasty',
    'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild',
    'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky',
    'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid'
  ];

  useEffect(() => {
    if (pokemonState.pokemonId) {
      const selected = pokemon.find(p => p.id === pokemonState.pokemonId);
      setSelectedPokemon(selected || null);
    } else {
      setSelectedPokemon(null);
    }
  }, [pokemonState.pokemonId, pokemon]);

const handlePokemonChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setPokemonState({
        ...pokemonState,
        pokemonId: e.target.value,
        moveIds: ["", "", "", ""] // Reset moves when changing Pokémon
    });
};

interface MoveChangeHandler {
    (index: number, moveId: string): void;
}

const handleMoveChange: MoveChangeHandler = (index, moveId) => {
    const newMoveIds = [...pokemonState.moveIds];
    newMoveIds[index] = moveId;
    setPokemonState({
        ...pokemonState,
        moveIds: newMoveIds
    });
};

const handleNatureChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    setPokemonState({
        ...pokemonState,
        nature: e.target.value
    });
};

const handleLevelChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setPokemonState({
        ...pokemonState,
        level: parseInt(e.target.value) || 100
    });
};

const handleStatChange = (
    stat: string,
    value: number,
    isEV: boolean
): void => {
    if (stat === 'hp' || stat === 'atk' || stat === 'def' || stat === 'spa' || stat === 'spd' || stat === 'spe') {
        setPokemonState({
            ...pokemonState,
            [isEV ? 'evs' : 'ivs']: {
                ...pokemonState[isEV ? 'evs' : 'ivs'],
                [stat]: value
            }
        });
    }
};

  return (
    <div className="border rounded p-4 bg-gray-50">
      <h2 className="text-xl font-semibold mb-4 text-center">{title}</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">Pokémon</label>
        <select 
          className="w-full p-2 border rounded"
          value={pokemonState.pokemonId} 
          onChange={handlePokemonChange}
        >
          <option value="">Select Pokémon</option>
          {pokemon.map(poke => (
            <option key={poke.id} value={poke.id}>
              {poke.name}
            </option>
          ))}
        </select>
      </div>

      {selectedPokemon && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <div className="flex space-x-1">
                {selectedPokemon.types.map((type: string) => (
                  <div key={type} className="px-2 py-1 rounded bg-gray-200 text-sm">
                    {type}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Level</label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                min="1"
                max="100"
                value={pokemonState.level}
                onChange={handleLevelChange}
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Nature</label>
            <select 
              className="w-full p-2 border rounded"
              value={pokemonState.nature} 
              onChange={handleNatureChange}
            >
              {natures.map(nature => (
                <option key={nature} value={nature}>
                  {nature}
                </option>
              ))}
            </select>
          </div>

          <StatDisplay 
            baseStats={selectedPokemon.baseStats}
            evs={pokemonState.evs}
            ivs={pokemonState.ivs}
            nature={pokemonState.nature}
            level={pokemonState.level}
            onStatChange={handleStatChange}
          />

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Moves</h3>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <MoveSelector 
                  key={index}
                  moves={moves}
                  selectedMove={pokemonState.moveIds[index]}
                  setSelectedMove={(moveId) => handleMoveChange(index, moveId)}
                  isDisabled={false}
                  label={`Move ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}