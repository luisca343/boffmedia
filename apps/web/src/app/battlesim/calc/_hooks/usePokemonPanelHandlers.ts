import { useState, useEffect, useRef } from 'react';
import { PokemonState } from './usePokemonState';

interface UsePokemonPanelHandlersProps {
  pokemon: any[];
  pokemonState: PokemonState;
  setPokemonState: (state: Partial<PokemonState>) => void;
  getPokemonAbilities: (pokemonId: string, pokemonList: any[]) => string[];
}

export function usePokemonPanelHandlers({
  pokemon,
  pokemonState,
  setPokemonState,
  getPokemonAbilities
}: UsePokemonPanelHandlersProps) {
  const [selectedPokemon, setSelectedPokemon] = useState<any>(null);
  const [pokemonAbilities, setPokemonAbilities] = useState<string[]>([]);
  const initialAbilitySetRef = useRef<{[key: string]: boolean}>({});
  const prevPokemonIdRef = useRef<string>(pokemonState.pokemonId);
  
  useEffect(() => {
    // Only run this effect when the pokemonId actually changes
    if (pokemonState.pokemonId !== prevPokemonIdRef.current) {
      prevPokemonIdRef.current = pokemonState.pokemonId;
      
      if (pokemonState.pokemonId) {
        const selected = pokemon.find(p => p.id === pokemonState.pokemonId);
        setSelectedPokemon(selected || null);
        
        // Set the available abilities for this Pokémon
        if (selected) {
          const availableAbilities = getPokemonAbilities(pokemonState.pokemonId, pokemon);
          setPokemonAbilities(availableAbilities);
          
          // Only set default ability once per Pokemon selection to avoid infinite loops
          if (availableAbilities.length > 0 && !initialAbilitySetRef.current[pokemonState.pokemonId]) {
            // If current ability isn't in the list, set to first available
            if (!availableAbilities.includes(pokemonState.ability)) {
              setPokemonState({
                ability: availableAbilities[0]
              });
            }
            initialAbilitySetRef.current[pokemonState.pokemonId] = true;
          }
        }
      } else {
        setSelectedPokemon(null);
        setPokemonAbilities([]);
      }
    }
  }, [pokemonState.pokemonId, pokemon]);
  // Remove getPokemonAbilities and setPokemonState from dependencies

  // Rest of the code remains the same
  
  // Stat calculation utility
  const calculateStat = (base: number, ev: number, iv: number, level: number, nature: number, isHP: boolean) => {
    if (isHP) {
      return Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
    } else {
      return Math.floor((Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5) * nature);
    }
  };

  // Max HP calculation (for current pokemon)
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

  // All handlers below
  const handlePokemonChange = (pokemonId: string) => {
    // Reset the ability initialization tracking when Pokemon changes
    if (pokemonId !== pokemonState.pokemonId) {
      initialAbilitySetRef.current = {};
    }
    
    const selected = pokemon.find(p => p.id === pokemonId);
    
    // Find the default ability for this Pokémon
    let defaultAbility = "";
    if (selected && selected.abilities && selected.abilities[0]) {
      defaultAbility = selected.abilities[0];
    }
    
    setPokemonState({
      pokemonId,
      moveIds: ["", "", "", ""], // Reset moves when changing Pokémon
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

  // Keep all handlers the same
  const handleMoveChange = (index: number, moveId: string) => {
    const newMoveIds = [...pokemonState.moveIds];
    newMoveIds[index] = moveId;
    setPokemonState({
      moveIds: newMoveIds
    });
  };

  const handleTeraTypeChange = (teraType: string) => {
    setPokemonState({
      teraType: teraType as any
    });
  };

  const handleGenderChange = (gender: string) => {
    setPokemonState({
      gender: gender as any
    });
  };

  const handleLevelChange = (level: number) => {
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
        level,
        currentHp: Math.round(maxHp * (pokemonState.currentHpPercent / 100))
      });
    } else {
      setPokemonState({
        level
      });
    }
  };

  const handleNatureChange = (nature: string) => {
    setPokemonState({
      nature
    });
  };

  const handleAbilityChange = (ability: string) => {
    setPokemonState({
      ability
    });
  };

  const handleItemChange = (item: string) => {
    setPokemonState({
      item
    });
  };

  const handleStatusChange = (status: string) => {
    setPokemonState({
      status: status as any
    });
  };

  const handleHpChange = (hp: number) => {
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
      currentHp: hp,
      currentHpPercent: newPercentage
    });
  };

  const handleHpPercentChange = (percent: number) => {
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
      currentHp: newHp,
      currentHpPercent: percent
    });
  };

  const handleStatChange = (stat: string, value: number, isEV: boolean) => {
    if (stat === 'hp' || stat === 'atk' || stat === 'def' || stat === 'spa' || stat === 'spd' || stat === 'spe') {
      const statKey = stat as keyof typeof pokemonState.evs;
      
      setPokemonState({
        [isEV ? 'evs' : 'ivs']: {
          ...pokemonState[isEV ? 'evs' : 'ivs'],
          [statKey]: value
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
          currentHp: Math.round(maxHp * (pokemonState.currentHpPercent / 100))
        });
      }
    }
  };
  
  const handleBoostChange = (stat: string, value: number) => {
    if (stat === 'atk' || stat === 'def' || stat === 'spa' || stat === 'spd' || stat === 'spe') {
      const statKey = stat as keyof typeof pokemonState.boosts;
      
      setPokemonState({
        boosts: {
          ...pokemonState.boosts,
          [statKey]: value
        }
      });
    }
  };

  const handleTerastallizedChange = (isTerastallized: boolean) => {
    setPokemonState({
      isTerastallized
    });
  };

  return {
    selectedPokemon,
    pokemonAbilities,
    calculateMaxHp,
    handlers: {
      handlePokemonChange,
      handleMoveChange,
      handleTeraTypeChange,
      handleGenderChange,
      handleLevelChange,
      handleNatureChange,
      handleAbilityChange,
      handleItemChange,
      handleStatusChange,
      handleHpChange,
      handleHpPercentChange,
      handleStatChange,
      handleBoostChange,
      handleTerastallizedChange
    }
  };
}