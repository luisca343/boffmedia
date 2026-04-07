'use client';

import PokemonSelector from './panel/PokemonSelector';
import TypeDisplay from './panel/TypeDisplay';
import BasicInfo from './panel/BasicInfo';
import StatDisplay from './panel/StatDisplay';
import PokemonDetails from './panel/PokemonDetails';
import HpControl from './panel/HpControl';
import MovesPanel from './panel/MovesPanel';
import { usePokemonPanelHandlers } from '../_hooks/usePokemonPanelHandlers';
import { useCalcContext } from '../_context/CalcContext';

interface PokemonPanelProps {
  title: string;
  side: 'attacker' | 'defender';
}

export default function PokemonPanel({ title, side }: PokemonPanelProps) {
  const {
    pokemon,
    moves,
    items,
    abilities,
    attackerState,
    defenderState,
    updateAttackerState,
    updateDefenderState,
    getPokemonAbilities
  } = useCalcContext();

  // Select the appropriate state and update function based on side
  const pokemonState = side === 'attacker' ? attackerState : defenderState;
  const setPokemonState = side === 'attacker' ? updateAttackerState : updateDefenderState;

  const {
    selectedPokemon,
    pokemonAbilities,
    calculateMaxHp,
    handlers: { handlePokemonChange, handleMoveChange, handleTeraTypeChange, handleGenderChange, handleLevelChange, handleNatureChange,
      handleAbilityChange, handleItemChange, handleStatusChange, handleHpChange, handleHpPercentChange, handleStatChange, 
      handleBoostChange, handleTerastallizedChange
    }
  } = usePokemonPanelHandlers({ pokemon, pokemonState, setPokemonState, getPokemonAbilities });

  return (
    <div className="border border-surface-700 rounded-lg p-3 bg-surface-800 shadow-lg">
      <h2 className="text-sm font-bold mb-2 text-center text-primary-400">{title}</h2>
      
      <PokemonSelector
        title="Pokémon"
        pokemon={pokemon}
        selectedPokemonId={pokemonState.pokemonId}
        onChange={handlePokemonChange}
      />

      {selectedPokemon && (
        <div className="space-y-2">
          {/* Top section with Types and Basic Info in a grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {/* Types section */}
            <TypeDisplay
              types={selectedPokemon.types || []}
              teraType={pokemonState.teraType}
              isTerastallized={pokemonState.isTerastallized}
              onTeraTypeChange={handleTeraTypeChange}
              onTerastallizedChange={handleTerastallizedChange}
            />
            
            {/* Basic Info */}
            <BasicInfo
              level={pokemonState.level}
              gender={pokemonState.gender}
              onLevelChange={handleLevelChange}
              onGenderChange={handleGenderChange}
            />
          </div>
          
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
      )}
    </div>
  );
}