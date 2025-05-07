'use client';

import React, { createContext, useContext } from 'react';
import { ModdedDex, TypeName } from "@pkmn/dex";
import { PokemonData, PokemonState } from "../types";
import { usePokedexData } from "../_hooks/usePokedexData";
import { usePokemonState } from "../_hooks/usePokemonState";
import { useDamageCalculation } from "../_hooks/useDamageCalculation";
import { GenderName, StatusName } from '@smogon/calc/dist/data/interface';
import { DEFAULT_ATTACKER } from '../_utils/initialState';

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
  const { state: attackerState, updateState: updateAttackerState } = usePokemonState({ role: "attacker", initialState: DEFAULT_ATTACKER });
  const { state: defenderState, updateState: updateDefenderState } = usePokemonState({ role: "defender",initialState: DEFAULT_ATTACKER });
  const { moves, items, abilities, getPokemonAbilities } = usePokedexData(moddedDex);
  const { damageResults, selectedResultIndex, setSelectedResultIndex, calculationError } = useDamageCalculation({
    moddedDex,
    genInstance,
    pokemonList: pokemon,
    attackerState,
    defenderState
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