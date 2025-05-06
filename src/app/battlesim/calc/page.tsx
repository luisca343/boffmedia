'use client';

import { TerasDex } from "../TerasDex";
import { useState, useEffect } from "react";
import { Generations } from '@smogon/calc';
import { ModdedDex } from "@pkmn/dex";
import CalculatorForm from "./_components/CalculatorForm";

export default function DamageCalculator() {
  const [moddedDex, setModdedDex] = useState<ModdedDex | null>(null);
  const [genInstance, setGenInstance] = useState(null);
  const [pokemon, setPokemon] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const dex = await TerasDex;
      setModdedDex(dex);
      
      // Get the Gen 9 instance from Generations (which is already an instance)
      const gen = Generations.get(9);
      setGenInstance(gen);
      
      const pokemonList = Object.entries(dex.species.all())
        .map(([id, species]) => ({
          id,
          name: species.name,
          num: species.num,
          types: species.types || [],
          baseStats: species.baseStats || {},
        }))
        .filter(poke => poke.num > 0)
        .sort((a, b) => a.num - b.num);
      
      setPokemon(pokemonList);
      setIsLoading(false);
    }
    
    fetchData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Damage Calculator</h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading calculator data...</p>
        </div>
      ) : (
        <CalculatorForm 
          moddedDex={moddedDex} 
          genInstance={genInstance} 
          pokemon={pokemon} 
        />
      )}
    </div>
  );
}