import { useEffect, useState } from "react";
import { formatPokemonSpec, parsePokemonSpec } from "./pokemonSpecParser";
import { PokemonSprite } from "@/app/smartrotom/pokedex/_components/PokemonSprite";
import Image from "next/image";
import { usePokemonStore } from "@/stores/pokemonStore";
import type { Pokemon } from "@/app/smartrotom/pokedex/_types/pokemon";

interface PokemonImageProps {
  type?: string;
  itemId: string;
  amount?: number;
  size?: number;
  showDetails?: boolean;
}

export const PokemonImage = ({ 
  type = "", 
  itemId, 
  amount = 0, 
  size = 32,
  showDetails = false 
}: PokemonImageProps) => {
  // ItemID is a Pokemon spec, formatted like in Pixelmon, for example "Rattata lvl:5", "Arceus s lvl:100", "Raichu f:Alolan"
  const [imageError, setImageError] = useState(false);
  const [pokemonData, setPokemonData] = useState<Pokemon | undefined>(undefined);
  const [dexNumber, setDexNumber] = useState<number>(0);
  const { allPokemon, pokemonByDex, fetchAllPokemon, getPokemonByDex } = usePokemonStore();
  
  const pokemonSpec = parsePokemonSpec(itemId);
  const formattedName = formatPokemonSpec(pokemonSpec);
  
  // Effect to load Pokémon data from the store
  useEffect(() => {
    // Ensure we have all Pokémon data
    if (allPokemon.length === 0) {
      fetchAllPokemon();
    }
    
    // Find the Pokémon in our store by name
    const findPokemonByName = () => {
      const speciesName = pokemonSpec.species.toLowerCase();
      const foundPokemon = allPokemon.find(p => 
        p.name.toLowerCase() === speciesName || 
        p.name.toLowerCase().replace('-', '') === speciesName
      );
      
      if (foundPokemon) {
        setPokemonData(foundPokemon);
        setDexNumber(foundPokemon.dex);
      }
    };
    
    findPokemonByName();
  }, [allPokemon, pokemonByDex, pokemonSpec.species, fetchAllPokemon, getPokemonByDex, pokemonData]);
  
  // Use form from the spec or default to empty string
  const formValue = pokemonSpec.form || "";
  
  // Use palette from the spec or default to empty string
  const paletteValue = pokemonSpec.isShiny ? 'shiny' : pokemonSpec.palette || "";

  // If we have a valid dex number, use PokemonSprite
  if (dexNumber > 0) {
    return (
      <div className="relative group flex space-x-2">
        <div className="relative">
          <PokemonSprite
            id={dexNumber}
            form={formValue}
            palette={paletteValue}
            width={size}
            height={size}
            pixelated={true}
            hide={false}
            showStatus={false}
            forceBlack={false}
            displayName={false}
          />
        </div>
        
        {showDetails && (
          <div className="flex flex-col">
            <span className="font-medium text-sm">{pokemonSpec.species}</span>
            {pokemonSpec.level && <span className="text-xs text-gray-600">Lv.{pokemonSpec.level}</span>}
            {pokemonSpec.form && <span className="text-xs text-gray-500">{pokemonSpec.form}</span>}
          </div>
        )}
      </div>
    );
  }
};