'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { ModdedDex } from "@pkmn/dex";
import { PokemonData, PokemonState } from "../types";
import { usePokedexData } from "../_hooks/usePokedexData";
import { usePokemonState } from "../_hooks/usePokemonState";
import { useDamageCalculation } from "../_hooks/useDamageCalculation";
import { useFieldState } from "../_hooks/useFieldState";
import { DEFAULT_ATTACKER } from '../_utils/initialState';
import { Field } from '@smogon/calc';

interface CalcContextValue {
  // Dex data
  moddedDex: ModdedDex | null;
  genInstance: any;
  pokemon: PokemonData[];
  moves: any[];
  items: any[];
  abilities: any[];
  
  // Pokemon states
  attackerState: PokemonState;
  updateAttackerState: (state: Partial<PokemonState>) => void;
  defenderState: PokemonState;
  updateDefenderState: (state: Partial<PokemonState>) => void;
  
  // Field state
  fieldState: Field;
  updateFieldState: (state: Partial<Field>) => void;
  
  // Calculation results
  damageResults: any[];
  selectedResultIndex: number;
  setSelectedResultIndex: (index: number) => void;
  calculationError: string;
  
  // Utility functions
  getPokemonAbilities: (pokemonId: string, pokemonList: any[]) => string[];
}

const CalcContext = createContext<CalcContextValue | null>(null);

export function CalcProvider({ 
  children,
  moddedDex,
  genInstance,
  pokemon
}: { 
  children: React.ReactNode,
  moddedDex: ModdedDex | null,
  genInstance: any,
  pokemon: PokemonData[] 
}) {
  // Initialize with empty states first
  const { state: attackerState, updateState: updateAttackerState } = usePokemonState({ role: "attacker" });
  const { state: defenderState, updateState: updateDefenderState } = usePokemonState({ role: "defender" });
  const { state: fieldState, updateState: updateFieldState } = useFieldState();
  const { moves, items, abilities, getPokemonAbilities, isLoaded } = usePokedexData(moddedDex);

  // Set default data after moves and Pokemon are loaded
  useEffect(() => {
    if (isLoaded && moves.length > 0 && pokemon.length > 0) {
      // Set default attacker
      const moveIds = DEFAULT_ATTACKER.moveIds.map(moveName => {
        const move = moves.find(m => m.name === moveName);
        return move ? move.id : "";
      });
      
      updateAttackerState({
        ...DEFAULT_ATTACKER,
        moveIds: moveIds
      });

      updateDefenderState({
        ...DEFAULT_ATTACKER,
        moveIds: moveIds
      });
    }
  }, [isLoaded, moves, pokemon]);

  const { damageResults, selectedResultIndex, setSelectedResultIndex, calculationError } = useDamageCalculation({
    moddedDex,
    genInstance,
    pokemonList: pokemon,
    attackerState,
    defenderState,
    fieldState
  });

  const value = {
    moddedDex,
    genInstance,
    pokemon,
    moves,
    items,
    abilities,
    attackerState,
    updateAttackerState,
    defenderState,
    updateDefenderState,
    fieldState,
    updateFieldState,
    damageResults,
    selectedResultIndex,
    setSelectedResultIndex,
    calculationError,
    getPokemonAbilities
  };

  return <CalcContext.Provider value={value}>{children}</CalcContext.Provider>;
}

export function useCalcContext() {
  const context = useContext(CalcContext);
  if (!context) {
    throw new Error('useCalcContext must be used within a CalcProvider');
  }
  return context;
}