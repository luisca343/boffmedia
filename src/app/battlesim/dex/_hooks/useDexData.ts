'use client';

import { useState, useEffect } from 'react';
import { GenerationId, getDexAndGen } from '../../calc/_utils/generations';

export function useDexData(generationId: GenerationId) {
  const [pokemon, setPokemon] = useState<any[]>([]);
  const [moves, setMoves] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [abilities, setAbilities] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    async function loadDexData() {
      try {
        setIsLoaded(false);
        
        const { dex, genInstance } = await getDexAndGen(generationId);
        
        // Load Pokémon data
        const pokemonData = Object.values(dex.species.all())
          .filter((p: any) => !p.isNonstandard || p.isNonstandard === 'Past')
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            num: p.num,
            types: p.types,
            baseStats: p.baseStats,
            abilities: p.abilities,
            eggGroups: p.eggGroups,
            tier: p.tier,
            weightkg: p.weightkg
          })).sort((a, b) => a.num - b.num);
        
        // Load moves data
        const movesData = Object.values(dex.moves.all())
          .filter((m: any) => !m.isNonstandard || m.isNonstandard === 'Past')
          .map((m: any) => ({
            id: m.id,
            name: m.name,
            type: m.type,
            category: m.category,
            power: m.basePower,
            accuracy: m.accuracy,
            pp: m.pp,
            desc: m.desc || m.shortDesc
          }));
        
        // Load abilities data
        const abilitiesData = Object.values(dex.abilities.all())
          .filter((a: any) => !a.isNonstandard || a.isNonstandard === 'Past')
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            desc: a.desc || a.shortDesc
          }));
        
        // Load items data
        const itemsData = Object.values(dex.items.all())
          .filter((i: any) => !i.isNonstandard || i.isNonstandard === 'Past')
          .map((i: any) => ({
            id: i.id,
            name: i.name,
            desc: i.desc || i.shortDesc
          }));
        
        setPokemon(pokemonData);
        setMoves(movesData);
        setAbilities(abilitiesData);
        setItems(itemsData);
        setIsLoaded(true);
        
      } catch (error) {
        console.error('Error loading Pokédex data:', error);
        // Set empty arrays as fallback
        setPokemon([]);
        setMoves([]);
        setAbilities([]);
        setItems([]);
        setIsLoaded(true);
      }
    }
    
    loadDexData();
  }, [generationId]);
  
  return {
    pokemon,
    moves,
    items,
    abilities,
    isLoaded
  };
}