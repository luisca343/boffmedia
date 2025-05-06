'use client';

import { useState, useEffect } from "react";
import PokemonPanel from "./PokemonPanel";
import FieldSelector from "./FieldSelector";
import DamageResults from "./DamageResults";
import MovesResultsOverview from "./MovesResultsOverview";
import { calculate, Pokemon, Move, Field } from '@smogon/calc';
import { ModdedDex } from "@pkmn/dex";

interface CalculatorFormProps {
  moddedDex: ModdedDex;
  genInstance: any;
  pokemon: any[];
}

export default function CalculatorForm({ moddedDex, genInstance, pokemon }: CalculatorFormProps) {
  const [attackerState, setAttackerState] = useState({
    pokemonId: "",
    moveIds: ["", "", "", ""],
    nature: "Modest",
    evs: { hp: 252, atk: 0, def: 0, spa: 252, spd: 0, spe: 4 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: 100
  });
  
  const [defenderState, setDefenderState] = useState({
    pokemonId: "",
    moveIds: ["", "", "", ""],
    nature: "Bold",
    evs: { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    level: 100
  });
  
  const [moves, setMoves] = useState([]);
  const [damageResults, setDamageResults] = useState([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [calculationError, setCalculationError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  // Load moves when dex is available
  useEffect(() => {
    if (moddedDex) {
      const movesList = Object.values(moddedDex.moves.all())
        .filter(move => move.name && move.basePower > 0)
        .map(move => ({
          id: move.id,
          name: move.name,
          type: move.type,
          basePower: move.basePower,
          category: move.category
        }));
      setMoves(movesList);
    }
  }, [moddedDex]);

  // Define calculateDamage as a regular function rather than using useCallback
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
      const attackerData = pokemon.find(p => p.id === attackerState.pokemonId);
      const defenderData = pokemon.find(p => p.id === defenderState.pokemonId);
      
      if (!attackerData || !defenderData) {
        setCalculationError("Missing Pokémon data for calculation");
        setIsCalculating(false);
        return;
      }
      
      // Create the Pokémon objects
      const attackerPokemon = new Pokemon(genInstance, attackerData.name, {
        level: attackerState.level,
        nature: attackerState.nature,
        evs: attackerState.evs,
        ivs: attackerState.ivs
      });
      
      const defenderPokemon = new Pokemon(genInstance, defenderData.name, {
        level: defenderState.level,
        nature: defenderState.nature,
        evs: defenderState.evs,
        ivs: defenderState.ivs
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
              results.push({
                ...result,
                direction: 'attacker-to-defender'
              });
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
              results.push({
                ...result,
                direction: 'defender-to-attacker'
              });
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
      
      // Keep the selected index if it's still valid, otherwise reset to 0
      if (selectedResultIndex >= results.length) {
        setSelectedResultIndex(0);
      }
    } catch (error) {
      console.error("Calculation error:", error);
      setCalculationError(`Error: ${error.message || "Failed to calculate damage"}`);
      setDamageResults([]);
    } finally {
      setIsCalculating(false);
    }
  };

  // Trigger calculation whenever relevant state changes
  useEffect(() => {
    // Only calculate if both Pokémon are selected
    if (attackerState.pokemonId && defenderState.pokemonId && !isCalculating) {
      // Small delay to avoid excessive calculations during rapid changes
      const timer = setTimeout(() => {
        calculateDamage();
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [
    // Use JSON.stringify to track all changes in the complex objects
    JSON.stringify(attackerState),
    JSON.stringify(defenderState),
    // Other dependencies
    isCalculating,
    moddedDex,
    genInstance,
    pokemon,
    selectedResultIndex
  ]);

  // Wrapper functions for state updates to maintain type safety
  const updateAttackerState = (newState) => {
    setAttackerState(prevState => ({...prevState, ...newState}));
  };
  
  const updateDefenderState = (newState) => {
    setDefenderState(prevState => ({...prevState, ...newState}));
  };

  return (
    <div className="flex flex-col gap-4">
      {damageResults.length > 0 && (
        <>
          <MovesResultsOverview 
            results={damageResults}
            selectedResultIndex={selectedResultIndex}
            onSelectResult={setSelectedResultIndex}
          />
          
          <DamageResults result={damageResults[selectedResultIndex]} />
        </>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PokemonPanel 
          title="Pokémon 1"
          pokemon={pokemon}
          moves={moves}
          pokemonState={attackerState}
          setPokemonState={updateAttackerState}
          side="attacker"
        />
        
        <FieldSelector />
        
        <PokemonPanel 
          title="Pokémon 2"
          pokemon={pokemon}
          moves={moves}
          pokemonState={defenderState}
          setPokemonState={updateDefenderState}
          side="defender"
        />
      </div>
      
      {calculationError && (
        <div className="p-4 border rounded bg-red-50 text-red-700 mt-4">
          {calculationError}
        </div>
      )}
    </div>
  );
}