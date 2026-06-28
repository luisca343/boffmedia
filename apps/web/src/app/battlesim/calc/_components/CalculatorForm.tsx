'use client';

import PokemonPanel from "./PokemonPanel";
import FieldSelector from "./FieldSelector";
import DamageResults from "./DamageResults";
import MovesResultsOverview from "./MovesResultsOverview";
import { AlertCircle } from "lucide-react";
import { useCalcContext } from "../_context/CalcContext";

export default function CalculatorForm() {
  const { 
    damageResults,
    selectedResultIndex,
    setSelectedResultIndex,
    calculationError,
    isLoading
  } = useCalcContext();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full absolute border-4 border-solid border-edge opacity-20"></div>
          <div className="w-12 h-12 rounded-full animate-spin absolute border-4 border-solid border-primary border-t-transparent"></div>
        </div>
        <p className="ml-4 text-ink">Loading calculator data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[80%] mx-auto">
      <MovesResultsOverview 
        results={damageResults}
        selectedResultIndex={selectedResultIndex}
        onSelectResult={setSelectedResultIndex}
      />
          
      <DamageResults result={damageResults[selectedResultIndex]} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PokemonPanel 
          title="Pokémon 1"
          side="attacker"
        />
        
        <FieldSelector />
        
        <PokemonPanel 
          title="Pokémon 2"
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