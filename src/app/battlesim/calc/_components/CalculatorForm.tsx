'use client';

import PokemonPanel from "./PokemonPanel";
import FieldSelector from "./FieldSelector";
import DamageResults from "./DamageResults";
import MovesResultsOverview from "./MovesResultsOverview";
import { AlertCircle } from "lucide-react";
import { useCalcContext } from "../_context/CalcContext";

export default function CalculatorForm() {
  const { 
    pokemon,
    moves,
    items,
    abilities,
    attackerState,
    updateAttackerState,
    defenderState,
    updateDefenderState,
    damageResults,
    selectedResultIndex,
    setSelectedResultIndex,
    calculationError,
    getPokemonAbilities
  } = useCalcContext();

  return (
    <div className="flex flex-col gap-6">
      <MovesResultsOverview 
        results={damageResults}
        selectedResultIndex={selectedResultIndex}
        onSelectResult={setSelectedResultIndex}
      />
          
      <DamageResults result={damageResults[selectedResultIndex]} />

      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PokemonPanel 
          title="Pokémon 1"
          pokemon={pokemon}
          moves={moves}
          items={items}
          abilities={abilities}
          pokemonState={attackerState}
          setPokemonState={updateAttackerState}
          getPokemonAbilities={getPokemonAbilities}
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
          getPokemonAbilities={getPokemonAbilities}
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