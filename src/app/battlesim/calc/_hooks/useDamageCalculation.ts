import { useState, useEffect } from "react";
import { calculate, Pokemon, Move, Field } from '@smogon/calc';
import { ModdedDex } from "@pkmn/dex";
import { processDamageResult } from "../_utils/damageUtils";
import { PokemonState } from "./usePokemonState";

interface UseDamageCalculationProps {
  moddedDex: ModdedDex | null;
  genInstance: any;
  pokemonList: any[];
  attackerState: PokemonState;
  defenderState: PokemonState;
  debounceMs?: number;
}

export function useDamageCalculation({
  moddedDex,
  genInstance,
  pokemonList,
  attackerState,
  defenderState,
  debounceMs = 300
}: UseDamageCalculationProps) {
  const [damageResults, setDamageResults] = useState<ReturnType<typeof processDamageResult>[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [calculationError, setCalculationError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  const calculateDamage = () => {
    if (!attackerState.pokemonId || !defenderState.pokemonId || !moddedDex || !genInstance) {
      setCalculationError("Please select both Pokémon");
      return;
    }

    // Check if at least one move is selected
    const attackerHasMoves = attackerState.moveIds.some(id => id);
    const defenderHasMoves = defenderState.moveIds.some(id => id);

    if (!attackerHasMoves && !defenderHasMoves) {
      setCalculationError("Please select at least one move for either Pokémon");
      return;
    }

    setCalculationError("");
    setIsCalculating(true);
    
    try {
      // Get the data from our custom dex
      const attackerData = pokemonList.find(p => p.id === attackerState.pokemonId);
      const defenderData = pokemonList.find(p => p.id === defenderState.pokemonId);
      
      if (!attackerData || !defenderData) {
        setCalculationError("Missing Pokémon data for calculation");
        setIsCalculating(false);
        return;
      }
      
      // Create the Pokémon objects with the new fields
      const attackerPokemon = new Pokemon(moddedDex as any, attackerData.name, {
        level: attackerState.level,
        nature: attackerState.nature,
        evs: attackerState.evs,
        ivs: attackerState.ivs,
        boosts: attackerState.boosts,
        ability: attackerState.ability,
        item: attackerState.item,
        status: attackerState.status,
        teraType: attackerState.isTerastallized ? attackerState.teraType : undefined,
        gender: attackerState.gender,
        curHP: attackerState.currentHp,
        isDynamaxed: false
      });
      
      const defenderPokemon = new Pokemon(moddedDex as any, defenderData.name, {
        level: defenderState.level,
        nature: defenderState.nature,
        evs: defenderState.evs,
        ivs: defenderState.ivs,
        boosts: defenderState.boosts,
        ability: defenderState.ability,
        item: defenderState.item,
        status: defenderState.status,
        teraType: defenderState.isTerastallized ? defenderState.teraType : undefined,
        gender: defenderState.gender,
        curHP: defenderState.currentHp,
        isDynamaxed: false
      });
      
      // Calculate results for all selected moves
      const results = [];
      
      // Calculate attacker's moves against defender
      for (const moveId of attackerState.moveIds) {
        if (moveId) {
          const moveData = moddedDex.moves.get(moveId);
          if (moveData) {
            const move = new Move(genInstance, moveData.name);
            const field = new Field();
            
            try {
              const result = calculate(
                genInstance,
                attackerPokemon,
                defenderPokemon,
                move,
                field
              );
              
              const processedResult = processDamageResult(result, 'attacker-to-defender');
              results.push(processedResult);
            } catch (error) {
              console.error(`Error calculating with move ${moveData.name}:`, error);
            }
          }
        }
      }
      
      // Calculate defender's moves against attacker
      for (const moveId of defenderState.moveIds) {
        if (moveId) {
          const moveData = moddedDex.moves.get(moveId);
          if (moveData) {
            const move = new Move(genInstance, moveData.name);
            const field = new Field();
            
            try {
              const result = calculate(
                genInstance,
                defenderPokemon,
                attackerPokemon,
                move,
                field
              );
              
              const processedResult = processDamageResult(result, 'defender-to-attacker');
              results.push(processedResult);
            } catch (error) {
              console.error(`Error calculating with move ${moveData.name}:`, error);
            }
          }
        }
      }
      
      if (results.length === 0) {
        setCalculationError("No valid moves found for calculation");
        setIsCalculating(false);
        return;
      }
      
      setDamageResults(results);
      
      if (selectedResultIndex >= results.length) {
        setSelectedResultIndex(0);
      }
    } catch (error) {
      console.error("Calculation error:", error);
      setCalculationError(`Error: ${error instanceof Error ? error.message : "Failed to calculate damage"}`);
      setDamageResults([]);
    } finally {
      setIsCalculating(false);
    }
  };

  // Trigger calculation whenever relevant state changes
  useEffect(() => {
    if (attackerState.pokemonId && defenderState.pokemonId && !isCalculating) {
      const timer = setTimeout(() => {
        calculateDamage();
      }, debounceMs);
      
      return () => clearTimeout(timer);
    }
  }, [
    JSON.stringify(attackerState),
    JSON.stringify(defenderState),
    moddedDex,
    genInstance,
    pokemonList,
  ]);

  return {
    damageResults,
    selectedResultIndex,
    setSelectedResultIndex,
    calculationError,
    isCalculating,
    calculateDamage
  };
}