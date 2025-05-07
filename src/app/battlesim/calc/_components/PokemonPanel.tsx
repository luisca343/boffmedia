'use client';

import { useState, useEffect } from 'react';
import PokemonSelector from './panel/PokemonSelector';
import TypeDisplay from './panel/TypeDisplay';
import BasicInfo from './panel/BasicInfo';
import StatDisplay from './panel/StatDisplay';
import PokemonDetails from './panel/PokemonDetails';
import HpControl from './panel/HpControl';
import MovesPanel from './panel/MovesPanel';

interface PokemonPanelProps {
  title: string;
  pokemon: any[];
  moves: any[];
  items: any[];
  abilities: any[];
  pokemonState: {
    pokemonId: string;
    moveIds: string[];
    nature: string;
    evs: { hp: number, atk: number, def: number, spa: number, spd: number, spe: number };
    ivs: { hp: number, atk: number, def: number, spa: number, spd: number, spe: number };
    boosts: { atk: number, def: number, spa: number, spd: number, spe: number };
    level: number;
    teraType: string;
    isTerastallized: boolean;
    forme: string;
    gender: string;
    ability: string;
    item: string;
    status: string;
    currentHp: number;
    currentHpPercent: number;
  };
  setPokemonState: (state: any) => void;
  
  side: 'attacker' | 'defender';
}


export default function PokemonPanel({
  title,
  pokemon,
  moves,
  items,
  abilities,
  pokemonState,
  setPokemonState,
  side
}: PokemonPanelProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);
  const [pokemonAbilities, setPokemonAbilities] = useState<string[]>([]);

  useEffect(() => {
    if (pokemonState.pokemonId) {
      const selected = pokemon.find(p => p.id === pokemonState.pokemonId);
      setSelectedPokemon(selected || null);
      
      // Set the available abilities for this Pokémon
      if (selected) {
        // Fetch the actual species data to get abilities
        const speciesData = pokemon.find(p => p.id === pokemonState.pokemonId);
        if (speciesData && speciesData.abilities) {
          // Collect all abilities from the abilities object
          const availableAbilities = Object.values(speciesData.abilities)
            .filter(ability => ability) // Filter out empty/undefined abilities
            .map(ability => String(ability)); // Convert to string
            
          setPokemonAbilities(availableAbilities);
          
          // If current ability isn't in the list, set to first available
          if (availableAbilities.length > 0 && !availableAbilities.includes(pokemonState.ability)) {
            setPokemonState({
              ...pokemonState,
              ability: availableAbilities[0]
            });
          }
        } else {
          setPokemonAbilities([]);
        }
      }
    } else {
      setSelectedPokemon(null);
      setPokemonAbilities([]);
    }
  }, [pokemonState.pokemonId, pokemon]);

  const handlePokemonChange = (pokemonId: string): void => {
    const selected = pokemon.find(p => p.id === pokemonId);
    
    // Find the default ability for this Pokémon
    let defaultAbility = "";
    if (selected && selected.abilities && selected.abilities[0]) {
      defaultAbility = selected.abilities[0];
    }
    
    setPokemonState({
      ...pokemonState,
      pokemonId,
      moveIds: ["", "", "", ""], // Reset moves when changing Pokémon
      forme: selected?.name || "",
      ability: defaultAbility,
      // Set default HP to max when changing Pokémon
      currentHp: selected ? calculateStat(
        selected.baseStats.hp,
        pokemonState.evs.hp,
        pokemonState.ivs.hp, 
        pokemonState.level,
        1,
        true
      ) : 0,
      currentHpPercent: 100
    });
  };

  const handleMoveChange = (index: number, moveId: string): void => {
    const newMoveIds = [...pokemonState.moveIds];
    newMoveIds[index] = moveId;
    setPokemonState({
      ...pokemonState,
      moveIds: newMoveIds
    });
  };

  const handleTeraTypeChange = (teraType: string): void => {
    setPokemonState({
      ...pokemonState,
      teraType
    });
  };

  const handleGenderChange = (gender: string): void => {
    setPokemonState({
      ...pokemonState,
      gender
    });
  };

  const handleLevelChange = (level: number): void => {
    // Update current HP when level changes (to maintain percentage)
    if (selectedPokemon) {
      const maxHp = calculateStat(
        selectedPokemon.baseStats.hp,
        pokemonState.evs.hp,
        pokemonState.ivs.hp,
        level,
        1, 
        true
      );
      setPokemonState({
        ...pokemonState,
        level,
        currentHp: Math.round(maxHp * (pokemonState.currentHpPercent / 100))
      });
    } else {
      setPokemonState({
        ...pokemonState,
        level
      });
    }
  };

  const handleNatureChange = (nature: string): void => {
    setPokemonState({
      ...pokemonState,
      nature
    });
  };

  const handleAbilityChange = (ability: string): void => {
    setPokemonState({
      ...pokemonState,
      ability
    });
  };

  const handleItemChange = (item: string): void => {
    setPokemonState({
      ...pokemonState,
      item
    });
  };

  const handleStatusChange = (status: string): void => {
    setPokemonState({
      ...pokemonState,
      status
    });
  };

  const handleHpChange = (hp: number): void => {
    // Calculate max HP
    const maxHp = selectedPokemon ? calculateStat(
      selectedPokemon.baseStats.hp,
      pokemonState.evs.hp,
      pokemonState.ivs.hp,
      pokemonState.level,
      1,
      true
    ) : 100;
    
    // Calculate percentage based on new HP value
    const newPercentage = Math.min(Math.round((hp / maxHp) * 100), 100);
    
    setPokemonState({
      ...pokemonState,
      currentHp: hp,
      currentHpPercent: newPercentage
    });
  };

  const handleHpPercentChange = (percent: number): void => {
    // Calculate max HP
    const maxHp = selectedPokemon ? calculateStat(
      selectedPokemon.baseStats.hp,
      pokemonState.evs.hp,
      pokemonState.ivs.hp,
      pokemonState.level,
      1,
      true
    ) : 100;
    
    // Calculate HP based on new percentage
    const newHp = Math.round((percent / 100) * maxHp);
    
    setPokemonState({
      ...pokemonState,
      currentHp: newHp,
      currentHpPercent: percent
    });
  };

  const handleStatChange = (stat: string, value: number, isEV: boolean): void => {
    if (stat === 'hp' || stat === 'atk' || stat === 'def' || stat === 'spa' || stat === 'spd' || stat === 'spe') {
      setPokemonState({
        ...pokemonState,
        [isEV ? 'evs' : 'ivs']: {
          ...pokemonState[isEV ? 'evs' : 'ivs'],
          [stat]: value
        }
      });
      
      // When changing HP EVs or IVs, update current HP to maintain percentage
      if (stat === 'hp' && selectedPokemon) {
        const maxHp = calculateStat(
          selectedPokemon.baseStats.hp,
          stat === 'hp' && isEV ? value : pokemonState.evs.hp,
          stat === 'hp' && !isEV ? value : pokemonState.ivs.hp,
          pokemonState.level,
          1,
          true
        );
        
        setPokemonState({
          ...pokemonState,
          [isEV ? 'evs' : 'ivs']: {
            ...pokemonState[isEV ? 'evs' : 'ivs'],
            [stat]: value
          },
          currentHp: Math.round(maxHp * (pokemonState.currentHpPercent / 100))
        });
      }
    }
  };
  
  const handleBoostChange = (stat: string, value: number): void => {
    if (stat === 'atk' || stat === 'def' || stat === 'spa' || stat === 'spd' || stat === 'spe') {
      setPokemonState({
        ...pokemonState,
        boosts: {
          ...pokemonState.boosts,
          [stat]: value
        }
      });
    }
  };

  const handleTerastallizedChange = (isTerastallized: boolean): void => {
    setPokemonState({
      ...pokemonState,
      isTerastallized
    });
  };

  // Calculate stat function for HP calculations
  function calculateStat(base: number, ev: number, iv: number, level: number, nature: number, isHP: boolean) {
    if (isHP) {
      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    } else {
      return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
    }
  }

  // Calculate max HP for display in HpControl
  const calculateMaxHp = () => {
    if (!selectedPokemon) return 0;
    
    return calculateStat(
      selectedPokemon.baseStats.hp,
      pokemonState.evs.hp,
      pokemonState.ivs.hp,
      pokemonState.level,
      1,
      true
    );
  };

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