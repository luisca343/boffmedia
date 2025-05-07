import { useState, useEffect } from "react";
import { ModdedDex } from "@pkmn/dex";

export function usePokedexData(moddedDex: ModdedDex | null) {
  const [moves, setMoves] = useState<Array<{ id: string; name: string; type: string; basePower: number; category: string }>>([]);
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([]);
  const [abilities, setAbilities] = useState<Array<{ id: string; name: string }>>([]);
  const [pokemonAbilities, setPokemonAbilities] = useState<Record<string, string[]>>({});
  const [isLoaded, setIsLoaded] = useState(false);

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

      setIsLoaded(true);
    }
  }, [moddedDex]);

  // Get abilities for a specific Pokémon
  const getPokemonAbilities = (pokemonId: string, pokemonList: any[]): string[] => {
    if (pokemonAbilities[pokemonId]) {
      return pokemonAbilities[pokemonId];
    }

    const speciesData = pokemonList.find(p => p.id === pokemonId);
    if (speciesData && speciesData.abilities) {
      // Collect all abilities from the abilities object
      const availableAbilities = Object.values(speciesData.abilities)
        .filter(ability => ability) // Filter out empty/undefined abilities
        .map(ability => String(ability)); // Convert to string
          
      // Cache the result
      setPokemonAbilities(prev => ({
        ...prev,
        [pokemonId]: availableAbilities
      }));
      
      return availableAbilities;
    }
    
    return [];
  };

  return {
    moves,
    items,
    abilities,
    getPokemonAbilities,
    isLoaded
  };
}