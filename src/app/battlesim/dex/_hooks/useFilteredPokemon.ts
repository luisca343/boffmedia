'use client';

import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';

interface UseFilteredPokemonProps {
  pokemon: any[];
  moves: any[];
  abilities: any[];
  items: any[];
  searchQuery: string;
  activeFilters: {
    types: string[];
    moves: string[];
    abilities: string[];
    eggGroups: string[];
    tiers: string[];
  };
  currentSearchCategory: 'pokemon' | 'moves' | 'abilities' | 'items';
}

export function useFilteredPokemon({
  pokemon,
  moves,
  abilities,
  items,
  searchQuery,
  activeFilters,
  currentSearchCategory
}: UseFilteredPokemonProps) {
  const [filteredPokemon, setFilteredPokemon] = useState<any[]>([]);
  const [filteredMoves, setFilteredMoves] = useState<any[]>([]);
  const [filteredAbilities, setFilteredAbilities] = useState<any[]>([]);
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  
  // Set up fuse instances for fuzzy searching
  const [pokemonFuse, setPokemonFuse] = useState<Fuse<any> | null>(null);
  const [movesFuse, setMovesFuse] = useState<Fuse<any> | null>(null);
  const [abilitiesFuse, setAbilitiesFuse] = useState<Fuse<any> | null>(null);
  const [itemsFuse, setItemsFuse] = useState<Fuse<any> | null>(null);
  
  // Initialize Fuse instances when data changes
  useEffect(() => {
    if (pokemon.length > 0) {
      setPokemonFuse(
        new Fuse(pokemon, {
          keys: ['name', 'id', 'types', 'abilities', 'eggGroups'],
          threshold: 0.3,
          ignoreLocation: true
        })
      );
    }
    
    if (moves.length > 0) {
      setMovesFuse(
        new Fuse(moves, {
          keys: ['name', 'type', 'category', 'desc'],
          threshold: 0.3,
          ignoreLocation: true
        })
      );
    }
    
    if (abilities.length > 0) {
      setAbilitiesFuse(
        new Fuse(abilities, {
          keys: ['name', 'desc'],
          threshold: 0.3,
          ignoreLocation: true
        })
      );
    }
    
    if (items.length > 0) {
      setItemsFuse(
        new Fuse(items, {
          keys: ['name', 'desc'],
          threshold: 0.3,
          ignoreLocation: true
        })
      );
    }
  }, [pokemon, moves, abilities, items]);
  
  // Filter Pokémon based on search query and active filters
  useEffect(() => {
    // Helper function to check type matches
    const matchesTypes = (types: string[]) => {
      if (activeFilters.types.length === 0) return true;
      return activeFilters.types.every(type => 
        types.some(t => t.toLowerCase() === type.toLowerCase())
      );
    };
    
    // Helper function to check egg group matches
    const matchesEggGroups = (eggGroups: string[] = []) => {
      if (activeFilters.eggGroups.length === 0) return true;
      return activeFilters.eggGroups.every(group =>
        eggGroups.some(g => g.toLowerCase() === group.toLowerCase())
      );
    };
    
    // Helper function to check ability matches
    const matchesAbilities = (abilities: Record<string, string>) => {
      if (activeFilters.abilities.length === 0) return true;
      const abilityValues = Object.values(abilities || {}).map(a => a.toLowerCase());
      return activeFilters.abilities.every(ability =>
        abilityValues.includes(ability.toLowerCase())
      );
    };
    
    // Helper function to check tier matches
    const matchesTier = (tier: string = '') => {
      if (activeFilters.tiers.length === 0) return true;
      return activeFilters.tiers.some(t => 
        tier.toLowerCase() === t.toLowerCase()
      );
    };
    
    // Filter based on current category and search term
    if (currentSearchCategory === 'pokemon') {
      let results = pokemon;
      
      // Apply active filters
      if (Object.values(activeFilters).some(arr => arr.length > 0)) {
        results = results.filter(p => 
          matchesTypes(p.types) &&
          matchesEggGroups(p.eggGroups) &&
          matchesAbilities(p.abilities) &&
          matchesTier(p.tier)
        );
      }
      
      // Apply search query if present
      if (searchQuery && pokemonFuse) {
        const searchResults = pokemonFuse.search(searchQuery).map(result => result.item);
        // Preserve filter results but reorder based on search relevance
        if (Object.values(activeFilters).some(arr => arr.length > 0)) {
          const searchResultIds = new Set(searchResults.map(p => p.id));
          results = results.filter(p => searchResultIds.has(p.id));
          // Reorder based on search results order
          results.sort((a, b) => {
            const aIndex = searchResults.findIndex(p => p.id === a.id);
            const bIndex = searchResults.findIndex(p => p.id === b.id);
            return aIndex - bIndex;
          });
        } else {
          results = searchResults;
        }
      }
      console.log('Filtered Pokémon:', results);
      setFilteredPokemon(results);
    } else {
      // If not viewing Pokémon category, just apply search query
      if (searchQuery) {
        if (pokemonFuse) {
          setFilteredPokemon(pokemonFuse.search(searchQuery).map(result => result.item));
        }
      } else {
        setFilteredPokemon(pokemon);
      }
    }
    
    // Filter moves
    if (currentSearchCategory === 'moves') {
      if (searchQuery && movesFuse) {
        setFilteredMoves(movesFuse.search(searchQuery).map(result => result.item));
      } else {
        setFilteredMoves(moves);
      }
    } else {
      if (searchQuery && movesFuse) {
        setFilteredMoves(movesFuse.search(searchQuery).map(result => result.item).slice(0, 50));
      } else {
        setFilteredMoves([]);
      }
    }
    
    // Filter abilities
    if (currentSearchCategory === 'abilities') {
      if (searchQuery && abilitiesFuse) {
        setFilteredAbilities(abilitiesFuse.search(searchQuery).map(result => result.item));
      } else {
        setFilteredAbilities(abilities);
      }
    } else {
      if (searchQuery && abilitiesFuse) {
        setFilteredAbilities(abilitiesFuse.search(searchQuery).map(result => result.item).slice(0, 50));
      } else {
        setFilteredAbilities([]);
      }
    }
    
    // Filter items
    if (currentSearchCategory === 'items') {
      if (searchQuery && itemsFuse) {
        setFilteredItems(itemsFuse.search(searchQuery).map(result => result.item));
      } else {
        setFilteredItems(items);
      }
    } else {
      if (searchQuery && itemsFuse) {
        setFilteredItems(itemsFuse.search(searchQuery).map(result => result.item).slice(0, 50));
      } else {
        setFilteredItems([]);
      }
    }
    
  }, [
    pokemon, 
    moves, 
    abilities, 
    items, 
    searchQuery, 
    activeFilters, 
    currentSearchCategory,
    pokemonFuse,
    movesFuse,
    abilitiesFuse,
    itemsFuse
  ]);
  
  return {
    filteredPokemon,
    filteredMoves,
    filteredAbilities,
    filteredItems
  };
}