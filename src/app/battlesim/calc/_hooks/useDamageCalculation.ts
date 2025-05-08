import { useState, useEffect, useRef } from "react";
import { calculate, Pokemon, Move, Field, Side } from '@smogon/calc';
import { ModdedDex } from "@pkmn/dex";
import { processDamageResult } from "../_utils/damageUtils";
import { PokemonState } from "./usePokemonState";

interface UseDamageCalculationProps {
  moddedDex: ModdedDex | null;
  genInstance: any;
  pokemonList: any[];
  attackerState: PokemonState;
  defenderState: PokemonState;
  fieldState: Field;
  debounceMs?: number;
}

export function useDamageCalculation({
  moddedDex,
  genInstance,
  pokemonList,
  attackerState,
  defenderState,
  fieldState,
  debounceMs = 50
}: UseDamageCalculationProps) {
  const [damageResults, setDamageResults] = useState<ReturnType<typeof processDamageResult>[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [calculationError, setCalculationError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Track previous Pokémon IDs to detect which one changed
  const prevAttackerIdRef = useRef(attackerState.pokemonId);
  const prevDefenderIdRef = useRef(defenderState.pokemonId);

  // Selectively clear results when a Pokémon changes
  useEffect(() => {
    // Check if attacker changed
    if (attackerState.pokemonId !== prevAttackerIdRef.current) {
      // Only remove results from this attacker
      setDamageResults(prev => prev.filter(result => result.direction !== 'attacker-to-defender'));
      prevAttackerIdRef.current = attackerState.pokemonId;
    }
    
    // Check if defender changed
    if (defenderState.pokemonId !== prevDefenderIdRef.current) {
      // Only remove results from this attacker
      setDamageResults(prev => prev.filter(result => result.direction !== 'defender-to-attacker'));
      prevDefenderIdRef.current = defenderState.pokemonId;
    }
    
    // Reset selected index if we cleared results
    if (damageResults.length === 0) {
      setSelectedResultIndex(0);
    }
  }, [attackerState.pokemonId, defenderState.pokemonId]);

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
      
      // Create field with settings from fieldState
      const field = new Field({
        gameType: fieldState.gameType,
        terrain: fieldState.terrain || undefined,
        weather: fieldState.weather || undefined,
        isGravity: fieldState.isGravity,
        // Add other field conditions as needed
      });
      
      // Keep track of new results from this calculation
      let newResults: ReturnType<typeof processDamageResult>[] = [];
      
      // Calculate attacker's moves against defender
      if (attackerHasMoves) {
        for (const moveId of attackerState.moveIds) {
          if (moveId) {
            const moveData = moddedDex.moves.get(moveId);
            if (moveData) {
              const move = new Move(genInstance, moveData.name);

              const fieldForCalc = new Field({
                ...field,
                attackerSide: new Side({ ...field.attackerSide }),
                defenderSide: new Side({ ...field.defenderSide })
              });

              try {
                const result = calculate(
                  genInstance,
                  attackerPokemon,
                  defenderPokemon,
                  move,
                  fieldForCalc
                );
                
                const processedResult = processDamageResult(result, 'attacker-to-defender');
                newResults.push(processedResult);
              } catch (error) {
                console.error(`Error calculating with move ${moveData.name}:`, error);
              }
            }
          }
        }
      }
      
      // Calculate defender's moves against attacker
      if (defenderHasMoves) {
        for (const moveId of defenderState.moveIds) {
          if (moveId) {
            const moveData = moddedDex.moves.get(moveId);
            if (moveData) {
              const move = new Move(genInstance, moveData.name);

              const fieldForCalc = new Field({
                ...field,
                attackerSide: new Side({ ...field.defenderSide }),
                defenderSide: new Side({ ...field.attackerSide })
              });
              
              try {
                const result = calculate(
                  genInstance,
                  defenderPokemon,
                  attackerPokemon,
                  move,
                  fieldForCalc
                );
                
                const processedResult = processDamageResult(result, 'defender-to-attacker');
                newResults.push(processedResult);
              } catch (error) {
                console.error(`Error calculating with move ${moveData.name}:`, error);
              }
            }
          }
        }
      }
      
      if (newResults.length === 0) {
        setCalculationError("No valid moves found for calculation");
      } else {
        // Merge new results with existing ones, replacing any with the same direction
        setDamageResults(prev => {
          // Filter out results that match the directions we're recalculating
          const directionsToUpdate = Array.from(new Set(newResults.map(r => r.direction)));
          const filteredPrev = prev.filter(r => !directionsToUpdate.includes(r.direction));
          
          // Combine with new results
          return [...filteredPrev, ...newResults];
        });
      }
    } catch (error) {
      console.error("Calculation error:", error);
      setCalculationError(`Error: ${error instanceof Error ? error.message : "Failed to calculate damage"}`);
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
    JSON.stringify(fieldState),
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