'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { GenerationId } from '../../calc/_utils/generations';
import { useDexData } from '../_hooks/useDexData';
import { useFilteredPokemon } from '../_hooks/useFilteredPokemon';

interface DexContextValue {
  // Generation selection
  currentGeneration: GenerationId;
  setGeneration: (genId: GenerationId) => void;
  isLoading: boolean;
  
  // Dex data
  pokemon: any[];
  moves: any[];
  items: any[];
  abilities: any[];
  
  // Search and filters
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilters: {
    types: string[];
    moves: string[];
    abilities: string[];
    eggGroups: string[];
    tiers: string[];
  };
  addFilter: (filterType: keyof DexContextValue['activeFilters'], value: string) => void;
  removeFilter: (filterType: keyof DexContextValue['activeFilters'], value: string) => void;
  clearFilters: () => void;
  
  // Results
  filteredPokemon: any[];
  filteredMoves: any[];
  filteredAbilities: any[];
  filteredItems: any[];
  
  // Detail view
  selectedPokemon: string | null;
  setSelectedPokemon: (pokemonId: string | null) => void;
  currentSearchCategory: 'search' | 'pokemon' | 'moves' | 'abilities' | 'items';
  setCurrentSearchCategory: (category: 'search' | 'pokemon' | 'moves' | 'abilities' | 'items') => void;
  
  
  // Keyboard navigation
  handleKeyDown: (e: KeyboardEvent) => void;
}

const DexContext = createContext<DexContextValue | null>(null);

export function DexProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const [currentGeneration, setCurrentGeneration] = useState<GenerationId>('sv');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<DexContextValue['activeFilters']>({
    types: [],
    moves: [],
    abilities: [],
    eggGroups: [],
    tiers: []
  });
  const [selectedPokemon, setSelectedPokemon] = useState<string | null>(null);
  const [currentSearchCategory, setCurrentSearchCategory] = useState<'search' | 'pokemon' | 'moves' | 'abilities' | 'items'>('pokemon');
  
  // Get data from custom hook
  const { pokemon, moves, abilities, items, isLoaded } = useDexData(currentGeneration);
  
  // Use filtered data hook
  const { 
    filteredPokemon, 
    filteredMoves, 
    filteredAbilities, 
    filteredItems 
  } = useFilteredPokemon({
    pokemon,
    moves,
    abilities,
    items,
    searchQuery,
    activeFilters,
    currentSearchCategory: currentSearchCategory === 'search' ? 'pokemon' : currentSearchCategory
  });
  
  // Set generation
  const setGeneration = (genId: GenerationId) => {
    setCurrentGeneration(genId);
  };
  
  // Filter management
  const addFilter = useCallback((filterType: keyof DexContextValue['activeFilters'], value: string) => {
    if (!value) return;
    
    setActiveFilters(prev => {
      // Don't add duplicates
      if (prev[filterType].includes(value)) {
        return prev;
      }
      
      return {
        ...prev,
        [filterType]: [...prev[filterType], value]
      };
    });
    // Clear search after adding a filter
    setSearchQuery('');
  }, []);
  
  const removeFilter = useCallback((filterType: keyof DexContextValue['activeFilters'], value: string) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].filter(item => item !== value)
    }));
  }, []);
  
  const clearFilters = useCallback(() => {
    setActiveFilters({
      types: [],
      moves: [],
      abilities: [],
      eggGroups: [],
      tiers: []
    });
  }, []);
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Handle backspace to remove last filter
    if (e.key === 'Backspace' && !searchQuery) {
      // Find the last filter type that has elements
      const filterTypes = Object.keys(activeFilters) as Array<keyof typeof activeFilters>;
      const lastFilterWithValues = [...filterTypes].reverse().find(type => activeFilters[type].length > 0);
      
      if (lastFilterWithValues) {
        const lastValue = activeFilters[lastFilterWithValues][activeFilters[lastFilterWithValues].length - 1];
        removeFilter(lastFilterWithValues, lastValue);
      }
    }
    
    // Add more keyboard shortcuts if needed
  }, [activeFilters, searchQuery, removeFilter]);
  
  // Handle URL params for sharing
  useEffect(() => {
    const type = searchParams.get('type');
    const move = searchParams.get('move');
    const ability = searchParams.get('ability');
    const pokemonId = searchParams.get('pokemon');
    
    if (type) addFilter('types', type);
    if (move) addFilter('moves', move);
    if (ability) addFilter('abilities', ability);
    if (pokemonId) setSelectedPokemon(pokemonId);
    
  }, [searchParams, addFilter]);
  
  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  const contextValue: DexContextValue = {
    currentGeneration,
    setGeneration,
    isLoading: !isLoaded,
    pokemon,
    moves,
    items,
    abilities,
    searchQuery,
    setSearchQuery,
    activeFilters,
    addFilter,
    removeFilter,
    clearFilters,
    filteredPokemon,
    filteredMoves,
    filteredAbilities,
    filteredItems,
    selectedPokemon,
    setSelectedPokemon,
    currentSearchCategory,
    setCurrentSearchCategory,
    handleKeyDown
  };
  
  return (
    <DexContext.Provider value={contextValue}>
      {children}
    </DexContext.Provider>
  );
}

export function useDexContext() {
  const context = useContext(DexContext);
  if (!context) {
    throw new Error('useDexContext must be used within a DexProvider');
  }
  return context;
}