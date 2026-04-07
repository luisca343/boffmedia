'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ModdedDex } from "@pkmn/dex";
import { PokemonData, PokemonState } from "../types";
import { usePokedexData } from "../_hooks/usePokedexData";
import { usePokemonState } from "../_hooks/usePokemonState";
import { useDamageCalculation } from "../_hooks/useDamageCalculation";
import { useFieldState } from "../_hooks/useFieldState";
import { DEFAULT_ATTACKER, getDefaultAttacker } from '../_utils/initialState';
import { Field } from '@smogon/calc';
import { GENERATIONS, GenerationId, getDexAndGen } from '../_utils/generations';

interface CalcContextValue {
  // Generation selection
  currentGeneration: GenerationId;
  setGeneration: (genId: GenerationId) => void;
  isLoading: boolean;
  
  // Dex data
  dex: any;
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

export function CalcProvider({ children }: { children: React.ReactNode }) {
  // Generation state
  const [currentGeneration, setCurrentGeneration] = useState<GenerationId>('sv');
  const [dex, setDex] = useState<any>(null);
  const [genInstance, setGenInstance] = useState<any>(null);
  const [pokemon, setPokemon] = useState<PokemonData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dex and generation data when generation changes
  useEffect(() => {
    async function loadGeneration() {
      setIsLoading(true);
      
      try {
        const { dex: newDex, genInstance: newGenInstance } = await getDexAndGen(currentGeneration);
        
        setDex(newDex);
        setGenInstance(newGenInstance);
        
        const pokemonList = Object.values(newDex.species.all())
          .filter((species: any) => {
            return species.num > 0 && !species.isNonstandard;
          })
          .map((species: any) => ({
            id: species.id,
            name: species.name,
            num: species.num,
            types: species.types || [],
            baseStats: species.baseStats || {},
            abilities: species.abilities || {},
          }))
          .sort((a: any, b: any) => a.num - b.num);
        
        setPokemon(pokemonList);
      } catch (error) {
        console.error("Error loading generation data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadGeneration();
  }, [currentGeneration]);

  // Change generation handler
  const setGeneration = (genId: GenerationId) => {
    setCurrentGeneration(genId);
  };

  // Initialize with empty states first
  const { state: attackerState, updateState: updateAttackerState } = usePokemonState({ role: "attacker" });
  const { state: defenderState, updateState: updateDefenderState } = usePokemonState({ role: "defender" });
  const { state: fieldState, updateState: updateFieldState } = useFieldState();
  const { moves, items, abilities, getPokemonAbilities, isLoaded } = usePokedexData(dex);

  // Set default data after moves and Pokemon are loaded
  useEffect(() => {
    if (isLoaded && moves.length > 0 && pokemon.length > 0) {
      // Get default attacker configuration for current generation
      const defaultAttacker = getDefaultAttacker(currentGeneration);
      
      // Map move names to move IDs if possible (fallback to empty strings)
      const attackerMoveIds = defaultAttacker.moveIds.map(moveName => {
        const move = moves.find(m => m.name === moveName);
        return move ? move.id : "";
      }).filter(Boolean);
      
      // Fill remaining move slots with empty strings
      while (attackerMoveIds.length < 4) {
        attackerMoveIds.push("");
      }
      
      // Apply different defaults for attacker and defender
      updateAttackerState({
        ...defaultAttacker,
        moveIds: attackerMoveIds
      });
      
      // For defender, use similar config but with defensive EVs
      const defenderEvs = currentGeneration === 'rb' || currentGeneration === 'gs' 
        ? defaultAttacker.evs // Keep same EVs for early gens
        : { hp: 252, atk: 0, def: 252, spa: 0, spd: 4, spe: 0 }; // Defensive spread for modern gens
        
      updateDefenderState({
        ...defaultAttacker,
        moveIds: attackerMoveIds,
        evs: defenderEvs,
        nature: currentGeneration === 'rb' || currentGeneration === 'gs' ? "" : "Bold", // No natures in early gens
      });
    }
  }, [isLoaded, moves, pokemon, currentGeneration]);

  const { damageResults, selectedResultIndex, setSelectedResultIndex, calculationError } = useDamageCalculation({
    moddedDex: dex,
    genInstance,
    pokemonList: pokemon,
    attackerState,
    defenderState,
    fieldState
  });

  const value = {
    currentGeneration,
    setGeneration,
    isLoading,
    dex,
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