'use client';

import { useState, useEffect } from "react";
import PokemonPanel from "./PokemonPanel";
import FieldSelector from "./FieldSelector";
import DamageResults from "./DamageResults";
import MovesResultsOverview from "./MovesResultsOverview";
import { calculate, Pokemon, Move, Field } from '@smogon/calc';
import { ModdedDex } from "@pkmn/dex";
import { AlertCircle } from "lucide-react";
import { processDamageResult } from "../_utils/damageUtils";
import { GenderName, StatusName, TypeName } from "@smogon/calc/dist/data/interface";

interface CalculatorFormProps {
  moddedDex: ModdedDex | null;
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
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    level: 100,
    teraType: "Water" as TypeName,
    isTerastallized: false,
    forme: "",
    gender: "Male" as GenderName,
    ability: "Snow Warning",
    item: "Heavy-Duty Boots",
    status: "Healthy" as StatusName,
    currentHp: 383,
    currentHpPercent: 100
  });
  
  const [defenderState, setDefenderState] = useState({
    pokemonId: "",
    moveIds: ["", "", "", ""],
    nature: "Bold",
    evs: { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 },
    ivs: { hp: 31, atk: 31, def: 31, spa: 31, spd: 31, spe: 31 },
    boosts: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0 },
    level: 100,
    teraType: "Water" as TypeName,
    isTerastallized: false,
    forme: "",
    gender: "Male" as GenderName,
    ability: "",
    item: "",
    status: "Healthy" as StatusName,
    currentHp: 383,
    currentHpPercent: 100
  });
  
  const [moves, setMoves] = useState<Array<{ id: string; name: string; type: string; basePower: number; category: string }>>([]);
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [abilities, setAbilities] = useState<Array<{ id: string; name: string }>>([]);
  const [damageResults, setDamageResults] = useState<ReturnType<typeof processDamageResult>[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState(0);
  const [calculationError, setCalculationError] = useState("");
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (moddedDex) {
      // Load moves
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
      
      // Load items
      const itemsList = Object.values(moddedDex.items.all())
        .filter(item => item.name && !item.isNonstandard)
        .map(item => ({
          id: item.id,
          name: item.name
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setItems(itemsList);
      
      // Load abilities
      const abilitiesList = Object.values(moddedDex.abilities.all())
        .filter(ability => ability.name && !ability.isNonstandard)
        .map(ability => ({
          id: ability.id,
          name: ability.name
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setAbilities(abilitiesList);
    }
  }, [moddedDex]);
  

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
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [
    JSON.stringify(attackerState),
    JSON.stringify(defenderState),
    isCalculating,
    moddedDex,
    genInstance,
    pokemon,
    selectedResultIndex
  ]);

  const updateAttackerState = (newState: Partial<typeof attackerState>) => {
    setAttackerState(prevState => ({
      ...prevState,
      ...newState,
      evs: { ...prevState.evs, ...newState.evs },
      ivs: { ...prevState.ivs, ...newState.ivs },
      boosts: { ...prevState.boosts, ...newState.boosts }
    }));
  };

  const updateDefenderState = (newState: Partial<typeof defenderState>) => {
    setDefenderState(prevState => ({
      ...prevState,
      ...newState,
      evs: { ...prevState.evs, ...newState.evs },
      ivs: { ...prevState.ivs, ...newState.ivs },
      boosts: { ...prevState.boosts, ...newState.boosts }
    }));
  };

  return (
    <div className="flex flex-col gap-6">
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PokemonPanel 
          title="Pokémon 1"
          pokemon={pokemon}
          moves={moves}
          items={items}
          abilities={abilities}
          pokemonState={attackerState}
          setPokemonState={updateAttackerState}
          side="attacker"
        />
        
        <FieldSelector />
        
        <PokemonPanel 
          title="Pokémon 2"
          pokemon={pokemon}
          moves={moves}
          items={items}
          abilities={abilities}
          pokemonState={defenderState}
          setPokemonState={updateDefenderState}
          side="defender"
        />
      </div>
      
      {calculationError && (
        <div className="p-4 border rounded-lg bg-red-900/30 border-red-800 text-red-300 mt-4 flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {calculationError}
        </div>
      )}
    </div>
  );
}