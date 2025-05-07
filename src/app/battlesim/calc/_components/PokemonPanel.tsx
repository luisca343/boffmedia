'use client';

import PokemonSelector from './panel/PokemonSelector';
import TypeDisplay from './panel/TypeDisplay';
import BasicInfo from './panel/BasicInfo';
import StatDisplay from './panel/StatDisplay';
import PokemonDetails from './panel/PokemonDetails';
import HpControl from './panel/HpControl';
import MovesPanel from './panel/MovesPanel';
import { PokemonState } from '../_hooks/usePokemonState';
import { usePokemonPanelHandlers } from '../_hooks/usePokemonPanelHandlers';

interface PokemonPanelProps {
  title: string;
  pokemon: any[];
  moves: any[];
  items: any[];
  abilities: any[];
  pokemonState: PokemonState;
  setPokemonState: (state: Partial<PokemonState>) => void;
  getPokemonAbilities: (pokemonId: string, pokemonList: any[]) => string[];
  side: 'attacker' | 'defender';
}

export default function PokemonPanel({ title, pokemon, moves, items, abilities, pokemonState, setPokemonState, getPokemonAbilities, side }: PokemonPanelProps) {
  const {
    selectedPokemon,
    pokemonAbilities,
    calculateMaxHp,
    handlers: { handlePokemonChange, handleMoveChange, handleTeraTypeChange, handleGenderChange, handleLevelChange, handleNatureChange,
      handleAbilityChange, handleItemChange, handleStatusChange, handleHpChange, handleHpPercentChange,  handleStatChange, 
      handleBoostChange, handleTerastallizedChange
    }
  } = usePokemonPanelHandlers({ pokemon, pokemonState, setPokemonState, getPokemonAbilities });

  return (
    <div className="border border-surface-700 rounded-lg p-3 bg-surface-800 shadow-lg">
      <h2 className="text-sm font-bold mb-3 text-center text-primary-400">{title}</h2>
      
      <PokemonSelector
        title="Pokémon"
        pokemon={pokemon}
        selectedPokemonId={pokemonState.pokemonId}
        onChange={handlePokemonChange}
      />

      {selectedPokemon && (
        <>
          <div className="space-y-2">
            {/* Types and Basic Info */}
            <TypeDisplay
              types={selectedPokemon.types || []}
              teraType={pokemonState.teraType}
              isTerastallized={pokemonState.isTerastallized}
              onTeraTypeChange={handleTeraTypeChange}
              onTerastallizedChange={handleTerastallizedChange}
            />
            
            <BasicInfo
              level={pokemonState.level}
              forme={pokemonState.forme}
              gender={pokemonState.gender}
              onLevelChange={handleLevelChange}
              onGenderChange={handleGenderChange}
            />
            
            {/* Stats */}
            <StatDisplay 
              baseStats={selectedPokemon.baseStats}
              evs={pokemonState.evs}
              ivs={pokemonState.ivs}
              boosts={pokemonState.boosts}
              nature={pokemonState.nature}
              level={pokemonState.level}
              onStatChange={handleStatChange}
              onBoostChange={handleBoostChange}
            />

            {/* Pokemon Details */}
            <PokemonDetails
              nature={pokemonState.nature}
              ability={pokemonState.ability}
              item={pokemonState.item}
              status={pokemonState.status}
              pokemonAbilities={pokemonAbilities}
              allAbilities={abilities}
              allItems={items}
              onNatureChange={handleNatureChange}
              onAbilityChange={handleAbilityChange}
              onItemChange={handleItemChange}
              onStatusChange={handleStatusChange}
            />
            
            {/* HP Control */}
            <HpControl
              currentHp={pokemonState.currentHp}
              maxHp={calculateMaxHp()}
              currentHpPercent={pokemonState.currentHpPercent}
              onHpChange={handleHpChange}
              onHpPercentChange={handleHpPercentChange}
            />
            
            {/* Moves */}
            <MovesPanel
              moves={moves}
              selectedMoves={pokemonState.moveIds}
              onMoveChange={handleMoveChange}
            />
          </div>
        </>
      )}
    </div>
  );
}